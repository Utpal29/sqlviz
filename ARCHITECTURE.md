# SQLViz — Architecture Document

## 1. System Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Client)                   │
│                                                      │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Monaco Editor│  │  React UI  │  │ Custom SVG   │  │
│  │ (SQL Input)  │  │ (Results)  │  │ Plan Graph   │  │
│  └──────┬───────┘  └─────▲──────┘  └──────▲───────┘  │
│         │                │                │          │
│         ▼                │                │          │
│  ┌──────────────────────────────────────────────┐    │
│  │              Zustand Stores                   │    │
│  │  database · editor · results · compare · ui   │    │
│  └──────┬───────────────┬──────────────┬─────────┘    │
│         ▼               ▼              ▼              │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │ Execute  │  │   EXPLAIN  │  │   Introspect    │   │
│  │  Query   │  │   Parser   │  │     Schema      │   │
│  └────┬─────┘  └─────┬──────┘  └────────┬────────┘   │
│       │              │                   │            │
│       ▼              ▼                   ▼            │
│  ┌──────────────────────────────────────────────┐    │
│  │         sql.js (SQLite → WASM)                │    │
│  │  ┌──────────────────────────────────────┐    │    │
│  │  │   In-Memory SQLite DB                │    │    │
│  │  │   (seeded with dataset SQL)          │    │    │
│  │  └──────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Landing route (separate bundle, lazy):              │
│  ┌─────────────────────────┐                         │
│  │  R3F Canvas (hero)      │                         │
│  │  Lenis + GSAP ScrollT.  │                         │
│  └─────────────────────────┘                         │
└──────────────────────────────────────────────────────┘
```

Zero network calls for query execution. Everything runs in the browser's main thread via WASM. Landing assets (R3F, GSAP, Lenis) live in a separate route bundle so they never load on `/play`.

---

## 2. Data Flow

### 2.1 Query Execution Flow
```
User types SQL
   │
   ▼
Monaco → editorStore (debounced)
   │
   ▼  (Cmd+Enter or Run)
queryValidator.ts — basic syntax pre-flight
   │
   ▼
databaseStore.executeQuery(sql)
   │   ├──► db.exec(sql)        → resultsStore.lastResult
   │   └──► db.exec("EXPLAIN…") → explainParser → resultsStore.lastPlan
   │
   ▼
UI subscribes via Zustand selectors:
   - ResultsTable renders rows
   - PlanGraph renders tree
   - StatusBar shows timing
```

### 2.2 Dataset Loading Flow
```
User picks dataset (Header or Cmd+K)
   │
   ▼
databaseStore.loadDataset(name)
   │   ├──► destroy existing db instance
   │   ├──► new SQL.Database()
   │   ├──► db.run(seedSQL)
   │   └──► schemaIntrospector.getSchema() → databaseStore.schema
   │
   ▼
Subscribers update:
   - SchemaExplorer rebuilds tree
   - Monaco completion provider re-registers
   - editorStore loads dataset's starter query
```

### 2.3 Comparison Mode Flow
```
User toggles Compare → compareStore.enabled = true
   │
   ▼
Editor splits into two buffers (A, B)
   │
   ▼  (Run)
Both queries execute sequentially
   │
   ▼
PlanCompare renders two PlanGraphs side-by-side
   - Synchronized zoom via shared viewBox state
   - Node diff highlighting (rings on nodes unique to one plan)
```

---

## 3. Core Module Specifications

### 3.1 Database Engine (`engine/database.ts`)

```typescript
interface DatabaseEngine {
  init(): Promise<void>;
  loadDataset(name: DatasetName): Promise<void>;
  destroy(): void;

  executeQuery(sql: string): QueryResult;
  explainQuery(sql: string): ExplainResult;

  getSchema(): DatabaseSchema;
  getTablePreview(table: string, limit?: number): QueryResult;
}

interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  executionTimeMs: number;
  error?: { message: string; line?: number; column?: number };
}

