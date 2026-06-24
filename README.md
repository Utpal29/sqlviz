# SQLViz

**The SQL playground that shows you the *why*.**

SQLViz is a browser-based SQL playground that lets you write queries against sample datasets, see results instantly, and visualize how the query actually executes. It runs entirely client-side using SQLite compiled to WebAssembly — no backend, no accounts, works offline.

Live: https://sqlviz.vercel.app

## Features

- **Real SQLite in the browser** via sql.js (WASM)
- **Schema-aware Monaco editor** with autocomplete for tables, columns, qualified columns, and aliases
- **Query plan visualization** — custom SVG tree of `EXPLAIN QUERY PLAN`, color-coded by node type, with step-through playback
- **Compare mode** — run two queries side by side with diff rings on plan differences
- **Multiple datasets** — e-commerce, music, employees, social
- **Query history** persisted to localStorage with search and per-item delete
- **Command palette** (Cmd/Ctrl+K)
- **SQL formatter**, resizable panels, read-only safety, dataset reset

## Tech Stack

React + TypeScript, Vite, Tailwind CSS, Zustand, sql.js, Monaco Editor, Framer Motion, Radix UI, cmdk, sql-formatter.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview the production build
```

The playground lives at `/play`. Open `http://127.0.0.1:5173/` (or whichever port Vite picks) after `npm run dev`.

## Deployment

Push to `main`. Vercel picks up the build automatically.

## License

MIT
