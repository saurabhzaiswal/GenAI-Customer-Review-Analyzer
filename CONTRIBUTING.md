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
- Redis is optional; without `REDIS_URL`, rate limiting and AI caching are disabled
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

### Optional Docker Compose setup

Run the frontend, backend, PostgreSQL, and Redis together:

```bash
# Export AI_API_KEY first (and optionally AI_PROVIDER / AI_MODEL).
docker compose up --build
```

Compose is a contributor convenience. It does not replace the
Vercel/Render/Neon production deployment, and normal local development does
not require Docker or Redis.

The same command also starts local observability:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (`admin` / `admin`)
- cAdvisor: `http://localhost:8080`

Grafana automatically provisions the Prometheus datasource and project
dashboard; no manual import is required.

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

`ClaudeProvider` uses Anthropic's official SDK and structured Messages API parsing. Keep its response validation and `AIProviderException` mapping consistent with the other providers.

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
- Keep each component's TypeScript, template, styles, and tests in its own named folder.
- Use `@app/*` for cross-feature/application imports and `@env/*` for environment imports. Do not introduce parent-traversal imports such as `../../../shared/...`; keep `./` only for colocated files.
- Use the theme tokens in `src/styles.scss`; derive brand shades with `color-mix()` instead of introducing duplicate hard-coded blues.
- Keep border radii at or below the global `--radius: 12px` token. This includes Angular Material overlay surfaces such as dialogs and menus.
- Table filters must reset pagination to the first page; conditionally rendered paginator/sort instances should be connected with `ViewChild` setters.

## Code style

The CI workflow runs Ruff checks/format verification for Python and the Angular test/build pipeline. If you're contributing:

- Match the existing formatting style you see in the file you're editing.
- Keep functions single-purpose - the whole backend is organized around the Single Responsibility Principle (see `docs/ARCHITECTURE.md`), and PRs that blur route/service/AI/repository boundaries will likely get a change request.
- Keep [`docs/LOW_LEVEL_DESIGN.md`](docs/LOW_LEVEL_DESIGN.md) aligned when changing dependency lifetimes, state ownership, API sequences, persistence, or deployment flow.
- Pull requests must pass the repository CI workflow: backend dependency audit, Ruff lint/format, compilation/tests, frontend tests/build, and the PostgreSQL migration check. Redis tests use fakes, so CI needs no Redis service. Install the locked development tools with `uv sync --all-groups`.

## Protecting `master`

After the CI workflow has completed successfully at least once, open **Settings → Rules → Rulesets → New branch ruleset** in GitHub. Target the default branch (`master`), set enforcement to **Active**, and enable:

- Require a pull request before merging.
- Require status checks to pass before merging; add the unique **CI required** check and require the branch to be up to date.
- Require conversation resolution before merging.
- Block force pushes and branch deletion.
- Do not add a bypass actor if CI must apply to administrators as well.

One approving review is recommended for team repositories. For a solo repository, CI protection still works without requiring another reviewer. The workflow also listens for `merge_group`, so it is compatible with GitHub's merge queue if that feature is enabled later.

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
