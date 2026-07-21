# Setup Guide - GenAI Customer Review Analyzer

<div align="center">

![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.14%2B-blue?logo=python)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-SQLAlchemy%202.0-336791?logo=postgresql)
![Alembic](https://img.shields.io/badge/Migrations-Alembic-6BA81E)
![Gemini](https://img.shields.io/badge/Google-Gemini-orange?logo=google)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

> **This is an LLM project?** The whole point of the app is that a **Large Language Model reads a raw customer review and returns structured JSON** - sentiment label, 1–5 score, theme, an improvement suggestion, and a confidence value. FastAPI, PostgreSQL, and Angular exist purely to get text *into* that LLM call and to store/display what comes back. This guide sets that up end-to-end, in four different dev environments.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the repository](#2-clone-the-repository)
3. [Backend setup (FastAPI + the LLM layer)](#3-backend-setup-fastapi--the-llm-layer)
4. [The AI Provider layer - your LLM switch](#4-the-ai-provider-layer--your-llm-switch)
5. [Database setup (PostgreSQL + Alembic)](#5-database-setup-postgresql--alembic)
6. [Frontend setup (Angular 21)](#6-frontend-setup-angular-21)
7. [Run & verify everything](#7-run--verify-everything)
8. [Environment A - Local VS Code](#8-environment-a--local-vs-code)
9. [Environment B - GitHub Codespaces](#9-environment-b--github-codespaces)
10. [Environment C - Coder](#10-environment-c--coder)
11. [Environment D - Cursor](#11-environment-d--cursor)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Python** | 3.14+ | Backend runtime (`pyproject.toml` pins `requires-python = ">=3.14"`) |
| **uv** | latest | Package/dependency manager for the backend (there's a committed `uv.lock`) |
| **Node.js** | 20+ | Angular 21 CLI + build tooling |
| **npm** | 10+ | Frontend package manager (repo pins `packageManager: npm@10.9.0`) |
| **PostgreSQL** | 14+ | Persistence for saved/analyzed reviews |
| **Git** | any recent | Clone + version control |
| **An LLM API key** | - | Google Gemini (or OpenAI) key - see [Section 4](#4-the-ai-provider-layer--your-llm-switch) |

Install `uv` if you don't have it:

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

---

## 2. Clone the repository

```bash
git clone https://github.com/saurabhzaiswal/GenAI-Customer-Review-Analyzer.git
cd GenAI-Customer-Review-Analyzer
```

Repo layout you'll be working with:

```
GenAI-Customer-Review-Analyzer/
├── backend/        # FastAPI + SQLAlchemy + Alembic + AI provider layer
├── frontend/        # Angular 21 standalone-component app
├── docs/            # ARCHITECTURE.md, this SETUP.md, diagrams
└── test/            # scratch/reference scripts (not the app itself)
```

---

## 3. Backend setup (FastAPI + the LLM layer)

```bash
cd backend
uv sync
```

`uv sync` reads `pyproject.toml` + `uv.lock` and creates a `.venv` with exactly the pinned versions of FastAPI, SQLAlchemy, Alembic, `google-genai`, `bleach`, etc.

Copy the environment template:

```bash
cp .env.example .env
```

Open `.env` and fill in the real values - see the annotated table below.

| Variable | Example | Notes |
|---|---|---|
| `APP_NAME` | `GenAI Customer Review Analyzer` | Shown in Swagger UI title |
| `APP_VERSION` | `0.1.0` | - |
| `APP_URL` | `http://localhost:4200` | Angular's origin - used for CORS |
| `DEBUG` | `true` | Enables SQL echo + verbose errors locally |
| `DATABASE_URL` | `postgresql+psycopg://postgres:1234@localhost:5432/customer_review_analyzer` | SQLAlchemy engine URL (psycopg v3 driver) |
| `AI_PROVIDER` | `gemini` \| `openai` \| `claude` | **This is your LLM switch** - see Section 4 |
| `AI_API_KEY` | `your_api_key_here` | API key for whichever provider you chose |
| `AI_MODEL` | `gemini-2.5-flash` | Model name, passed straight to the provider SDK |

---

## 4. The AI Provider layer - your LLM switch

This is the part of the project that actually makes it a **GenAI** app rather than a plain CRUD app. `app/services/ai/` defines:

- `provider.py` - an abstract `AIProvider` base class with one method: `analyze_review(review: str) -> AnalysisResponse`
- `gemini_provider.py` - talks to **Google Gemini** (fully implemented)
- `openai_provider.py` - talks to **OpenAI** via the Responses API (fully implemented)
- `claude_provider.py` - a provider for **Anthropic's Claude models** (currently a stub that raises `NotImplementedError` - see note below)
- `factory.py` - `AIProviderFactory.create()` reads `AI_PROVIDER` from `.env` and hands the `ReviewService` whichever concrete provider you asked for

So **`AI_PROVIDER` is literally "which LLM answers this request."** Swapping the model your app uses is a one-line `.env` change - no code changes, no redeploy of a different branch.

> **Note on naming:** "Claude" here means **Anthropic's Claude model family** (e.g. `claude-sonnet-4-6`) used as an analysis LLM, called through the `anthropic` Python SDK - not to be confused with **Claude Code**, Anthropic's separate coding-agent CLI/IDE tool. They're unrelated products; only the model-as-LLM-provider is relevant to this app.

### 4.1 Gemini (implemented, default)

```env
AI_PROVIDER=gemini
AI_API_KEY=your_google_ai_studio_key
AI_MODEL=gemini-2.5-flash
```

Get a key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4.2 OpenAI (implemented)

```env
AI_PROVIDER=openai
AI_API_KEY=sk-your_openai_key
AI_MODEL=gpt-4o-mini
```

Get a key at the [OpenAI Platform](https://platform.openai.com/api-keys). You'll also need `pip install openai` / add `openai` to `pyproject.toml` if it isn't already there in your working copy, since it isn't in the base `dependencies` list.

### 4.3 Claude / Anthropic (stub - needs implementation)

```env
AI_PROVIDER=claude
AI_API_KEY=your_anthropic_key
AI_MODEL=claude-sonnet-4-6
```

Right now `ClaudeProvider.analyze_review()` just raises `NotImplementedError`. To make this option functional, implement it the same way `gemini_provider.py` / `openai_provider.py` are built: call the Anthropic Messages API with the same rules-based prompt, force JSON-only output, and parse the result into an `AnalysisResponse`. Add `anthropic` to `backend/pyproject.toml` first (`uv add anthropic`).

---

## 5. Database setup (PostgreSQL + Alembic)

Create the database (adjust user/password to match `DATABASE_URL`):

```bash
psql -U postgres -c "CREATE DATABASE customer_review_analyzer;"
```

Apply migrations (creates the `feedbacks` table with UUIDv7 primary keys):

```bash
uv run alembic upgrade head
```

If you ever change `app/models/feedback.py`, generate a new migration with:

```bash
uv run alembic revision --autogenerate -m "describe your change"
uv run alembic upgrade head
```

---

## 6. Frontend setup (Angular 21)

```bash
cd ../frontend
npm install
```

Check `src/environments/environment.development.ts` - it should point at your local backend:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000/api/v1',
};
```

---

## 7. Run & verify everything

**Terminal 1 - backend:**

```bash
cd backend
uv run uvicorn app.main:app --reload
```

- API base: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

**Terminal 2 - frontend:**

```bash
cd frontend
ng serve
```

- App: `http://localhost:4200`

Smoke-test the LLM path directly with curl:

```bash
curl -X POST http://localhost:8000/api/v1/reviews/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "The food was amazing but delivery was slow."}'
```

You should get back JSON like:

```json
{
  "label": "positive",
  "score": 4,
  "theme": "delivery",
  "suggestion": "Improve delivery speed while maintaining food quality.",
  "confidence": 0.9
}
```

If that works, your LLM wiring is correct end to end.

---

## 8. Environment A - Local VS Code

1. Open the **repo root** (not `backend/` or `frontend/` individually) so VS Code's multi-root awareness picks up both projects:
   ```bash
   code .
   ```
2. Install recommended extensions:
   - **Python** (ms-python.python) + **Pylance**
   - **Angular Language Service** (Angular.ng-template)
   - **ESLint** / **Prettier** (for the frontend)
   - **Ruff** (charliermarsh.ruff), if you lint the backend with Ruff
3. Point VS Code's Python interpreter at the `uv`-managed venv:
   `Ctrl/Cmd+Shift+P` → **Python: Select Interpreter** → `backend/.venv/bin/python`
4. Optional `.vscode/launch.json` so you can hit F5 and debug the API directly (breakpoints work in `ReviewService`, providers, etc.):
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "FastAPI: uvicorn",
         "type": "debugpy",
         "request": "launch",
         "module": "uvicorn",
         "args": ["app.main:app", "--reload"],
         "cwd": "${workspaceFolder}/backend",
         "envFile": "${workspaceFolder}/backend/.env"
       }
     ]
   }
   ```
5. Use two integrated terminals (split panel) - one `cd backend && uv run uvicorn app.main:app --reload`, one `cd frontend && ng serve`.

---

## 9. Environment B - GitHub Codespaces

This repo doesn't currently ship a `.devcontainer/devcontainer.json`, so there are two ways in:

**Quickest - plain Codespace, manual setup:**

1. On GitHub: **Code** → **Codespaces** → **Create codespace on main**.
2. Codespaces gives you a Linux container with a terminal. Install `uv` and Node if the default image lacks the right versions (most `universal` images already have Node; add `uv` via the curl installer from Section 1).
3. Run the same commands as Section 3–7 inside the Codespace terminal.
4. Codespaces auto-detects the ports FastAPI (8000) and Angular (4200) bind to and offers to forward them - click **Open in Browser** on the **Ports** tab, or make port 4200 **Public** if you want to share a live link.
5. **Don't commit your `.env`.** Store `AI_API_KEY` and `DATABASE_URL` as a **Codespaces secret** instead: repo **Settings → Secrets and variables → Codespaces → New repository secret**. They'll be injected as environment variables automatically on next rebuild; your `.env` can then just reference `${AI_API_KEY}` or you `export` them before running.

**More reproducible - add a devcontainer (recommended if the team uses Codespaces regularly):**

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "GenAI Customer Review Analyzer",
  "image": "mcr.microsoft.com/devcontainers/python:3.14",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" }
  },
  "postCreateCommand": "curl -LsSf https://astral.sh/uv/install.sh | sh && cd backend && uv sync && cd ../frontend && npm install",
  "forwardPorts": [8000, 4200],
  "portsAttributes": {
    "8000": { "label": "FastAPI" },
    "4200": { "label": "Angular" }
  }
}
```

Commit that file and every future Codespace boots pre-configured - no manual installs.

---

## 10. Environment C - Coder

[Coder](https://coder.com) workspaces are template-driven, so setup depends on what your organization's admin has configured, but the app-level steps are identical:

1. Create/open a workspace from your org's template (typically also container- or devcontainer-based - the same `.devcontainer/devcontainer.json` from Section 9 works if your Coder template supports devcontainers).
2. Open the workspace in the **web IDE (code-server)** or connect your **local VS Code / Cursor** to it via the Coder CLI:
   ```bash
   coder config-ssh
   code --remote ssh-remote+coder.<workspace-name> /path/to/GenAI-Customer-Review-Analyzer
   ```
3. Inside the workspace terminal, run Sections 3–7 exactly as on a local machine.
4. Expose ports through Coder's **port forwarding** (workspace apps in the dashboard, or `coder port-forward <workspace> --tcp 8000:8000 --tcp 4200:4200` from your local machine).
5. Store `AI_API_KEY` / `DATABASE_URL` as **Coder workspace parameters** or template-level secrets rather than committing them, same principle as Codespaces.

---

## 11. Environment D - Cursor

Cursor is a VS Code fork, so almost everything in Section 8 applies unchanged:

1. `File → Open Folder` on the repo root.
2. Install the same extensions (Python, Angular Language Service) - Cursor supports the standard VS Code marketplace.
3. Select the `backend/.venv` interpreter the same way as Section 8.
4. Cursor's AI chat/agent can read this file plus `docs/ARCHITECTURE.md` for context if you ask it to explain or extend the codebase - point it at `app/services/ai/` first if you want it to help implement the `ClaudeProvider` stub from Section 4.3.
5. Run the same two-terminal workflow (`uv run uvicorn app.main:app --reload` / `ng serve`) in Cursor's integrated terminal.

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `uv: command not found` | `uv` not installed or not on `PATH` | Re-run the installer in Section 1, restart the terminal |
| `psycopg.OperationalError: connection refused` | Postgres isn't running, or `DATABASE_URL` is wrong | Start Postgres; confirm host/port/user/password/db name match |
| CORS error in the browser console | `APP_URL` in `.env` doesn't match the Angular origin | Set `APP_URL=http://localhost:4200` (or your Codespace/Coder forwarded URL) |
| `RuntimeError: Gemini returned invalid JSON` | Bad/missing `AI_API_KEY`, or wrong `AI_MODEL` name | Double-check the key and that the model string is valid for that provider |
| `Unsupported AI Provider: ...` | Typo in `AI_PROVIDER`, or picked `claude` before implementing it | Use exactly `gemini`, `openai`, or `claude`; implement `ClaudeProvider` first if choosing Claude |
| Angular can't reach the API | `apiBaseUrl` in `environment.development.ts` points somewhere wrong, or backend isn't running | Confirm backend is up on 8000 and the environment file matches |
| Alembic says table already exists / out of sync | Migrations run out of order or DB was created manually | `uv run alembic current` to check state, or drop and recreate the dev DB |

---

Next: see **[`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)** for the full request-lifecycle diagrams, the Factory/DI pattern behind the AI provider layer, and the validation/exception-handling flow.