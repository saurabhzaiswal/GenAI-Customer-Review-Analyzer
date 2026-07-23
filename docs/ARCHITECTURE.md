# Architecture

This is the canonical architecture note. The similarly named older files are retained as historical design drafts.

For implementation-level class diagrams, sequence diagrams, state ownership, persistence details, and scaling boundaries, see [`LOW_LEVEL_DESIGN.md`](./LOW_LEVEL_DESIGN.md).

## Request flow

```text
Angular -> middleware -> master API router -> v1 router -> route -> CachedReviewService
                                                                      |
                                                               ReviewService
                                                                /            \
                                                        AIProvider    FeedbackRepository
                                                                            |
                                                                  request Session
                                                                            |
                                                               shared Engine/pool -> Neon
```

`app/api/router.py` is the top-level composition point. It mounts health routes and `/api/v1`; `app/api/v1/router.py` groups version-one modules. Middleware remains configured in `main.py`.

## Dependency lifetimes

- `Engine`: process-wide, thread-safe connection pool; equivalent to Go's `*sql.DB`.
- `Session`: one per database request because it owns transaction and ORM identity-map state.
- Database repository/service: request-scoped because they hold that session.
- AI provider and analysis-only service: process-cached. `/analyze` never waits for Neon.
- Redis client: optional process-wide async pool, initialized lazily and closed by the lifespan hook.
- Cached analysis facade: process-cached and database-free; Redis hits bypass the configured AI provider.

FastAPI constructs these dependencies in `app/dependencies/services.py`. Route handlers no longer accept or forward raw sessions.

## Optional Redis boundary

`REDIS_URL` is the feature switch for both Redis capabilities. When absent,
startup skips Redis and local development behaves exactly as before. When
present, `app/core/redis.py` creates one `redis.asyncio` client with bounded
timeouts and graceful shutdown. Connection failures use a short retry backoff
and fail open.

`RateLimitMiddleware` applies only to the two expensive AI POST routes. An
atomic Redis script performs `INCR` and the first-request `EXPIRE`, creating a
60-second fixed window per client IP and endpoint. Limits are centralized in
one mapping.

`CachedReviewService` decorates only analysis-without-save. It hashes normalized
sanitized review text and partitions keys by provider and model. Valid,
successful `AnalysisResponse` values live for 24 hours. Validation failures,
provider errors, rate-limit responses, and analyze-and-save operations are not
cached.

`CachedFeedbackService` implements cache-aside history reads. A history miss
loads PostgreSQL through the existing `ReviewService`/repository chain and
stores validated `FeedbackResponse` values for 10 minutes. Successful create
and delete operations remove `review_history:all`; the next read repopulates
the cache. PostgreSQL remains the source of truth.

## Local observability boundary

`MetricsMiddleware` records low-cardinality route templates rather than raw
paths, preventing UUID values from becoming unbounded Prometheus labels.
`InstrumentedAIProvider` decorates the existing provider abstraction, so
Gemini, OpenAI, and Claude share one latency/error instrumentation path without
modifying provider implementations. Cache adapters, rate limiting, and the
repository record only the metrics owned by their respective layers.

The `/metrics` endpoint uses the standard Prometheus text format. Local
Prometheus scrapes FastAPI and cAdvisor every 15 seconds; Grafana reads only
Prometheus and receives its datasource/dashboard through file provisioning.
This observability stack exists in Docker Compose only and does not alter
Vercel, Render, Neon, or Upstash production deployment. `METRICS_ENABLED`
defaults to false and Compose explicitly enables it.

## Production latency

The observed 17-32 second first requests followed by a roughly 500 ms request are consistent with cold/warm infrastructure behavior. Render may start the Python service, Neon may resume compute for persistence calls, and Gemini adds network and inference time. Browser timing alone cannot assign exact seconds to each layer. Compare `/health` (Render), `/history` (Render + Neon), and `/analyze` (Render + AI) after idle and while warm.

`pool_pre_ping`, `pool_recycle=300`, and LIFO pool reuse protect against stale Neon connections while preferring recently used connections. GZip reduces larger JSON responses, and `ix_feedbacks_created_at` supports newest-first history reads. These measures cannot eliminate provider cold starts. A strict sub-second target requires always-on infrastructure and may still be unrealistic for synchronous LLM inference.

