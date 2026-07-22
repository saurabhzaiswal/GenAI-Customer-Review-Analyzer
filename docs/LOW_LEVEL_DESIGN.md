# Low-Level Design

This document describes the implemented classes, dependencies, state transitions, request flows, storage model, and performance decisions of the GenAI Customer Review Analyzer. It complements the higher-level overview in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## 1. Runtime context

```mermaid
flowchart LR
    User[Browser user]
    Vercel[Vercel<br/>Angular static SPA]
    Render[Render<br/>FastAPI process]
    Neon[(Neon PostgreSQL)]
    Gemini[Google Gemini]
    OpenAI[OpenAI]
    Claude[Anthropic Claude]

    User -->|HTTPS| Vercel
    Vercel -->|JSON over HTTPS| Render
    Render -->|SQL over TLS| Neon
    Render -->|one configured provider| Gemini
    Render --> OpenAI
    Render --> Claude
```

Only one AI provider is constructed per backend process. `AI_PROVIDER` selects the strategy at startup. Database sessions remain request-scoped.

## 2. Source-module map

```mermaid
flowchart TB
    subgraph Frontend[Angular frontend]
        Layout[layouts<br/>navbar, main layout, footer]
        Reviews[features/reviews<br/>form, results, history, exports]
        Dashboard[features/dashboard<br/>statistics and charts]
        Shared[shared<br/>components, pipes, validators, types]
        Core[core<br/>API, interceptors, preferences]
        Layout --> Reviews
        Layout --> Dashboard
        Reviews --> Shared
        Dashboard --> Shared
        Reviews --> Core
        Dashboard --> Core
    end

    subgraph Backend[FastAPI backend]
        API[api<br/>router and v1 routes]
        Dependencies[dependencies<br/>lifetime wiring]
        Service[ReviewService]
        Provider[services/ai<br/>provider strategies]
        Repository[FeedbackRepository]
        Schema[schemas<br/>Pydantic contracts]
        Model[models<br/>SQLAlchemy mapping]
        API --> Dependencies
        API --> Schema
        Dependencies --> Service
        Service --> Provider
        Service --> Repository
        Repository --> Model
    end

    Core -->|REST| API
```

Cross-feature frontend imports use `@app/*`; environment imports use `@env/*`. Component-local files may use `./`.

## 3. Frontend class relationships

```mermaid
classDiagram
    class ReviewPageComponent {
        +onAnalyze(text)
        +onAnalyzeAndSave(text)
        +onDeleteFeedback(id)
        +clearResults()
    }
    class DashboardPageComponent {
        +savedFeedback Signal
        +statistics Computed
        +onDeleteFeedback(id)
    }
    class ReviewHistoryComponent {
        +savedReviews Input
        +deleteFeedback Output
        +dataSource MatTableDataSource
        +applyFilters()
        +exportExcel()
        +exportPdf()
    }
    class ReviewService {
        +analysisResults Signal
        +savedFeedback Signal
        +batchSummary Computed
        +analyze(text)
        +analyzeAndSave(text)
        +loadHistory(force)
        +deleteFeedback(id)
    }
    class ReviewApiService {
        +analyzeReview(request)
        +analyzeReviewAndSave(request)
        +getHistory()
        +deleteFeedback(id)
    }
    class ApiService {
        +get~T~(endpoint)
        +post~T~(endpoint, body)
        +delete~T~(endpoint)
    }
    class LoadingService {
        +loading Signal
        +start() token
        +stop(token)
    }
    class UiPreferencesService {
        +language Signal
        +darkMode Signal
        +setLanguage(code)
        +toggleDarkMode()
    }

    ReviewPageComponent --> ReviewService
    DashboardPageComponent --> ReviewService
    ReviewPageComponent --> ReviewHistoryComponent
    DashboardPageComponent --> ReviewHistoryComponent
    ReviewService --> ReviewApiService
    ReviewApiService --> ApiService
    ApiService ..> LoadingService : HTTP interceptor
    ReviewHistoryComponent ..> UiPreferencesService : active translation
```

### Frontend state ownership

| State | Owner | Lifetime | Consumers |
|---|---|---|---|
| Saved feedback | `ReviewService.savedFeedback` | Application | Reviews, Dashboard, History |
| Session results | `ReviewService.analysisResults` | Application until cleared/refresh | Reviews |
| History request cache | `ReviewService` | Application | Both lazy routes |
| API loading tokens | `LoadingService` | One token per subscription | Main layout loader |
| Language/theme | `UiPreferencesService` + local storage | Persistent browser preference | Entire application |
| Search/filter/sort/page | `ReviewHistoryComponent` | Component instance | Desktop table and mobile cards |

## 4. Backend class relationships and lifetimes

