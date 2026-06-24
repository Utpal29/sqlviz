# SQLViz

**The SQL playground that shows you the *why*.**

SQLViz is a browser-based SQL playground that lets you write queries against sample datasets, see results instantly, and visualize how the query actually executes. It runs entirely client-side using SQLite compiled to WebAssembly — no backend, no accounts, works offline.

## Features

- **Real SQLite in the browser** via sql.js (WASM)
- **Schema-aware Monaco editor** with autocomplete for tables, columns, qualified columns, and aliases — plus hover popovers for the schema
- **Query plan visualization** — custom SVG tree of `EXPLAIN QUERY PLAN`, color-coded by node type, with step-through playback, drag-to-pan, fit-to-view, and a mini-map
- **Performance tips panel** — rule-based suggestions (full scans, sort B-trees, correlated subqueries, missing FK indexes) with copy-pasteable `CREATE INDEX` snippets
- **Compare mode** — run two queries side by side with diff rings on plan differences
- **Challenges** — 9 hand-picked SQL challenges (3 easy / 3 medium / 3 hard), validated against a live solution query, with progressive hints and persistent progress
- **ER diagram** — auto-generated schema diagram with PK / FK badges and curved foreign-key edges
- **Multiple datasets** — e-commerce, music, employees, social
- **Query history** persisted to `localStorage` with search and per-item delete
- **Command palette** (Cmd/Ctrl+K) for everything
- **Light & dark themes** with system-preference detection and no flash on first paint
- **Export results** as CSV or JSON, **share queries** via URL, **SQL formatter** (Cmd/Ctrl+S to format on save)

## Routes

- `/` — Landing page with R3F hero and scroll story
- `/play` — Desktop SQL playground

## Tech stack

React + TypeScript, Vite, Tailwind CSS, Zustand, sql.js, Monaco Editor, Framer Motion, Radix UI, cmdk, sql-formatter, React Three Fiber + drei + three, GSAP ScrollTrigger, Lenis.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview the production build
```

Open the URL Vite prints (default `http://127.0.0.1:5173/`). The landing page is at `/` and the playground is at `/play`.
