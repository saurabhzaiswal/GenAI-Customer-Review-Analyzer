# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Replaced frontend parent-traversal imports with `@app/*` and `@env/*` source-root aliases.
- Localized the existing native jsPDF dashboard report labels and dates, with self-hosted Noto fonts for correct Hindi, Japanese, and Korean glyph encoding.
- Added bounded batch-analysis concurrency and history request caching while preserving result order.
- Added production canonical metadata, `robots.txt`, and `sitemap.xml` for the Reviews and Dashboard routes.
- Replaced repository row-loading counts with SQL `COUNT(*)`, removed the unused direct `requests` dependency, and added the real backend package description.
- Implemented Claude review analysis with the official Anthropic SDK, Pydantic structured output, configurable key/model, bounded timeout/retries, and consistent provider errors.
- Added CSV and Excel bulk import plus filtered Excel and PDF report export; heavy file libraries load only when requested.
- Added ngx-translate runtime i18n for English, Hindi, Japanese, Dutch, Korean, French, German, and Spanish.
- Added persistent dark mode and language preferences in the navbar.
- Matched the navbar exactly to the shared hero gradient and aligned the fixed loader with the same brand colors.
- Added GitHub, LinkedIn, and DEV Community links with Material icons to the footer.
- Replaced the vulnerable `xlsx` package with ExcelJS and pinned its nested UUID dependency to a patched release; production audit reports zero vulnerabilities.
- Added central API composition in `app/api/router.py` and `app/api/v1/router.py` without changing public URLs.
- Moved database-session ownership out of route handlers. Persistence operations use a request-scoped repository/service chain; analysis-only requests remain database-free.
- AI providers are imported lazily so an unused provider package cannot prevent startup.
- Matched the Reviews page hero to the Dashboard customer-intelligence gradient and typography.
- Replaced the history row delete button with a three-dot action menu containing View details and Delete actions.
- Added a Material review-details dialog and retained confirmation before deletion.
- Made paginator and sorter attachment resilient when history data renders asynchronously; added timestamp-aware date sorting and a filtered-empty table state.
- Standardized frontend corner radii at a maximum of 12px, including Angular Material overlay surfaces.
- Added centralized primary, secondary, semantic, surface, border, focus, shadow, and `color-mix()` theme tokens.
- Added a fixed three-pixel global loading bar above the navbar; API-only request tokens now prevent static assets, duplicate completion, or synchronous interceptor failures from leaving it active.
- Added a mobile review-history card layout while retaining the sortable desktop table and shared paginator.
- Improved the footer with product identity, application navigation, technology summary, and responsive stacking.
- Made dashboard summary cards and sections responsive down to narrow mobile widths and memoized dashboard statistics with an Angular computed signal.
- Reorganized every shared/feature component and page into a colocated component folder and updated lazy-route imports.
- Expanded `index.html` SEO with Open Graph, Twitter, robots, application metadata, and WebApplication JSON-LD.
- Replaced CommonJS `dayjs` with native `Intl.DateTimeFormat`, tree-shook Chart.js registrations, and lazy-loaded Vercel Analytics.
- Replaced the overlapping nested mobile navbar menus with a left-to-right drawer, flat navigation, inline language grid, backdrop, and theme control.
- Improved every Chart.js tooltip with theme-aware contrast, clearer review counts, sentiment percentages, and touch-friendly interaction; removed redundant chart eyebrow labels.
- Completed the frontend i18n pass across dashboard metrics, chart headings and tooltips, review forms/results, empty states, history cards/dialogs, import/export notices, validation errors, navigation accessibility text, and localized dates for all eight languages.
- Reworked light/dark surfaces to use semantic theme tokens across dashboard sections, charts, review forms, cards, tables, dialogs, and Material overlays; refined the desktop navigation pill and mobile drawer header.
- Redesigned PDF export as a dashboard-style branded report with the app logo, summary metrics, sentiment distribution, ranked themes, review cards, long-review continuation pages, and page numbering.
- Strengthened CI with locked development tools, backend audit/lint/format/compile checks, frontend unit tests and production build, migration verification, merge-queue support, least-privilege permissions, timeouts, and one stable `CI required` gate for branch protection.