```mermaid
classDiagram
    class ReviewRoutes {
        +analyze_review(request)
        +analyze_and_save(request)
        +get_history()
        +get_feedback(id)
        +delete_feedback(id)
    }
    class ReviewService {
        -ai AIProvider
        -repository FeedbackRepository?
        +analyze_review(text)
        +analyze_and_save(text)
        +get_history()
        +get_feedback_by_id(id)
        +delete_feedback(id)
    }
    class AIProvider {
        <<abstract>>
        +analyze_review(text) AnalysisResponse
    }
    class GeminiProvider
    class OpenAIProvider
    class ClaudeProvider
    class FeedbackRepository {
        -db Session
        +create(data) Feedback
        +get_all() Feedback[]
        +get_by_id(id) Feedback?
        +delete(feedback)
        +count() int
    }
    class Session
    class Engine {
        pool_pre_ping
        pool_recycle=300
        pool_use_lifo
    }

    ReviewRoutes --> ReviewService
    ReviewService --> AIProvider
    AIProvider <|.. GeminiProvider
    AIProvider <|.. OpenAIProvider
    AIProvider <|.. ClaudeProvider
    ReviewService --> FeedbackRepository
    FeedbackRepository --> Session
    Session --> Engine
```

| Dependency | Lifetime | Reason |
|---|---|---|
| SQLAlchemy `Engine` | Process | Thread-safe connection pool |
| AI provider | Process, `lru_cache` | Reuse SDK client and connection pools |
| Analysis-only `ReviewService` | Process, `lru_cache` | Stateless and database-free |
| SQLAlchemy `Session` | Request | Transaction and ORM identity-map isolation |
| Repository-backed `ReviewService` | Request | Holds the request-scoped repository/session |

## 5. Analyze-and-save sequence

```mermaid
sequenceDiagram
    actor User
    participant Form as ReviewFormComponent
    participant State as ReviewService
    participant API as ReviewApiService
    participant INT as HTTP interceptors
    participant Route as FastAPI route
    participant Service as Backend ReviewService
    participant AI as AIProvider
    participant Repo as FeedbackRepository
    participant DB as PostgreSQL

    User->>Form: Submit review lines
    Form->>State: analyzeAndSave(text)
    State->>State: trim, remove blank lines
    par Up to three ordered workers
        State->>API: analyzeReviewAndSave(review)
        API->>INT: POST /reviews/analyze-and-save
        INT->>INT: request ID + loading token
        INT->>Route: JSON request
        Route->>Service: analyze_and_save(text)
        Service->>Service: sanitize text
        Service->>AI: analyze_review(text)
        AI-->>Service: AnalysisResponse
        Service->>Repo: create(FeedbackCreate)
        Repo->>DB: INSERT + COMMIT
        DB-->>Repo: persisted row
        Repo-->>Route: Feedback
        Route-->>INT: ApiResponse Feedback
        INT->>INT: release exact loading token
        INT-->>State: unwrapped Feedback
    end
    State->>State: preserve input order; update result/history signals
```

The frontend bounds concurrency at three requests. This reduces batch latency without creating an unbounded burst against Render or the selected LLM provider.

## 6. History, filtering, and deletion

```mermaid
sequenceDiagram
    participant Page as Reviews/Dashboard page
    participant State as ReviewService
    participant API as FastAPI
    participant DB as PostgreSQL
    participant History as ReviewHistoryComponent

    Page->>State: loadHistory()
    alt history already loaded
        State-->>Page: reuse signal state
    else request already in flight
        State-->>Page: await shared promise
    else first load
        State->>API: GET /reviews/history
        API->>DB: SELECT ORDER BY created_at DESC
        DB-->>API: rows via created_at index
        API-->>State: gzip JSON response when >= 1 KB
        State->>State: save signal + mark loaded
    end
    State-->>History: savedReviews input
    History->>History: filter, sort, paginate locally
    History->>History: render table or mobile cards
```

Filters remain client-side so keyword, sentiment, theme, score, sorting, mobile cards, and exports all operate on one consistent set. The parsed filter object is cached per filter string instead of being reparsed once for every row.

Deletion always follows `three-dot menu -> confirmation dialog -> DELETE API -> signal update`. The UI removes the row only after the server confirms deletion.

## 7. PDF and spreadsheet export

```mermaid
flowchart TD
    Filtered[MatTableDataSource.filteredData]
    Choice{Export type}
    Excel[Lazy import ExcelJS]
    PDF[Lazy import jsPDF]
    Locale{Active locale}
    BuiltIn[Built-in compact Latin font]
    Noto[Fetch self-hosted Noto TTF]
    Cache[Cache base64 font data]
    Report[Native vector dashboard report]

    Filtered --> Choice
    Choice -->|Excel| Excel
    Choice -->|PDF| PDF
    PDF --> Locale
    Locale -->|en, nl, fr, de, es| BuiltIn
    Locale -->|hi, ja, ko| Noto --> Cache
    BuiltIn --> Report
    Cache --> Report
```

