# Frontend

Angular 21 frontend for the GenAI Customer Review Analyzer. It provides customer-review analysis, saved-history management, and client-side analytics.

## Main features

- Standalone Angular components and signal-based feature state
- Shared customer-intelligence visual system across Reviews and Dashboard
- Review history with combined search, sentiment, theme, and minimum-score filtering
- Sortable Material table with 5/10/20-row pagination
- Three-dot row actions, review-details dialog, and delete confirmation
- Global loading and error interceptors
- Fixed top loading bar limited to backend API calls, with per-request tokens that cannot be stranded by duplicate or out-of-order completion
- Component-per-folder structure for shared UI, feature UI, and feature pages
- Centralized `--primary-color`/`--secondary-color` theme with `color-mix()` derivatives
- Build-time prerendered Reviews and Dashboard HTML with route-specific SEO/social metadata, followed by Angular client hydration
- Runtime ngx-translate dictionaries for eight languages, a globe-triggered
  selector with compact ISO codes (`EN`, `HI`, `JA`, `NL`, `KO`, `FR`, `DE`,
  `ES`), and persistent dark mode
- CSV/Excel review import and filtered Excel/PDF report export via lazy dependencies
- Dashboard-style jsPDF reports with product branding, summary metrics, sentiment bars, ranked themes, paginated review cards, long-review continuation handling, selected-language labels, and locale-specific embedded Noto fonts
- Source-root TypeScript aliases (`@app/*` and `@env/*`) replace fragile parent-traversal imports
- Bounded three-request batch concurrency and a shared in-flight history cache reduce waiting and duplicate API work
- Cached filter parsing, stable list tracking, one-pass dashboard aggregation, and cached PDF font conversion reduce repeated client work
- Canonical metadata, `robots.txt`, and `sitemap.xml` use the production Vercel URL
- Maximum 12px radius for buttons, fields, cards, containers, and Material overlays
- Flat mobile navigation drawer with inline languages, theme control, backdrop dismissal, and no nested popovers
- Theme-aware native Chart.js tooltips with review counts, sentiment percentages, and mobile-friendly interaction
- Complete UI translation coverage for English, Hindi, Japanese, Dutch, Korean, French, German, and Spanish, including dynamic chart text, dialogs, notices, empty states, and localized dates
- Semantic light/dark surface, state, table, text, border, focus, and overlay
  tokens used consistently by feature components and Material controls

## Development

```bash
npm install
npm run start
```

The development app runs at `http://localhost:4200` and reads its API URL from `src/environments/environment.development.ts`.

From the repository root, `docker compose up --build` can run this development
server together with FastAPI, PostgreSQL, and Redis. Compose is optional.

## Production build

```bash
npm run build
```

Build output is written to `dist/frontend`. The current build reports the configured initial/component-style budget warnings, but the former `dayjs` CommonJS warning has been removed.

## Tests

```bash
npm test
```

When changing `ReviewHistoryComponent`, verify search and each filter both independently and together, change page sizes, navigate pages, sort every column, open View details, cancel deletion, and confirm deletion.

See [`../docs/LOW_LEVEL_DESIGN.md`](../docs/LOW_LEVEL_DESIGN.md) for frontend state ownership, class relationships, request sequences, export flow, and performance decisions.
