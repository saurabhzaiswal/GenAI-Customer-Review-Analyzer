# Architecture

> This is an earlier design draft. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the current implementation.

This document describes the system as it is actually implemented in this repository - not an aspirational version. Where something is planned but not built yet, it's explicitly marked **(planned)**.

## 1. High-level view

```text
Angular 21 (standalone, signals)
        │  HTTP / REST (JSON)
        ▼
FastAPI application (app/main.py)
        │
        ▼
RequestIDMiddleware → LoggingMiddleware → CORSMiddleware
        │
        ▼
API Router  (/api/v1/reviews/*, / and /health unprefixed)
        │
        ▼
ReviewService (business logic)
        │
        ├──────────────┐
        ▼              ▼
   AIProvider     FeedbackRepository
 (Gemini/OpenAI)         │
        │                ▼
        ▼          PostgreSQL (SQLAlchemy 2.0 + Alembic)
  Google Gemini /
  OpenAI API
```

## 2. Backend request flow

Every request follows the same path - Route → Service → (AI Provider + Repository):

```text
HTTP Request
    │
    ▼
review_routes.py           (Controller - only receives/validates the HTTP shape)
    │
    ▼
Depends(get_review_service)  (app/dependencies/services.py)
    │
    ▼
ReviewService                (app/services/review_service.py - business logic)
    │
    ├── sanitize_text(review)   → bleach strips HTML/JS
    │        │
    │        ▼
    │   empty after sanitizing? → raise EmptyReviewException (400)
    │
    ├──────────────┐
    ▼              ▼
AIProvider     FeedbackRepository
(analyze)      (persist / query)
    │              │
    ▼              ▼
Gemini/OpenAI   PostgreSQL
    │              │
    └──────┬───────┘
           ▼
   Pydantic response schema
           │
           ▼
      JSON response
```

Each layer has exactly one job:

| Layer | File(s) | Responsibility |
|---|---|---|
| Controller | `app/api/v1/review_routes.py`, `app/api/health_routes.py` | Parse/validate the HTTP request, call the service, return the response model. No business logic. |
| Dependency wiring | `app/dependencies/services.py` | Caches the AI provider and database-free service; builds repository-backed services per request so each owns a request session. |
| Service | `app/services/review_service.py` | Orchestrates sanitization → AI analysis → persistence. The only place that knows the *order* of operations. |
| AI layer | `app/services/ai/*` | Talks to an LLM only. Nothing here knows about HTTP or the database. |
| Repository | `app/repositories/feedback_repository.py` | Talks to PostgreSQL only, via SQLAlchemy. Nothing here knows about HTTP or the AI provider. |
| Model | `app/models/feedback.py` | The SQLAlchemy table definition. |
| Schema | `app/schemas/feedback.py` | Pydantic request/response contracts - deliberately separate from the ORM model. |

This is the **Single Responsibility Principle** applied per-layer, and it's what makes each piece independently testable (you can unit test `ReviewService` with a fake `AIProvider` and a fake repository, with no HTTP or database involved).

## 3. AI provider layer - Factory + Dependency Inversion

`ReviewService` never talks to Gemini or OpenAI directly. It depends only on the abstract `AIProvider` interface:

```text
                   AIProvider (ABC)
                app/services/ai/provider.py
                        ▲
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  GeminiProvider   OpenAIProvider   ClaudeProvider
  (implemented)    (implemented)    (implemented)
```

Which concrete provider gets used is decided once, at startup, by `AIProviderFactory` (`app/services/ai/factory.py`), based on the `AI_PROVIDER` environment variable:

```text
.env: AI_PROVIDER=gemini
        │
        ▼
AIProviderFactory.create()
        │
        ▼
returns GeminiProvider()
        │
        ▼
ReviewService(ai_provider=GeminiProvider(), ...)
```

Adding a new provider (e.g. Azure OpenAI, Ollama) means writing one new class that implements `analyze_review()` and adding one branch to the factory - `ReviewService`, the routes, and the repository never change. This is the Dependency Inversion Principle in practice: the high-level module (`ReviewService`) depends on an abstraction, not on a concrete SDK.

### Prompt design

Both `GeminiProvider` and `OpenAIProvider` use the same structured-output contract (`AnalysisResponse`): `label`, `score`, `theme`, `suggestion`, `confidence`. The prompt explicitly instructs the model to:

- Return **only** valid JSON matching the schema, no markdown, no explanation.
- Classify sentiment even when the review contains profanity/abusive language, rather than refusing.
- Treat the review text strictly as data - ignore any instructions embedded inside it (prompt-injection resistance).
- Fall back to a safe default (`neutral` / score `3` / theme `"unknown"` / confidence `0.0`) for gibberish, spam, or empty-signal input.

Gemini is called via `google-genai`'s `generate_content` with `response_schema=AnalysisResponse` and `response_mime_type="application/json"`, OpenAI uses `client.responses.parse(...)`, and Claude uses Anthropic's structured Messages parsing. Each SDK validates the same Pydantic response contract.

## 4. Data model

Table: `feedbacks` (see `app/models/feedback.py` and Alembic revision `d79f95d19650_create_feedback_table.py`)

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` (Postgres native) | Primary key, default generated via `uuid6.uuid7()` - time-sortable, better index locality than UUIDv4. |
| `review` | `Text` | Sanitized review text (not the raw client input). |
| `label` | `String(20)` | `"positive" \| "neutral" \| "negative"`. |
| `score` | `Integer` | 1-5. |
| `theme` | `String(100)` | Short AI-extracted phrase (1-3 words). |
| `suggestion` | `Text`, nullable | AI-generated business suggestion. |
| `confidence` | `Float`, nullable | 0.0-1.0. |
| `created_at` | `DateTime(timezone=True)` | `server_default=func.now()`. |
| `updated_at` | `DateTime(timezone=True)` | `server_default` + `onupdate=func.now()`. |

Migrations are managed with Alembic (`backend/alembic/`); `alembic/env.py` reads `DATABASE_URL` from the same `Settings` object the app uses, so migrations always target the same database as the running app.

## 5. Validation & sanitization pipeline

```text
Client request
    │
    ▼
