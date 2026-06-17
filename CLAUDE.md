# SQLViz — Interactive SQL Playground & Query Visualizer

## Project Overview

SQLViz is a browser-based SQL playground that lets users write queries against sample datasets, see results instantly, and visualize how queries execute step-by-step. It runs entirely client-side using SQLite compiled to WebAssembly — no backend, no server costs, works offline.

**One-liner:** "The SQL playground that shows you the *why*."

**Positioning:** Tool-first. A serious dev playground that happens to teach. Challenges exist as a side mode; the playground + plan visualization carry the story.

**Target audience:** CS students, bootcamp learners, interview preppers, junior–mid devs who want to deeply understand SQL execution.

**Live URL:** https://sqlviz.vercel.app

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React 18 + TypeScript | Type safety, component model |
| Build | Vite 5 | Fast HMR, native WASM support |
| Styling | Tailwind CSS 3 | Utility-first, rapid iteration |
| UI primitives | shadcn/ui + Radix | Accessible dialogs, tooltips, menus, popovers |
| State | Zustand | Small, ergonomic, cleaner than Context for cross-panel state |
| SQL Engine | sql.js (SQLite → WASM) | Full SQL in-browser, zero backend |
| Code Editor | Monaco Editor | VS Code-quality editing + custom completion provider |
| Query Plan Viz | **Custom SVG** + Framer Motion | Lighter than React Flow; full control over Apple-spatial aesthetic |
| Animation | Framer Motion | Plan step-through playback, panel transitions, micro-interactions |
| Landing 3D | React Three Fiber + drei | Hero animated database/query mesh |
| Scroll story | Lenis (smooth scroll) + GSAP ScrollTrigger | Scroll-driven landing narrative |
| Command palette | cmdk | Cmd+K for dataset switching, query actions, navigation |
| Icons | Lucide React | Consistent, lightweight |
| Deployment | Vercel | Free tier, instant deploys, edge CDN |

**Dropped from earlier plan:** React Flow (replaced with custom SVG), Recharts (no chart view in Wave 1).

---

## Visual Direction

### Aesthetic
**Apple-style spatial.** Glassmorphism with restraint, depth via subtle shadows and blur, smooth physics-based motion, hover parallax on cards. Never gaudy — feels like a high-end developer tool that happens to be beautiful.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#0A0E17` | Main background |
| `--bg-secondary` | `#111827` | Panel backgrounds (with `backdrop-blur`) |
| `--bg-elevated` | `#1A2233` | Cards, dropdowns, modals |
| `--bg-glass` | `rgba(26,34,51,0.6)` | Glassmorphic panels over 3D backgrounds |
| `--border` | `#1E293B` | Panel dividers, hairlines |
| `--border-glow` | `rgba(59,130,246,0.3)` | Focus/hover borders |
| `--text-primary` | `#E2E8F0` | Body text |
| `--text-muted` | `#64748B` | Labels, secondary text |
| `--accent` | `#3B82F6` | Primary actions, links |
| `--accent-glow` | `#3B82F620` | Subtle accent backgrounds |
| `--success` | `#10B981` | Successful queries, correct answers |
| `--warning` | `#F59E0B` | Slow queries, caution |
| `--error` | `#EF4444` | Query errors, failed validation |
| `--node-scan` | `#8B5CF6` | SCAN nodes (expensive) |
| `--node-search` | `#06B6D4` | INDEX SEARCH nodes (efficient) |
| `--node-join` | `#EC4899` | JOIN nodes |
| `--node-sort` | `#F97316` | SORT / temp b-tree nodes |
| `--node-filter` | `#3B82F6` | WHERE / filter nodes |
| `--node-subquery` | `#6366F1` | Subquery / correlated nodes |
| `--node-cte` | `#14B8A6` | CTE / WITH nodes |

### Typography
- **Display / Headings:** Inter (700, tight tracking, slight optical sizing)
- **Code / Editor / Plan node labels:** JetBrains Mono (ligatures on)
- **Body / UI:** Inter (400/500)