interface ExplainResult {
  raw: ExplainRow[];
  tree: PlanNode;
}
```

**Design decisions:**
- Single database instance held in `databaseStore` (Zustand).
- Synchronous execution. Move to Web Worker only if profiling reveals >100ms main-thread blocking on real queries.
- Dataset switching drops and re-creates the DB — simpler than partial state cleanup, no stale-state bugs.

**Future backend extension point:**
The `DatabaseEngine` interface is the single seam. A future `engine/remoteDatabase.ts` could implement the same interface against a Postgres backend without changing any component. Components only know about the interface, not sql.js specifically.

### 3.2 EXPLAIN Parser (`engine/explainParser.ts`)

SQLite's `EXPLAIN QUERY PLAN` returns:
```
id | parent | notused | detail
0  | 0      | 0       | SCAN customers
1  | 0      | 0       | SEARCH orders USING INDEX idx_cust (customer_id=?)
2  | 0      | 0       | USE TEMP B-TREE FOR ORDER BY
```

Parser logic:
1. Run `EXPLAIN QUERY PLAN <query>`.
2. Build tree from `id`/`parent` relationships.
3. Classify each node by keyword in `detail`:

| Keyword pattern | Type | Notes |
|---|---|---|
| `SCAN <table>` (no index) | `scan` | Full table scan — `isExpensive: true` |
| `SEARCH <table> USING INDEX` | `search` | Index lookup |
| `SEARCH <table> USING COVERING INDEX` | `search` | Note covering for hint |
| `USE TEMP B-TREE FOR ORDER BY` | `sort` | `isExpensive: true` |
| `USE TEMP B-TREE FOR GROUP BY` | `sort` | |
| `MERGE` | `join` | Merge join |
| `CO-ROUTINE` | `cte` | CTE materialization |
| `COMPOUND` | `compound` | UNION/INTERSECT/EXCEPT |
| `CORRELATED` / `LIST SUBQUERY` | `subquery` | |

```typescript
type PlanNodeType =
  | 'scan' | 'search' | 'sort' | 'filter'
  | 'join' | 'subquery' | 'compound' | 'cte';

