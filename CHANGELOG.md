# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- `app/common/enums.py` was missing `from enum import Enum`, which would raise `NameError` the moment the module was imported. Added the import.
- `FeedbackResponse.id` was typed as `str` while the ORM column is a native `uuid.UUID` - under Pydantic v2 this can raise a validation error when building the response straight from the SQLAlchemy model. Retyped as `UUID`.
- `LoggingMiddleware` used `print()` instead of the app's configured `logger` (`app/utils/logger.py`). Switched to `logger.info(...)` and added status code + request ID to the log line.

### Known issues / recommended next fixes (not yet applied)
- `services/ai/openai_provider.py` imports `openai`, but the `openai` package is not listed in `backend/pyproject.toml`. Run `uv add openai` before setting `AI_PROVIDER=openai`.
- `services/gemini_service.py` and `services/feedback_service.py` are superseded, unused duplicates of `services/ai/gemini_provider.py` and `services/review_service.py`. Safe to delete.
- `api/v1/review_routes.py` still carries a large commented-out first draft above the live code - cleanup candidate.
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
- Implemented `GeminiProvider` and `OpenAIProvider`; added a `ClaudeProvider` stub for future work.
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
- CSV/Excel import, PDF/Excel report export.
- Real-time streaming responses.
