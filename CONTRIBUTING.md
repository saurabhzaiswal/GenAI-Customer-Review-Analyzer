# Contributing to GenAI Customer Review Analyzer

Thanks for your interest in contributing! This document covers how the project is actually set up today, so you can get a working local environment quickly.

## Project layout

```
backend/    FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL
frontend/   Angular 21 (standalone components, signals)
docs/       Architecture & API documentation
```

## Prerequisites

- Python **3.14+** (declared in `backend/pyproject.toml` as `requires-python = ">=3.14"`)
- [uv](https://docs.astral.sh/uv/) for Python dependency management
- Node.js 20+ and npm for the Angular frontend
- A running PostgreSQL instance (local or Docker)
- A Gemini or OpenAI API key (see `backend/.env.example`)

## Backend setup

```bash
cd backend
uv sync

cp .env.example .env
# then fill in DATABASE_URL, AI_PROVIDER, AI_API_KEY, AI_MODEL, APP_URL

# create the database (if it doesn't exist yet)
# createdb genai_review_analyzer

# apply migrations
uv run alembic upgrade head

# run the API
uv run uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs` (FastAPI's built-in Swagger UI).

### Adding a database change

This project uses **Alembic** for migrations - don't hand-edit the schema.

1. Change the SQLAlchemy model in `backend/app/models/`.
2. Generate a migration: `uv run alembic revision --autogenerate -m "describe the change"`.
3. Review the generated file in `backend/alembic/versions/` - autogenerate is not always perfect (it won't detect all changes, e.g. some column type narrowing).
4. Apply it locally: `uv run alembic upgrade head`.
5. Commit both the model change and the migration file together.

### Adding a new AI provider

The AI layer follows the Factory + Dependency Inversion pattern:

1. Implement `app/services/ai/provider.py`'s `AIProvider` abstract base in a new file, e.g. `app/services/ai/mistral_provider.py`.
2. Register it in `app/services/ai/factory.py`'s `AIProviderFactory.create()`.
3. Set `AI_PROVIDER=<your_provider>` in `.env`.

`ClaudeProvider` currently exists as a stub (raises `NotImplementedError`) - implementing it is a good first contribution.

## Frontend setup

```bash
cd frontend
npm install
ng serve
```

Runs at `http://localhost:4200` and expects the backend at the URL configured in `src/environments/environment.ts` (`apiBaseUrl`).

### Conventions

- Standalone components only - no NgModules.
- No component talks to `HttpClient` directly; go through `ApiService` → a feature-specific `*ApiService` → the feature's own service (see `ReviewApiService` / `ReviewService` for the pattern).
- New features live under `src/app/features/<feature-name>/` with `pages/`, `components/`, `services/`, and `models/` subfolders.
- Shared, feature-agnostic UI goes in `src/app/shared/components/`.

## Code style

There's no linting/formatting pipeline wired up yet (no Ruff/Black config on the backend, no ESLint config beyond Angular CLI defaults on the frontend). If you're contributing:

- Match the existing formatting style you see in the file you're editing.
- Keep functions single-purpose - the whole backend is organized around the Single Responsibility Principle (see `docs/ARCHITECTURE.md`), and PRs that blur route/service/AI/repository boundaries will likely get a change request.
- Setting up Ruff + Black + Pytest (backend) and a proper CI pipeline is tracked as a planned enhancement - see `CHANGELOG.md` / README roadmap. Contributions on that front are very welcome.

## Submitting changes

1. Fork the repo and create a branch: `git checkout -b feature/short-description`.
2. Make your changes, keeping backend/frontend changes in separate commits where practical.
3. Test manually against a local Postgres + your chosen AI provider before opening a PR.
4. Open a pull request describing **what** changed and **why**, and mention which endpoints/components you touched.
5. Link any related issue.

## Reporting bugs / requesting features

Please open a GitHub issue with:
- What you expected to happen
- What actually happened (include request/response bodies for API bugs - remember to redact your API key)
- Steps to reproduce

Contributions, issues, and feature requests are genuinely welcome.