interface PlanNode {
  id: number;
  type: PlanNodeType;
  detail: string;        // raw SQLite detail string
  tableName?: string;
  indexName?: string;
  isExpensive: boolean;
  hint?: string;         // rule-based optimization tip
  children: PlanNode[];
}
```

**Honest limitation:** SQLite's EXPLAIN doesn't give row estimates or per-node timing. Cost indication is rule-based heuristics, not measured data. We surface this in the UI ("estimated cost — based on operation type") rather than pretending it's measured.

### 3.3 Schema Introspector (`engine/schemaIntrospector.ts`)

Queries:
- `SELECT name, sql FROM sqlite_master WHERE type='table'`
- `PRAGMA table_info(<table>)` for each table
- `PRAGMA foreign_key_list(<table>)`
- `PRAGMA index_list(<table>)`
- `SELECT COUNT(*) FROM <table>` for row counts (cached per dataset load)

Returns:
```typescript
interface DatabaseSchema {
  tables: TableInfo[];
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKey[];
  indexes: IndexInfo[];
  rowCount: number;
}
```

Feeds the Schema Explorer sidebar and Monaco's completion provider.

---

## 4. Query Plan Visualization (Hero Feature)

### 4.1 Why custom SVG (not React Flow)
- SQLite plans are small (typically <15 nodes). React Flow's pan/zoom/canvas machinery is overkill.
- Full control over the Apple-spatial aesthetic — custom SVG filters for glass blur, custom edge shapes, animated `stroke-dasharray` for flow.
- ~100KB bundle savings, no extra dependency to learn or fight.

### 4.2 Layout algorithm (`PlanGraph/layout.ts`)
Simple recursive top-down:
1. Walk tree post-order to compute each subtree's width.
2. Walk pre-order to assign x-positions (center each parent over its children).
3. Assign y-positions by depth × row height.
4. Return `Map<nodeId, {x, y, width, height}>`.

For up to ~30 nodes this is instant and produces clean output. No dagre, no force simulation.

### 4.3 Node visual treatment

| Node Type | Icon | Color token | Meaning |
|---|---|---|---|
| Full Table Scan | 🔍 | `--node-scan` | Reading every row — usually expensive |
| Index Search | ⚡ | `--node-search` | Using index — efficient |
| Sort | ↕️ | `--node-sort` | ORDER BY / temp b-tree |
| Filter | 🔽 | `--node-filter` | WHERE filtering |
| Join | 🔗 | `--node-join` | Combining tables |
| Subquery | 📦 | `--node-subquery` | Nested execution |
| CTE | 🔄 | `--node-cte` | WITH materialization |
| Compound | ➕ | `--node-subquery` | UNION / INTERSECT / EXCEPT |

Each SVG node is a `<g>`:
- Rounded `<rect>` with `fill="var(--bg-glass)"`, `backdrop-filter` via SVG `<filter>` (Gaussian blur of underlying content).
- Icon (Lucide SVG inline).
- Label (table or index name).
- Cost dot (green/yellow/red).

On click, a `<Popover>` (shadcn) shows:
- Full `detail` string from EXPLAIN.
- Optimization hint if `hint` is set ("Consider adding an index on `customers.city`").

### 4.4 Edges
- Cubic Bézier `<path>` between parent center-bottom and child center-top.
- During playback, animated `stroke-dasharray` makes a dash "flow" along the edge.
- Edge label (only on hover) shows estimated rows if available.

### 4.5 Step-through animation (`PlanAnimator.tsx`)
- Walk the tree in execution order (post-order — children before parents).
- For each step, Framer Motion animates:
  - Previous node: drop opacity to 0.4
  - Current node: scale 1 → 1.05, glow border on
  - Edge from parent: animate `pathLength` 0 → 1 (240ms)
- Caption (`<motion.div>`) updates: "Scanning all 500 rows of customers…"
- Controls: play / pause / step forward / step back / restart.
- Speed slider: 0.5× to 2×.
- All animation respects `prefers-reduced-motion` — if set, no transitions, just instant state changes.

### 4.6 Comparison mode (`PlanCompare.tsx`)
- Two `PlanGraph`s side-by-side (stacked on narrower windows).
- Shared zoom/pan: both share a `viewBox` state in `compareStore`.
- Node-level diff:
  - Nodes only in plan A → red ring.
  - Nodes only in plan B → green ring.
  - Same node, different cost → yellow ring.
- "Diff key" legend appears when comparison is active.

---

## 5. State Management — Zustand Stores

Five small, topic-scoped stores. Each is a thin slice; no monolithic store.

```typescript
// databaseStore — DB instance, current dataset, schema
interface DatabaseStore {
  engine: DatabaseEngine | null;
  currentDataset: DatasetName;
  schema: DatabaseSchema | null;
  status: 'idle' | 'initializing' | 'loading' | 'ready' | 'error';
  init: () => Promise<void>;
  loadDataset: (name: DatasetName) => Promise<void>;
}

// editorStore — editor text, history
interface EditorStore {
  query: string;
  history: QueryHistoryItem[];
  setQuery: (q: string) => void;
  pushHistory: (item: QueryHistoryItem) => void;
}

// resultsStore — last result + plan
interface ResultsStore {
  lastResult: QueryResult | null;
  lastPlan: PlanNode | null;
  activeTab: 'results' | 'plan' | 'compare';
  setActiveTab: (t: 'results' | 'plan' | 'compare') => void;
}

// compareStore — A/B comparison
interface CompareStore {
  enabled: boolean;
  queryA: string;
  queryB: string;
  resultA: { result: QueryResult; plan: PlanNode } | null;
  resultB: { result: QueryResult; plan: PlanNode } | null;
  viewBox: { x: number; y: number; w: number; h: number };
}