Pydantic (ReviewRequest: min_length=1, max_length=5000)
    │
    ▼
ReviewService.sanitize_text()  → bleach.clean(strip all tags/attrs)
    │
    ▼
empty after stripping? ──Yes──▶ raise EmptyReviewException (400)
    │
    No
    │
    ▼
AIProvider.analyze_review()
    │
    ▼
FeedbackRepository (only on the "analyze-and-save" path)
```

This gives three independent layers of defense before anything reaches the LLM or the database: request-size validation, HTML/script stripping, and a "is there actually anything left" business check.

## 6. Error handling

A small custom exception hierarchy (`app/exceptions/custom_exceptions.py`) carries a message and an HTTP status code:

- `AppException` (base)
  - `FeedbackNotFoundException` → 404
  - `AIProviderException` → 500
  - `DatabaseException` → 500
  - `ValidationException` → 400
  - `EmptyReviewException` → 400

Both `AppException` and the generic `Exception` are registered as FastAPI exception handlers in `app/main.py` (handlers defined in `app/exceptions/handlers.py`), so every error response - whether a known business exception or an unexpected crash - comes back in the same shape:

```json
{
  "success": false,
  "message": "Feedback not found.",
  "path": "/api/v1/reviews/9c3e...-...uuid"
}
```

Exception handlers are defined only in `app/exceptions/handlers.py` and registered by `main.py`.

## 7. Middleware stack

Applied in `app/main.py`, in this order:

1. `RequestIDMiddleware` - generates a UUID4 per request, stores it on `request.state.request_id`, and echoes it back as the `X-Request-ID` response header (useful for correlating a frontend error toast with a backend log line).
2. `LoggingMiddleware` - logs method + path (and, after the fix in this update, the response status code and request ID) via the shared `logger`.
3. `CORSMiddleware` (`register_cors`) - currently allows a single origin, `settings.APP_URL`.

## 8. Frontend architecture

Angular 21, standalone components, Signals for local component state.

```text
frontend/src/app/
├── core/
│   ├── api/api.service.ts            # thin wrapper around HttpClient; only file that knows the base URL
│   ├── config/api.config.ts          # reads environment.apiBaseUrl
│   ├── interceptors/                 # auth (request-id tagging), error (snackbar), loading (global spinner)
│   ├── models/api-response.ts
│   └── services/review-api.service.ts
├── features/
│   ├── reviews/                      # analyze, save, history table
│   │   ├── pages/review-page.component.ts
│   │   ├── components/ (review-form, review-card, review-history, sentiment-badge)
│   │   ├── models/ (review-request, analysis-response, feedback)
│   │   └── services/review.service.ts   # signals: analysisResults, savedFeedback, loading, error
│   └── dashboard/                    # stats + charts
│       ├── pages/dashboard-page.component.ts
│       └── components/analytics-charts.component.ts
├── layouts/ (navbar, footer, main-layout)
└── shared/ (components, pipes, enums, directives, types, interfaces)
```

Call chain for every HTTP request - no component ever injects `HttpClient` directly:

```text
Component
   │
   ▼
ReviewService (feature-level, holds signals + orchestration)
   │
   ▼
ReviewApiService (core/services - knows the /reviews/* endpoints)
   │
   ▼
ApiService (core/api - generic get/post/delete + base URL)
   │
   ▼
HttpClient  →  FastAPI
```

Three functional-style interceptors wrap every request:
- `AuthInterceptor` - currently tags each request with a generated `X-Request-ID` header (client-side correlation ID; this is *not* a real auth/JWT layer yet, despite the name - see planned work).
- `LoadingInterceptor` - flips a global `LoadingService` signal on/off around each request.
- `ErrorInterceptor` - catches any `HttpErrorResponse`, extracts a message, and surfaces it via `MatSnackBar`.

The Dashboard page computes its own statistics client-side from the already-fetched `savedFeedback` signal (total reviews, sentiment percentages, average score/confidence, top theme) rather than calling a separate analytics endpoint - there is currently no `/analytics` API route; all aggregation happens in `DashboardPageComponent.statistics`.

Charts (`AnalyticsChartsComponent`) use Chart.js directly (not a Chart.js Angular wrapper): a pie chart for sentiment distribution, a bar chart for theme distribution, and a line chart for score trend over time.

The review history table (`ReviewHistoryComponent`) uses Angular Material's `MatTableDataSource` with `MatPaginator` and `MatSort`, plus a custom `filterPredicate` driven by three reactive-form controls (free-text search, sentiment, theme) - search/filter/sort/pagination are real, implemented features, not placeholders.

## 9. What's intentionally not built yet

- **Auth**: `app/core/security.py` is an empty placeholder; there is no JWT/session auth on any endpoint today.
- **CD**: CI is implemented; automated production deployment configuration remains hosting-provider-managed.
- **Containerization**: no `Dockerfile` / `docker-compose.yml` in the repo yet.
- **API versioning beyond v1**: the code is structured so a `v2` router could be added alongside `v1` in the future, but only `v1` exists today, and health routes are mounted unprefixed rather than under `/api/v1`.

See `CHANGELOG.md` for the full list of planned work and known issues.