### Production fixes
- Enabled SQLAlchemy `pool_pre_ping` and a five-minute `pool_recycle` for stale Neon connections.
- Prevented a failed rollback from masking the original request exception.
- Converted Gemini failures and invalid output into consistent, readable API errors.
- Restored `DELETE /api/v1/reviews/{feedback_id}`, which the frontend calls.

### Fixed
- `app/common/enums.py` was missing `from enum import Enum`, which would raise `NameError` the moment the module was imported. Added the import.
- `FeedbackResponse.id` was typed as `str` while the ORM column is a native `uuid.UUID` - under Pydantic v2 this can raise a validation error when building the response straight from the SQLAlchemy model. Retyped as `UUID`.
- `LoggingMiddleware` used `print()` instead of the app's configured `logger` (`app/utils/logger.py`). Switched to `logger.info(...)` and added status code + request ID to the log line.

### Known issues / recommended next fixes (not yet applied)
- `services/gemini_service.py` and `services/feedback_service.py` are superseded, unused duplicates of `services/ai/gemini_provider.py` and `services/review_service.py`. Safe to delete.
- `middleware/cors.py` allows only a single origin (`settings.APP_URL`). Fine for one environment; consider a comma-separated `CORS_ORIGINS` env var if you need to allow both a local and deployed frontend at once.
- `app/core/exceptions.py` (an unused `register_exception_handlers`) and `app/core/security.py` (empty placeholder) exist but aren't wired into `main.py` - the real exception handlers live in `app/exceptions/handlers.py`. Worth consolidating so the two similarly-named modules don't confuse future contributors.
- Root-level `test/` folder contains an early, fully-commented-out Streamlit-era prototype (`api.py`, `model.py`). Historically interesting, functionally dead - candidate for deletion or moving into `docs/` as a "how it started" note.

## Project history (reconstructed from development notes)

### Phase 1 - Prototype
- Single-script prototype: `sqlite3` + raw SQL in one `database.py`, no ORM, no layering.
- Direct Gemini calls, no abstraction over the AI provider.

### Phase 2 - Move to a real ORM
- Evaluated SQLAlchemy 2.0, SQLModel, and Tortoise ORM.
- Chose **SQLAlchemy 2.0 + Alembic + PostgreSQL** over SQLite for production-style migrations, relationships, and connection pooling.
- Adopted **UUIDv7** (via the `uuid6` package) for primary keys instead of UUIDv4, for time-sortable, index-friendly IDs.

### Phase 3 - Layered backend architecture
- Split the single-file backend into `api/` (controllers), `services/` (business logic), `repositories/` (persistence), `schemas/` (Pydantic I/O contracts), and `models/` (SQLAlchemy ORM), mirroring a NestJS + Prisma-style separation of concerns.
- Added FastAPI dependency-injection wiring (`app/dependencies/services.py`) with `lru_cache`-backed singletons.

### Phase 4 - Multi-provider AI layer
- Introduced an abstract `AIProvider` base class and an `AIProviderFactory` (Factory + Dependency Inversion pattern), so the AI backend is chosen at runtime via `AI_PROVIDER` in `.env`.
- Implemented Gemini, OpenAI, and Claude providers behind the shared AI provider interface.
- Hardened the analysis prompt against prompt injection and added explicit handling for abusive, gibberish, or empty input.

### Phase 5 - Robustness & middleware
- Added `RequestIDMiddleware` (tags every request/response with `X-Request-ID`) and `LoggingMiddleware`.
- Added a custom exception hierarchy (`AppException` and subclasses) with centralized handlers returning a consistent `{success, message, path}` JSON shape.
- Added `bleach`-based input sanitization (`utils/sanitizer.py`) ahead of both the AI call and the database write.

### Phase 6 - Angular frontend
- Built out Angular 21 with standalone components and signals, Angular Material + Tailwind CSS for UI, and Chart.js for analytics.
- Implemented `Review` and `Dashboard` features: batch review input, AI analysis cards, a searchable/sortable/paginated history table (Angular Material Table), and sentiment/theme/trend charts.
- Added functional-style HTTP interceptors: request tagging, global loading state, and global error → snackbar notifications.

### Planned (not yet implemented)
- JWT authentication & role-based access control (`core/security.py` currently empty).
- CI pipeline: GitHub Actions running Ruff, Black, Pytest, and Angular build/tests (nothing configured yet).
- Docker & Docker Compose for Angular + FastAPI + PostgreSQL + Redis.
- Real-time streaming responses.