// uiStore — panel sizes, theme, palette
interface UIStore {
  panelSizes: { schema: number; editor: number; results: number };
  theme: 'dark' | 'light';
  paletteOpen: boolean;
  setPanelSizes: (s: UIStore['panelSizes']) => void;
  toggleTheme: () => void;
  setPaletteOpen: (open: boolean) => void;
}
```

**Persistence:** Only `uiStore` (panel sizes, theme) and `editorStore.history` are persisted to localStorage via `zustand/middleware/persist`. Everything else is ephemeral.

**Selector discipline:** Components use selectors (`useStore(s => s.specificField)`) to avoid re-renders when unrelated fields change.

**Future backend extension point:**
Stores are the natural sync boundary. A future "save to cloud" feature wraps the existing persist middleware with a remote sync layer — components never know.

---

## 6. Landing Page Architecture

The landing page (`routes/index.tsx`) is structurally separate from the playground and lazy-loaded.

### 6.1 R3F Hero (`Hero3D.tsx`)
- Single `<Canvas>` covering the hero viewport.
- Scene: an animated wireframe sphere or instanced grid of cubes representing "data rows." Subtle continuous rotation; reacts to mouse position with slight parallax.
- Lighting: ambient + one directional with bloom postprocessing (via `@react-three/postprocessing`).
- `<Suspense fallback={<HeroSkeleton />}>` so it never blocks first paint.
- Bundled via dynamic import so `/play` never loads three.js.

### 6.2 Scroll story (`ScrollStory.tsx`)
- Lenis wraps the page for inertial smooth scrolling.
- GSAP ScrollTrigger drives:
  - 3D camera dolly as user scrolls past hero into feature sections.
  - Section-by-section feature reveals (fade + slide).
  - Pinned demo segment where a scripted query+plan animates as the user scrolls.
- All ScrollTrigger animations have a `prefers-reduced-motion` fallback that disables pinning and just shows sections statically.

### 6.3 Sections (top to bottom)
1. **Hero** — 3D mesh + tagline + "Try the playground" CTA.
2. **Write SQL** — scripted Monaco-styled editor screenshot with typing animation.
3. **See it run** — results table appearing with stagger.
4. **Understand the why** — pinned plan graph stepping through its animation as user scrolls.
5. **Compare queries** — two plans side-by-side rendering, showing the diff.
6. **Datasets** — quick grid of the four datasets with hover previews.
7. **CTA footer** — "Open SQLViz" → `/play`.

---

## 7. Challenge System

### 7.1 Validation strategies

```typescript
function validateExactMatch(actual: QueryResult, expected: unknown[][]): boolean;
function validateRowCount(actual: QueryResult, expected: number): boolean;
function validateColumnsMatch(
  actual: QueryResult,
  requiredColumns: string[],
  expectedRowCount?: number
): boolean;
function validateCustom(actual: QueryResult, validatorBody: string): boolean;
```

For `validateCustom`, the validator body is a string parsed into a `Function` constructor — sandboxed to receive only `actual`. Challenges with custom validators are bundled at build time, so this isn't user-supplied code; just a way to express complex checks declaratively.

### 7.2 Progression
- **Easy (3):** SELECT, WHERE, ORDER BY, LIMIT, COUNT, basic aggregates.
- **Medium (3):** JOINs, GROUP BY + HAVING, subqueries, DISTINCT, CASE.
- **Hard (3):** Window functions, CTEs, self-joins, correlated subqueries.

Expansion to 15+ only if user behavior shows challenges are being completed.

### 7.3 Per-challenge state (in-memory)
- `completed: boolean`
- `bestExecutionTimeMs: number | null`
- `attempts: number`

Stored in a Zustand slice. localStorage-persisted on deployed site.

**Future backend extension point:** Leaderboards / shared best times would require user identity. Local state can be uploaded once an account exists, then merged with server state.

---

## 8. Performance Considerations

| Concern | Mitigation |
|---|---|
| WASM load time | Skeleton UI + lazy-load sql.js; preload `<link rel="preload">` for WASM binary on `/play` |
| Large seed inserts | Wrap dataset seeds in a single transaction; chunk to ~500 rows per `INSERT` if needed |
| Main thread blocking | Datasets kept <10K rows. Profile real queries; move to Worker only if measured >100ms |
| Monaco bundle size | Dynamic `import('@monaco-editor/react')`, SQL language only, no full language pack |
| R3F bundle size | Landing-only route. Code-splitting via React Router lazy routes. `/play` never imports three |
| SVG plan re-renders | `PlanGraph` memoized on plan-tree identity; layout cached per plan |
| Framer Motion overdraw | Use `layoutId` sparingly; avoid `layout` on plan nodes during playback (manual `animate`) |
| Memory leaks | `db.close()` on dataset switch; subscriptions cleaned up in `useEffect` returns |
| Lenis/GSAP on `/play` | Both are landing-only; not imported in the playground route |

---

## 9. Accessibility

- All interactive elements keyboard-navigable. shadcn primitives give us this for free on dialogs/menus/popovers.
- Monaco has built-in accessibility (screen reader mode toggleable).
- Plan graph: every node is a focusable `<g>` with `role="button"` and `tabindex="0"`; Enter opens its detail popover.
- Color + icon for node types (not color alone) — critical for colorblind users.
- Status bar messages use `aria-live="polite"` for query results, `aria-live="assertive"` for errors.
- `prefers-reduced-motion` honored across Framer Motion, GSAP, Lenis, and the SVG edge animations.
- Contrast: all token combinations verified for WCAG AA on dark background.
- DesktopGate has a clear, friendly explanation, not an error.

---

## 10. Testing Strategy

| Layer | Tool | Coverage target |
|---|---|---|
| Unit | Vitest | `explainParser`, `queryValidator`, `schemaIntrospector`, `layout.ts`, validation functions |
| Component | Testing Library | `ResultsTable` pagination, `ChallengeRunner` pass/fail, `PlanNode` click → popover |
| Integration | Vitest + jsdom | Full "type SQL → run → see results + plan" flow against a real sql.js instance |
| Visual | Storybook (optional, Wave 3) | Plan nodes in every state, theme variants |
| Manual | Checklist per release | All 4 datasets load; all 9 challenges solvable; playback works at 0.5×/1×/2×; compare mode diffs correctly |

No E2E framework in Wave 1. Add Playwright if/when a regression bites.

---

## 11. Deployment

- **Hosting:** Vercel (free tier).
- **Build:** `npm run build` → static assets in `dist/`.
- **WASM:** sql.js WASM loaded from `https://sql.js.org/dist/` (CDN). Fallback: bundle locally if CDN flakiness shows up.
- **Routes:** `/` (landing), `/play` (playground). Code-split per route via React Router's lazy loading.
- **Domain:** `sqlviz.vercel.app` to start; custom domain later if it earns one.
- **CI:** Vercel auto-deploys from `main`. PRs get preview URLs.
- **Analytics:** Vercel Analytics (privacy-friendly, no cookies). Track only `/play` enter, query run, challenge complete — no query content.