### Motion principles
- Default ease: `cubic-bezier(0.16, 1, 0.3, 1)` (Apple-like)
- Panel transitions: 240ms
- Hover micro-interactions: 150ms
- Plan step-through: 800ms per node, staggered
- All animations respect `prefers-reduced-motion`

### Layout
Three-panel resizable layout once inside the playground:
```
┌──────────────────────────────────────────────┐
│  Header: Logo · Dataset · Cmd+K · Theme       │
├────────────┬─────────────────────────────────┤
│            │   SQL Editor (Monaco)            │
│  Schema    │                                  │
│  Explorer  ├─────────────────────────────────┤
│            │   Results | Plan | Compare       │
│            │   (tabbed)                       │
├────────────┴─────────────────────────────────┤
│  Status: 142 rows · 23ms · dataset:ecommerce  │
└──────────────────────────────────────────────┘
```

### Signature element
The **query plan visualization** is the hero. Custom SVG tree, color-coded nodes by type, glassmorphic detail panel on click, Framer-Motion-driven step-through playback, and a side-by-side comparison mode for "before vs. after" query rewrites.

---

## Architecture (Directory Structure)

```
src/
├── components/
│   ├── Landing/
│   │   ├── Hero3D.tsx              # R3F animated mesh hero
│   │   ├── ScrollStory.tsx         # GSAP ScrollTrigger sections
│   │   ├── FeatureShowcase.tsx     # Scroll-pinned feature reveals
│   │   └── CTAFooter.tsx           # "Try it now" handoff to /play
│   ├── Editor/
│   │   ├── SQLEditor.tsx           # Monaco wrapper
│   │   ├── EditorToolbar.tsx       # Run, format, clear, share
│   │   └── completions.ts          # Schema-aware completion provider
│   ├── Results/
│   │   ├── ResultsTable.tsx        # Paginated, sortable
│   │   └── ResultsTabs.tsx         # Results | Plan | Compare
│   ├── QueryPlan/
│   │   ├── PlanGraph.tsx           # Custom SVG tree renderer
│   │   ├── PlanNode.tsx            # SVG node with icon + label
│   │   ├── PlanEdge.tsx            # SVG path with animated stroke
│   │   ├── PlanAnimator.tsx        # Step-through playback controller
│   │   ├── PlanCompare.tsx         # Side-by-side comparison view
│   │   ├── PlanLegend.tsx          # Color/icon legend
│   │   └── layout.ts               # Tree layout algorithm (custom, no dagre)
│   ├── Schema/
│   │   ├── SchemaExplorer.tsx      # Sidebar tree
│   │   ├── ERDiagram.tsx           # Wave 3: auto ER diagram
│   │   └── TablePreview.tsx        # Hover/click table peek
│   ├── Challenges/
│   │   ├── ChallengeList.tsx
│   │   ├── ChallengeCard.tsx
│   │   ├── ChallengeRunner.tsx
│   │   └── ChallengeComplete.tsx
│   ├── CommandPalette/
│   │   └── CommandPalette.tsx      # cmdk wrapper, Cmd+K
│   ├── Layout/
│   │   ├── AppShell.tsx
│   │   ├── PanelResizer.tsx
│   │   ├── Header.tsx
│   │   ├── StatusBar.tsx
│   │   └── DesktopGate.tsx         # Friendly mobile gate
│   └── ui/                         # shadcn primitives (button, dialog, etc.)
├── engine/
│   ├── database.ts                 # sql.js init, exec, lifecycle
│   ├── datasets.ts                 # Dataset registry + loader
│   ├── explainParser.ts            # EXPLAIN QUERY PLAN → tree
│   ├── queryValidator.ts           # Pre-flight validation
│   └── schemaIntrospector.ts       # sqlite_master + PRAGMA
├── store/
│   ├── databaseStore.ts            # Zustand: DB instance, current dataset
│   ├── editorStore.ts              # Zustand: query text, cursor, history
│   ├── resultsStore.ts             # Zustand: last result, last plan
│   ├── compareStore.ts             # Zustand: A/B query state
│   └── uiStore.ts                  # Zustand: panel sizes, theme, palette open
├── datasets/
│   ├── ecommerce.sql
│   ├── music.sql
│   ├── employees.sql
│   └── social.sql
├── challenges/
│   ├── index.ts
│   ├── types.ts
│   ├── easy/
│   ├── medium/
│   └── hard/
├── hooks/
│   ├── useExecuteQuery.ts          # Run + capture plan in one call
│   ├── useExplainPlan.ts
│   └── useKeyboardShortcuts.ts
├── utils/
│   ├── sqlFormatter.ts
│   ├── exportUtils.ts              # CSV / JSON
│   ├── shareUtils.ts               # Encode query + dataset → URL
│   └── motion.ts                   # Shared Framer Motion variants
├── routes/                         # File-based routing
│   ├── index.tsx                   # Landing page
│   └── play.tsx                    # Playground
├── App.tsx
├── main.tsx
└── index.css
```