## Error flow

Gemini failures are wrapped in `AIProviderException` and handled centrally. A failed database rollback cannot replace the original exception. Responses retain the common `{ success, message, data }` envelope.

`ClaudeProvider` uses the official Anthropic Python SDK. It calls the Messages API through `messages.parse()` with `AnalysisResponse` as the Pydantic output type, a bounded timeout, and SDK retries. `ANTHROPIC_API_KEY`/`CLAUDE_MODEL` are provider-specific overrides; the key falls back to the shared `AI_API_KEY`. Refusals, truncated output, SDK failures, and missing parsed output are normalized to `AIProviderException`.

## Frontend interaction architecture

```text
ReviewPageComponent
    -> ReviewService signals (loading, errors, results, saved history)
    -> ReviewApiService
    -> ApiService + HTTP interceptors
    -> FastAPI

ReviewHistoryComponent
    -> MatTableDataSource
       -> combined search/sentiment/theme/min-score predicate
       -> MatSort with timestamp-aware created-date accessor
       -> MatPaginator (5, 10, or 20 rows)
    -> three-dot MatMenu
       -> ReviewDetailsDialogComponent
       -> ConfirmDialogComponent -> delete event -> ReviewService
```

The history component binds `MatPaginator` and `MatSort` through `ViewChild` setters. This matters because the table is rendered only after asynchronous history data exists; a one-time `ngAfterViewInit` assignment can run too early. Every filter change resets pagination to the first page, and `matNoDataRow` distinguishes an empty filter result from an empty saved-history collection.

The review details dialog is read-only and receives the selected `Feedback` record through `MAT_DIALOG_DATA`. Deletion remains outside that dialog and always requires explicit confirmation before the page emits the delete request.

## Visual system

Both primary pages use the same customer-intelligence hero language: navy-to-blue gradient, cyan eyebrow, high-contrast heading, and muted supporting copy. The global `--radius` token is `12px`; application containers and Angular Material buttons, form fields, menus, dialogs, tooltips, snackbars, paginator, and tables must not exceed it. Component-specific values may be smaller but never larger.

Theme values originate in `src/styles.scss`. `--primary-color` and `--secondary-color` feed darker, lighter, alpha, surface, border, focus, shadow, page-gradient, and brand-gradient tokens through CSS `color-mix()`. Semantic success, warning, danger, neutral, text, and inverse tokens cover states that should not be derived from the brand hue. Chart.js reads these CSS custom properties at render time, keeping canvas charts synchronized with the CSS theme.

Feature styles must consume semantic `--surface`, `--surface-muted`, `--text-color`, `--text-muted`, `--border`, and `--shadow-color` tokens rather than fixed light-theme colors. The `.dark-theme` root overrides these tokens and Material overlay surfaces, so cards, forms, tables, dialogs, menus, and canvas tooltips switch as one visual system.

Runtime copy lives in the eight JSON dictionaries under `public/i18n`. Templates use `TranslatePipe`; imperative UI such as chart callbacks, dialogs, snackbars, and interceptor errors uses `TranslateService`. Date formatting follows the active language and rerenders when the locale changes. Product names, external service names, and user/API-authored review content intentionally remain untranslated.

The shared language model stores both the ngx-translate locale and its compact
ISO 639-1 display code. The desktop navbar retains one recognizable globe
trigger, while its menu and the mobile drawer render `EN`, `HI`, `JA`, `NL`,
`KO`, `FR`, `DE`, and `ES` from one source of truth. `JA` identifies the
Japanese language; `JP` is the ISO country code for Japan.

## Responsive rendering

The history feature uses one filtered `MatTableDataSource` and one paginator for two presentations:

- Desktop/tablet: sortable Material table.
- Mobile: paginated review cards with the same horizontal three-dot menu and dialogs.

Only presentation changes; search/filter state and data are shared. The dashboard uses responsive hero metrics, single-column content on narrow screens, constrained chart canvases, and overflow-safe grid children.