---

## 12. Future Backend Extension Points (Backlog)

Architected for "backend-optional, not backend-required." The current design intentionally leaves these seams:

| Future feature | Seam to extend |
|---|---|
| User accounts / cloud-saved queries | `editorStore` persist middleware → swap localStorage for remote sync |
| Shared challenge leaderboards | Challenge state slice → upload to backend, merge on login |
| AI "explain this query" | New `/api/explain` route; `EditorToolbar` button calls it with current query + plan |
| Postgres / MySQL dialect mode | New `engine/remoteDatabase.ts` implementing `DatabaseEngine` interface |
| User-uploaded CSV → table | Stays client-side; no backend needed (sql.js can `CREATE TABLE` + bulk INSERT) |
| Analytics on common queries | Privacy-respecting opt-in; backend logs only |
| Embed mode (iframe for blogs) | Static, no backend needed; just a `?embed=1` query param mode |
| Multiplayer / collaborative editing | Yjs + a WebSocket relay (later, if ever) |

**Likely first backend addition:** Supabase. Postgres + auth + storage in one service, free tier, ~1 day to wire to existing stores. Or a single Vercel serverless route + Upstash Redis for low-stakes things like share-link de-duplication.

**Principle:** Don't add a backend until a feature exists that genuinely requires one *and* has users asking for it. Speculative backends become speculative maintenance burdens.

---

## 13. Open Questions (To Resolve During Wave 1)

- **R3F hero on low-end devices:** Should we detect `navigator.hardwareConcurrency < 4` and serve a static hero fallback? Decide after profiling on a mid-tier Chromebook.
- **Monaco vs CodeMirror revisit:** If the Monaco bundle balloons past 1MB after our customizations, reconsider CodeMirror 6 in Wave 2.
- **Plan node hint engine:** Rule-based now ("if SCAN on column appearing in WHERE → suggest index"). Anything more sophisticated waits for real user feedback.
- **Comparison mode UX:** Split editor vertically or stack? Test both with real queries before committing.