---

## Sample Datasets

### 1. E-Commerce (default)
- `customers` (id, name, email, city, created_at)
- `products` (id, name, category, price, stock)
- `orders` (id, customer_id, total, status, created_at)
- `order_items` (id, order_id, product_id, quantity, unit_price)
- `reviews` (id, product_id, customer_id, rating, comment, created_at)

~500 customers, ~200 products, ~2000 orders, ~5000 order_items, ~1500 reviews.

### 2. Music Library
- `artists` (id, name, genre, country)
- `albums` (id, artist_id, title, year, label)
- `tracks` (id, album_id, title, duration_ms, track_number)
- `playlists` (id, name, description, created_at)
- `playlist_tracks` (playlist_id, track_id, position)

### 3. Employees (Classic)
- `employees` (id, name, department_id, manager_id, salary, hire_date)
- `departments` (id, name, budget, location)

### 4. Social Network
- `users` (id, username, bio, joined_at)
- `posts` (id, user_id, content, created_at, likes_count)
- `comments` (id, post_id, user_id, content, created_at)
- `follows` (follower_id, following_id)

---

## Challenge System

```typescript
interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  dataset: string;
  hints: string[];
  concepts: string[];
  validation: {
    type: 'exact_match' | 'row_count' | 'columns_match' | 'custom';
    expected?: unknown;
    expectedRowCount?: number;
    requiredColumns?: string[];
    customValidator?: string;
  };
  starterQuery?: string;
  solutionQuery: string;
}
```

**Initial set: 9 challenges (3 easy / 3 medium / 3 hard).** Expand to 15+ only if engagement justifies it.

---

## Build Phases

### Wave 1 — Functional Playground (~2 weeks)
**Goal: a deployed playground that works, even without the landing wrap.**
1. Vite + React + TS + Tailwind scaffold
2. shadcn/ui setup, base UI primitives
3. Zustand stores skeleton
4. sql.js integration (WASM load, init, exec)
5. E-commerce dataset seeding
6. Monaco editor with custom dark theme
7. Results table (pagination, basic sorting)
8. EXPLAIN QUERY PLAN parsing → tree
9. **Custom SVG plan graph (static)** — no animation yet
10. Schema explorer sidebar
11. Resizable panel layout
12. Status bar (timing, row count, errors)
13. Desktop gate for mobile
14. Vercel deployment at `/play`

### Wave 2 — The "Cool" Layer (~3 weeks)
15. Landing page route with R3F hero mesh
16. Lenis smooth scroll + GSAP scroll-driven feature reveals
17. **Plan step-through animation** (Framer Motion playback controller)
18. **Side-by-side plan comparison** mode
19. cmdk command palette (Cmd+K)
20. All 4 datasets + switcher
21. Schema-aware Monaco autocomplete (tables, columns, aliases)
22. Query history (localStorage on the deployed site)
23. SQL formatter button
24. Inline editor hints (ghost text, schema hovers, format-on-save)