Below 768px, the desktop navbar actions become one fixed drawer that enters from the left. Navigation, language selection, and theme controls share a single scrollable surface, avoiding nested overlay menus and preserving a clear dismissal backdrop. The desktop language menu remains a Material overlay.

Dashboard charts use Chart.js canvas-native tooltips rather than external tooltip DOM containers. Tooltips derive surface, text, and border colors from the active theme, use non-intersect interaction for touch targets, and format counts and sentiment percentages in context. Chart cards keep one semantic heading and do not add persistent data-label overlays.

PDF report export is generated client-side and lazy-loads jsPDF only when requested. The report retains the native vector dashboard design: application logo, geometric branded header, summary metrics, sentiment bars, ranked themes, paginated review cards, long-review continuation handling, and page footers. Interface labels and date formatting come from the active ngx-translate language; customer review content remains unchanged. Hindi, Japanese, and Korean exports load the matching self-hosted Noto TTF from `public/fonts` and embed only the used glyphs; Latin-language exports retain jsPDF's compact built-in font.

## Loading and performance

`LoadingService` tracks backend API subscriptions with unique request tokens rather than a numeric counter. The loading interceptor ignores translations and other static assets, starts tracking at subscription time, and releases the exact token on completion, error, cancellation, or synchronous downstream failure. `MainLayoutComponent` renders one fixed, full-width progress bar above the sticky navbar only while at least one API token remains active.

The GitHub Actions workflow runs for pull requests and merge groups targeting `master`, plus pushes to `master`. Locked development dependencies provide pip-audit, Ruff, and Pytest; separate jobs validate the backend, frontend, and Alembic migrations. A final `CI required` aggregation job is the stable status check configured in the `master` ruleset.

Feature pages remain lazy-loaded. Vercel Analytics is dynamically imported after Angular bootstraps, Chart.js registers only the controllers/elements/scales/plugins used by the three charts, dashboard statistics are memoized with `computed()`, and native `Intl.DateTimeFormat` replaces the CommonJS `dayjs` dependency. Batch analysis uses three bounded workers while retaining input order, and history loading shares one in-flight request and then reuses signal state across lazy-route navigation.

## Frontend component structure

Every UI component is colocated with its template, styles, and tests:

```text
components/
  review-history/
    review-history.component.ts
    review-history.component.html
    review-history.component.scss
    review-history.component.spec.ts
```

Feature pages follow the same convention under `pages/<page-name>/`. Layout components were already organized by folder. This keeps relative assets local and makes component ownership explicit.

Imports that cross component or feature boundaries use the `@app/*` source-root alias; environment imports use `@env/*`. Local `./` imports remain appropriate for colocated files. Parent-traversal imports are intentionally disallowed because moving a component should not require rewriting a chain of `../../../` segments.

## SEO shell

Angular prerenders the Reviews and Dashboard routes during the production
build, producing route-specific static HTML before client hydration. Crawlers
therefore receive the correct canonical URL, title, description, Open Graph,
and Twitter image without executing JavaScript. Shared defaults and JSON-LD
remain in `src/index.html`; `public/robots.txt` points to the production
sitemap.

## Internationalization and theme state

ngx-translate 18 is configured through standalone providers and loads `/i18n/<language>.json` at runtime. `UiPreferencesService` owns supported languages, persists the selected language/theme in local storage, updates the document language, and toggles the root `dark-theme` class. Current dictionaries cover English, Hindi, Japanese, Dutch, Korean, French, German, and Spanish; English is the fallback.

## Import and report export

`ReviewFormComponent` reads CSV natively and loads ExcelJS only for spreadsheet files. Imported cells are normalized into the existing one-review-per-line form, so validation and analysis use the same path as pasted reviews. `ReviewHistoryComponent` exports the currently filtered result set to Excel or PDF. ExcelJS and jsPDF are dynamic imports, keeping them out of the initial application bundle.

## Claude provider

`ClaudeProvider` calls `POST /v1/messages` with the configured model/key, an analysis-only prompt, low temperature, and bounded output. Text content is parsed as JSON and validated by `AnalysisResponse`; network, HTTP, parsing, and schema failures become the same user-safe `AIProviderException` used by other AI providers.
