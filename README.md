# GenAI Customer Review Analyzer

<div align="center">

![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.14%2B-blue?logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-SQLAlchemy%202.0-336791?logo=postgresql)
![Alembic](https://img.shields.io/badge/Migrations-Alembic-6BA81E)
![Gemini](https://img.shields.io/badge/Google-Gemini-blue?logo=google)
![OpenAI](https://img.shields.io/badge/OpenAI-ChatGPT-white?logo=openai)
![Claude](https://img.shields.io/badge/Anthropic-Claude-orange?logo=anthropic)
![License](https://img.shields.io/badge/License-MIT-green)

**A production-style, full-stack GenAI application that turns raw customer feedback into structured business insight.**

</div>

---

##  Overview

The **GenAI Customer Review Analyzer** helps businesses make sense of customer feedback at scale. Users submit reviews through an Angular dashboard, and the backend analyzes each one with an LLM - determining sentiment, a numeric score, the main theme discussed, an AI-generated improvement suggestion, and a confidence score - then persists the result in PostgreSQL for later browsing and analytics.

The project codebase: **FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL** on the backend, with UUIDv7 primary keys, a swappable multi-provider AI layer (Gemini today, OpenAI implemented, Claude stubbed in), and an **Angular 21** standalone-component frontend on top. See `docs/ARCHITECTURE.md` and `CHANGELOG.md` for the full evolution and a from-the-code review of what's solid vs. still rough.

---

##  Problem Statement

Businesses receive customer feedback from many sources at once - Google Reviews, Amazon, Flipkart, Swiggy, Zomato, the App Store/Play Store, social media. Reading every review by hand is slow and inconsistent. This project automates that with an LLM, so a business can see sentiment trends, hot themes, and suggested improvements without reading a single review manually.

---

##  Features

###  AI-Powered Analysis
- Multi-provider AI layer behind a single interface (`AIProvider`), selected at runtime via `AI_PROVIDER` - **Gemini** and **OpenAI** are implemented; **Claude** exists as a stub (see `docs/ARCHITECTURE.md`)
- Strict structured-JSON prompting (no markdown, no free text)
- Sentiment classification: positive / neutral / negative
- Sentiment score, 1–5
- Primary theme extraction (short phrase, 1–3 words)
- AI-generated business improvement suggestion
- Confidence score (0.0–1.0)
- Prompt hardened against prompt injection, and against abusive/gibberish/empty input (falls back to a safe neutral result rather than erroring)

### Frontend (Angular 21)
- Standalone components, Signals for local state
- Angular Material + Tailwind CSS 4
- Feature-based structure: `features/reviews`, `features/dashboard`
- Functional-style HTTP interceptors: request-ID tagging, global loading state, global error → snackbar
- Review page: batch input (one review per line), "Analyze" vs. "Analyze & Save"
- Searchable / filterable (sentiment + theme) / sortable / paginated history table (Angular Material Table)
- Confirm-dialog before deleting a saved review
- Dashboard: stats cards (total reviews, average score/confidence, sentiment %, top theme) computed client-side, plus Chart.js sentiment pie chart, theme bar chart, and score-trend line chart

### Backend (FastAPI)
- Clean, layered architecture: **Route → Service → AI Provider / Repository**, each with a single responsibility
- Dependency injection via `Depends()` with `lru_cache`-backed singletons
- Pydantic v2 request/response validation, decoupled from the SQLAlchemy models
- **PostgreSQL** persistence via **SQLAlchemy 2.0**, migrated with **Alembic**
- **UUIDv7** primary keys (via `uuid6`) for time-sortable, index-friendly IDs
- `bleach`-based input sanitization ahead of both the AI call and the database write
- Centralized custom exception hierarchy → consistent JSON error responses
- Request-ID + logging middleware, CORS

---

## System Architecture

```text
Angular 21 (standalone, signals)
        │  HTTP / REST (JSON)
        ▼
FastAPI application
        │
RequestIDMiddleware → LoggingMiddleware → CORSMiddleware
        │
        ▼
API Router (/api/v1/reviews/*)
        │
        ▼
ReviewService (sanitize → orchestrate)
        │
        ├──────────────┐
        ▼              ▼
   AIProvider     FeedbackRepository
 (Gemini/OpenAI)         │
        │                ▼
        ▼          PostgreSQL
  Google Gemini /  (SQLAlchemy 2.0 + Alembic,
   OpenAI API       UUIDv7 primary keys)
```

**Full detail - including the AI provider Factory pattern, the validation pipeline, the exception-handling flow, and the frontend call chain - lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).**

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 21, TypeScript 5.9, Angular Material 21 + CDK, Tailwind CSS 4, RxJS 7.8, Chart.js 4.5, ngx-toastr, dayjs, Vitest |
| **Backend** | FastAPI, Python 3.14+, Pydantic v2, SQLAlchemy 2.0, Alembic, `uuid6`, `bleach`, Uvicorn, python-dotenv |
| **AI** | Google Gemini (`google-genai` SDK), OpenAI (Responses API), structured JSON output, prompt engineering |
| **Database** | PostgreSQL (via `psycopg` v3 driver) |
| **Tooling** | Git & GitHub, `uv` package manager, npm |

---

## Project Structure

```
GenAI-Customer-Review-Analyzer/
│
├── frontend/
│   └── src/app/
│       ├── core/            # api.service.ts, interceptors, config, models
│       ├── features/
│       │   ├── reviews/     # pages, components, models, services
│       │   └── dashboard/   # pages, components (Chart.js analytics)
│       ├── layouts/         # navbar, footer, main-layout
│       └── shared/          # components, pipes, enums, directives, types
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── health_routes.py
│   │   │   └── v1/review_routes.py
│   │   ├── core/            # config.py (Settings), database.py, lifespan.py
│   │   ├── dependencies/    # services.py - DI wiring
│   │   ├── services/
│   │   │   ├── review_service.py
│   │   │   └── ai/          # provider.py (ABC), gemini_provider.py,
│   │   │                    # openai_provider.py, claude_provider.py, factory.py
│   │   ├── repositories/    # feedback_repository.py
│   │   ├── models/          # feedback.py (SQLAlchemy)
│   │   ├── schemas/         # feedback.py (Pydantic)
│   │   ├── middleware/      # cors.py, logging.py, request_id.py
│   │   ├── exceptions/      # custom_exceptions.py, handlers.py
│   │   └── utils/           # logger.py, responses.py, sanitizer.py
│   └── alembic/             # migrations
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   └── SCREENSHOTS/
│
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## REST API (summary)

Full reference with every field and error code: **[`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)**. Interactive docs at `http://localhost:8000/docs` once the server is running.

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health + uptime |
| GET | `/health` | Minimal health check |
| POST | `/api/v1/reviews/analyze` | Analyze a review without saving |
| POST | `/api/v1/reviews/analyze-and-save` | Analyze and persist |
| GET | `/api/v1/reviews/history` | List all saved reviews |
| GET | `/api/v1/reviews/{id}` | Get one saved review |
| DELETE | `/api/v1/reviews/{id}` | Delete a saved review |

---

##  Environment Variables

See `backend/.env.example` for the full annotated version. Summary:

```
APP_NAME=GenAI Customer Review Analyzer
APP_VERSION=0.1.0
APP_URL=http://localhost:4200      # used for CORS
DEBUG=true

DATABASE_URL=postgresql+psycopg://review_user:password123@localhost:5432/genai_review_analyzer

AI_PROVIDER=gemini                 # gemini | openai | claude (claude not implemented yet)
AI_API_KEY=your_api_key_here
AI_MODEL=gemini-2.5-flash
```

---

## ▶ Running Locally

**Prerequisites:** Python 3.14+, [`uv`](https://docs.astral.sh/uv/), Node.js 20+, a running PostgreSQL instance.

**Backend**
```bash
cd backend
uv sync
cp .env.example .env   # then fill in DATABASE_URL, AI_API_KEY, etc.

uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```
Runs on `http://localhost:8000` (Swagger UI at `/docs`).

**Frontend**
```bash
cd frontend
npm install
ng serve
```
Runs on `http://localhost:4200`.

---

##  Error Handling & Robustness

- Custom exception hierarchy (`AppException` → `FeedbackNotFoundException`, `AIProviderException`, `DatabaseException`, `ValidationException`, `EmptyReviewException`), all mapped to a consistent `{success, message, path}` JSON error shape
- Three-layer input validation before anything reaches the AI or the database: Pydantic length constraints → `bleach` HTML/script stripping → "is there anything meaningful left" check
- `X-Request-ID` header on every response for tracing a client error back to a specific server log line
- AI provider errors (e.g. Gemini `503` overload responses seen during development) are caught rather than leaking a raw stack trace to the client

---

##  Code Review Findings (from reading the actual codebase)

While writing this documentation, I went through the real backend code end-to-end. Two bugs and one inconsistency were mechanical/safe to fix directly - corrected versions are included in this update:

1. **`app/common/enums.py`** was missing `from enum import Enum` - importing this module would raise `NameError`. *(Fixed.)*
2. **`FeedbackResponse.id`** was typed `str`, but the ORM column is a native `uuid.UUID`; under Pydantic v2 this can raise a validation error when serializing straight from the SQLAlchemy model with `from_attributes=True`. Retyped as `UUID`. *(Fixed.)*
3. **`middleware/logging.py`** used `print()` instead of the app's own configured `logger`. Switched to `logger.info(...)`, and it now also logs the response status code and request ID. *(Fixed.)*

A few more things worth your attention (not changed, since they involve deletions or dependency/config choices that are yours to make - full detail in `docs/ARCHITECTURE.md` §9 and `CHANGELOG.md`):

- `services/ai/openai_provider.py` imports `openai`, but the package isn't in `backend/pyproject.toml` yet - run `uv add openai` before setting `AI_PROVIDER=openai`.
- `services/gemini_service.py` and `services/feedback_service.py` are unused, superseded duplicates of `services/ai/gemini_provider.py` and `services/review_service.py` - safe to delete.
- `api/v1/review_routes.py` still has a large commented-out first draft above the live code - cleanup candidate.
- `app/core/exceptions.py` defines an unused `register_exception_handlers()` - the handlers actually wired into `main.py` live in `app/exceptions/handlers.py` instead. Worth consolidating.
- `middleware/cors.py` only allows a single origin (`settings.APP_URL`) - fine for one environment, but you'll want a list (e.g. local + deployed frontend) if you run more than one.
- Root-level `test/` folder is an old, fully-commented-out Streamlit-era prototype - safe to delete.

---

##  Learning Outcomes

This project demonstrates hands-on experience with:

- Angular 21 (standalone components, signals, Material, Tailwind), Chart.js, RxJS, functional interceptors
- FastAPI, layered/repository/service architecture, dependency injection
- The Dependency Inversion Principle applied to a swappable multi-provider AI layer (Factory pattern)
- SQLAlchemy 2.0 + Alembic migrations against PostgreSQL, UUIDv7 primary keys
- Prompt engineering for structured, injection-resistant LLM output
- Centralized exception handling, middleware, and request tracing
- Reading, auditing, and correcting a real codebase (not just writing one)

---

##  Future Enhancements

- JWT authentication, user accounts, role-based access control
- CSV / Excel bulk import, PDF / Excel report export
- GitHub Actions CI: Ruff, Black, Pytest, Angular build/tests (none configured yet)
- Docker & Docker Compose (Angular + FastAPI + PostgreSQL + Redis)
- Real-time streaming responses via WebSockets
- Finish the `ClaudeProvider` implementation
- Multi-language support, dark mode
- Cloud deployment (AWS / Azure / GCP)

---

##  Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, the migration workflow, and how to add a new AI provider. Contributions, issues, and feature requests are welcome.

##  License

MIT - see [`LICENSE`](LICENSE).