### Wave 3 — Polish & Growth (~2–3 weeks)
25. 9 challenges (3/3/3)
26. ER diagram auto-generated from schema
27. Shareable query links (encoded in URL)
28. Light theme
29. Keyboard shortcuts (Cmd+Enter run, Cmd+/ format, etc.)
30. Export results CSV / JSON
31. Rule-based performance tips panel (no AI in Wave 3)
32. SEO + Open Graph for sharing
33. Subtle ambient 3D in playground background (optional, behind a setting)

---

## Development Commands

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview build locally
npx tsc --noEmit     # Type check
```

Deploy via Vercel Git integration on push to `main`.

---

## Key Implementation Notes

### sql.js WASM
```typescript
import initSqlJs from 'sql.js';

const SQL = await initSqlJs({
  locateFile: (file) => `https://sql.js.org/dist/${file}`,
});
const db = new SQL.Database();
```
- Initialize once, store in Zustand `databaseStore`.
- sql.js is synchronous — fine for datasets <10K rows. Move to Web Worker only if profiling shows >100ms blocking.

### Custom SVG Plan Viz
- Tree layout: simple recursive top-down with horizontal centering of siblings. No dagre, no React Flow.
- Each node: SVG `<g>` with rect (rounded, glass fill via `<filter>` blur), icon, label.
- Edges: cubic Bézier paths with animated `stroke-dasharray` for "flowing" effect during playback.
- Container is zoomable/pannable via simple viewBox math (no library).

### Plan Step-Through
- `PlanAnimator` walks the tree in execution order (post-order for most cases).
- Each step: highlight current node (Framer Motion `animate` on opacity + scale), animate edge stroke from parent.
- Caption updates ("Scanning all 500 rows of customers…").
- Play / pause / step buttons in toolbar.

### Plan Comparison
- User toggles "Compare" mode → editor splits or stacks two query buffers.
- Both run on Run → two `PlanGraph`s render side-by-side with synchronized zoom.
- Differences highlighted: nodes only in one plan get a colored ring.

### Zustand Stores
Keep stores small and topic-scoped. Use selectors to prevent over-rendering. Persist `uiStore` (panel sizes, theme) and `editorStore.history` to localStorage.

### shadcn/ui
Use for: Dialog (challenge complete, share), Tooltip (everywhere), Popover (plan node detail), DropdownMenu (dataset picker), Tabs (results), Toast (errors, query success).

### R3F Hero
- Single canvas in landing hero only.
- Animated mesh: instanced cubes or a wireframe sphere representing "data."
- Camera does slow ScrollTrigger-driven dolly as user scrolls into feature sections.
- Suspense fallback so it never blocks first paint.

### Monaco
- Lazy-import via dynamic `import()` so it doesn't bloat the landing bundle.
- Custom theme matching design tokens.
- Register completion provider with current schema from Zustand.
- Format-on-save via `sql-formatter`.

---

## Mobile Strategy
- Landing page: fully responsive (R3F hero degrades gracefully or hides under a breakpoint).
- Playground (`/play`): desktop-only with a friendly `DesktopGate.tsx` shown under `lg` breakpoint. Message: "SQLViz needs a bigger canvas. Come back on desktop."

---

## File Naming Conventions
- Components: PascalCase (`SchemaExplorer.tsx`)
- Hooks: camelCase with `use` prefix
- Utils / stores / engine: camelCase
- Datasets: lowercase `.sql`
- Challenges: kebab-case folders, `index.ts` registry

## Code Style
- Functional components only
- Named exports for components, default export for route pages
- Explicit TypeScript types — no `any` unless unavoidable
- Tailwind for styling (no CSS modules, no styled-components)
- Destructure props in function signature
- Co-locate component + tightly-coupled hook

---

## Non-Goals (Explicitly Out of Scope)
- No backend / server-side execution
- No user accounts / authentication
- No real database connections
- No PostgreSQL / MySQL dialect support
- No collaborative editing
- No mobile editor support (read-only marketing site is the line)
- No AI features in Wave 1–3 (revisit post-launch)