The PDF keeps the original jsPDF vector layout; it does not use DOM screenshots. Only the locale-specific font is fetched, and repeat exports reuse converted font data. The Noto files are distributed under the SIL Open Font License in `public/fonts/OFL.txt`.

## 8. Persistence design

```mermaid
erDiagram
    FEEDBACKS {
        uuid id PK "UUIDv7"
        text review "sanitized input"
        varchar label "positive neutral negative"
        integer score "1 through 5"
        varchar theme "primary topic"
        text suggestion "nullable"
        float confidence "nullable 0 through 1"
        timestamptz created_at "indexed, newest-first query"
        timestamptz updated_at
    }
```

`ix_feedbacks_created_at` supports the current `ORDER BY created_at DESC` history query. UUIDv7 keeps primary-key inserts time-ordered and index-friendly.

## 9. Middleware and error flow

```mermaid
flowchart LR
    Request --> CORS[CORS]
    CORS --> GZip[GZip responses >= 1 KB]
    GZip --> Logging[duration/status logging]
    Logging --> RequestID[X-Request-ID]
    RequestID --> Router
    Router --> Result{Result}
    Result -->|success| Envelope[ApiResponse envelope]
    Result -->|AppException| Known[typed status + safe message]
    Result -->|validation| Validation[422 safe message]
    Result -->|unexpected| Unexpected[log traceback + generic 500]
```

The frontend error interceptor translates HTTP classes into localized snackbars. Unexpected backend errors retain their traceback in server logs with the request path and request ID, while clients receive no stack trace.

## 10. Performance characteristics

| Area | Implemented decision | Effect |
|---|---|---|
| Routes | Angular lazy feature routes | Avoid loading both page components initially |
| Charts | Register only used Chart.js modules | Smaller chart runtime |
| Dashboard | One computed aggregation pass | Avoid repeated filters/maps over history |
| Lists | Stable `trackBy` keys | Reduce DOM recreation |
| Batch AI | Three bounded workers | Lower elapsed time with controlled load |
| History | Shared in-flight request and state cache | Avoid duplicate route-navigation fetches |
| Filtering | Cache parsed filter criteria | Avoid `JSON.parse` per row |
| File tools | Dynamic ExcelJS/jsPDF imports | Keep export libraries outside initial bundle |
| PDF fonts | Locale-only fetch + base64 cache | Avoid repeat conversion and unrelated fonts |
| API payloads | GZip at 1 KB | Reduce larger history response transfer |
| Database | Pre-ping, recycle, LIFO pool | Prefer warm connections and reject stale ones |
| History query | `created_at` index | Support newest-first ordering |

Cold Render/Neon startup and external LLM inference remain infrastructure/network costs. Application-level optimization cannot guarantee sub-second AI responses on sleeping infrastructure.

## 11. Scaling boundary and next design step

The current history endpoint returns the full saved collection because filtering, charts, and exports are client-side. This is appropriate for a portfolio/small-team dataset and keeps behavior simple. When history reaches thousands of rows, evolve the contract together:

1. Add cursor pagination and server-side search/filter/sort parameters.
2. Add a separate aggregate analytics endpoint.
3. Export through a background report job or streamed server response.
4. Cache aggregate results with explicit invalidation after create/delete.

Changing only the backend to paginate today would silently break dashboard totals, filters, and exports, so it is deliberately documented rather than applied as a partial optimization.

## 12. Security boundaries

- Pydantic limits request length before service execution.
- `bleach` sanitizes text before AI analysis and persistence.
- Prompt instructions treat review content as untrusted data.
- Provider keys remain backend environment variables and never reach Angular.
- CORS restricts browser origins to the configured frontend URL.
- There is currently no user authentication or tenant isolation; all review endpoints are public.
- Destructive UI actions require confirmation, but authorization must be added before multi-user production use.

## 13. Deployment and CI

```mermaid
flowchart LR
    Branch[Feature branch] --> PR[Pull request]
    PR --> BackendCI[Backend audit, Ruff, compile, tests]
    PR --> FrontendCI[Angular tests and production build]
    PR --> MigrationCI[PostgreSQL Alembic upgrade]
    BackendCI --> Gate[CI required]
    FrontendCI --> Gate
    MigrationCI --> Gate
    Gate -->|required success| Master[master]
    Master --> Vercel[Vercel frontend]
    Master --> Render[Render backend]
    Render --> Neon[(Neon)]
```

GitHub branch rules should require the stable `CI required` status before merge. Deployment remains configured in Vercel and Render rather than performed by the repository workflow.
