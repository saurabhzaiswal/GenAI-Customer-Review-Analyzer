# API Documentation

> Implementation note: endpoints are composed through `app/api/router.py`. Persistence endpoints receive a request-scoped SQLAlchemy session indirectly through the service/repository chain; `POST /reviews/analyze` does not open a database session. Public paths are unchanged.

Base URL (local dev): `http://localhost:8000`

> **Live docs:** FastAPI auto-generates interactive Swagger UI at `http://localhost:8000/docs` and a ReDoc view at `http://localhost:8000/redoc` whenever the server is running - those always reflect the exact current schema. This document is a hand-written companion for reading the API without spinning up the server.

All request/response models below come directly from `backend/app/schemas/feedback.py`.

Review endpoint successes use the common envelope below. For readability, endpoint examples show the value placed inside `data` unless the full envelope is explicitly shown.

```json
{
  "success": true,
  "message": "Review analyzed successfully.",
  "data": {}
}
```

---

## Health

These two routes are registered **without** the `/api/v1` prefix (see `app/main.py`: `app.include_router(health_router)`).

### `GET /`
Basic liveness + uptime info.

**Response `200`**
```json
{
  "status": "healthy",
  "application": "GenAI Customer Review Analyzer",
  "version": "0.1.0",
  "started_at": "2026-07-21T10:00:00+00:00",
  "uptime_seconds": 3600
}
```

### `GET /health`
Minimal health check.

**Response `200`**
```json
{ "status": "ok" }
```

### `GET /metrics`

Prometheus text exposition endpoint. It is intentionally excluded from the
OpenAPI schema and from its own HTTP request metrics. The local Prometheus
container scrapes it every 15 seconds. The route exists only when
`METRICS_ENABLED=true`; the setting defaults to `false` outside Compose.

Representative metric families:

- `http_requests_total`
- `http_request_duration_seconds`
- `http_requests_in_progress`
- `ai_requests_total`
- `ai_request_duration_seconds`
- `ai_request_failures_total`
- `redis_cache_operations_total`
- `rate_limited_requests_total`
- `review_analyses_completed_total`
- `database_write_duration_seconds`

---

## Reviews

All routes below are mounted under `/api/v1/reviews` (`app.include_router(review_router, prefix="/api/v1")` + `router = APIRouter(prefix="/reviews")`).

### `POST /api/v1/reviews/analyze`
Analyze a review **without** saving it.

When `REDIS_URL` is configured, this endpoint is limited to **5 requests per
60 seconds per client IP**. Successful AI results are cached for 24 hours by
normalized review text, configured provider, and configured model. Cache hits
still count toward the rate limit.

**Request body** (`ReviewRequest`)
```json
{
  "text": "The food was amazing but delivery was slow."
}
```
- `text`: string, `min_length=1`, `max_length=5000`.

**Response `200`** (`AnalysisResponse`)
```json
{
  "label": "positive",
  "score": 4,
  "theme": "delivery",
  "suggestion": "Improve delivery speed while maintaining food quality.",
  "confidence": 0.87
}
```
- `label`: `"positive" | "neutral" | "negative"`
- `score`: integer, 1-5
- `theme`: short phrase (1-3 words)
- `suggestion`: string or `null`
- `confidence`: float 0.0-1.0, or `null`

**Error responses**
- `400` - empty/whitespace-only review after sanitization (`EmptyReviewException`)
- `422` - request body fails Pydantic validation (e.g. missing `text`, or `text` over 5000 chars)
- `500` - AI provider error (e.g. invalid API key, provider outage)
- `429` - Redis-backed per-IP rate limit exceeded

---

### `POST /api/v1/reviews/analyze-and-save`
Analyze a review **and** persist it.

When `REDIS_URL` is configured, this endpoint is limited to **10 requests per
60 seconds per client IP**. It is never response-cached because every
successful request must create a database record.

**Request body** (`ReviewRequest`) - same as above.

**Response `201`** (`FeedbackResponse`)
```json
{
  "id": "01926e6a-6b3a-7a12-9d21-4c8f9e1a2b3c",
  "review": "The food was amazing but delivery was slow.",
  "label": "positive",
  "score": 4,
  "theme": "delivery",
  "suggestion": "Improve delivery speed while maintaining food quality.",
  "confidence": 0.87,
  "created_at": "2026-07-21T10:05:00+00:00",
  "updated_at": "2026-07-21T10:05:00+00:00"
}
```
- `id`: UUID (v7 - time-sortable), stored and returned as a string in JSON.

**Error responses**: same as `/analyze`, plus `500` on a database write failure.

---

### `GET /api/v1/reviews/history`
Return every saved review, most recent first.

When Redis is configured, the complete history is cached for 10 minutes.
Successful analyze-and-save and delete operations invalidate that cache, so the
next history request reloads current rows from PostgreSQL. Without Redis, this
endpoint always reads PostgreSQL as before.

**Response `200`** - `FeedbackResponse[]`
```json
[
  {
    "id": "01926e6a-6b3a-7a12-9d21-4c8f9e1a2b3c",
    "review": "The food was amazing but delivery was slow.",
    "label": "positive",
    "score": 4,
    "theme": "delivery",
    "suggestion": "Improve delivery speed while maintaining food quality.",
    "confidence": 0.87,
    "created_at": "2026-07-21T10:05:00+00:00",
    "updated_at": "2026-07-21T10:05:00+00:00"
  }
]
```

---

### `GET /api/v1/reviews/{feedback_id}`
Fetch a single saved review by its UUID.

**Path param**: `feedback_id` - UUID.

**Response `200`** - `FeedbackResponse` (same shape as above).

**Error responses**
- `404` - no feedback with that ID (`FeedbackNotFoundException`)
- `422` - `feedback_id` is not a valid UUID

---

### `DELETE /api/v1/reviews/{feedback_id}`
Delete a saved review.

**Path param**: `feedback_id` - UUID.

**Response `200`** - the deleted `FeedbackResponse` object.

**Error responses**
- `404` - no feedback with that ID (`FeedbackNotFoundException`)

---

## Error response shape

Every error response, whether a known `AppException` subclass or an unhandled exception, has this shape (see `app/exceptions/handlers.py`):

```json
{
  "success": false,
  "message": "Feedback not found.",
  "path": "/api/v1/reviews/9c3e...-uuid"
}
```

| Status | Meaning in this API |
|---|---|
| 200 | Success (GET/DELETE, and `analyze` which doesn't create a resource) |
| 201 | Resource created (`analyze-and-save`) |
| 400 | Bad request - e.g. empty review after sanitization |
| 404 | Feedback not found |
| 422 | Request failed Pydantic/FastAPI validation (auto-generated by FastAPI, not the custom handler) |
| 429 | Redis-backed AI endpoint rate limit exceeded |
| 500 | AI provider error, database error, or any unhandled exception |

Rate-limit responses are produced directly by middleware:

```json
{
  "detail": "Too many requests. Please try again later."
}
```

Redis is optional. If `REDIS_URL` is absent or Redis is temporarily
unavailable, rate limiting and response caching fail open and requests continue.

## Authentication

None yet. Every endpoint above is currently open—no API key, session, or JWT is required. See the [LLD security boundaries](./LOW_LEVEL_DESIGN.md#12-security-boundaries) for the current controls and recommended authentication boundary.

## Request tracing

Every response includes an `X-Request-ID` header (set by `RequestIDMiddleware`), useful for correlating a client-side error with a specific backend log line.
