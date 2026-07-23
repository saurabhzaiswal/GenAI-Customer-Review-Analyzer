from prometheus_client import Counter, Gauge, Histogram

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests.",
    ("method", "endpoint", "status_code"),
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds.",
    ("method", "endpoint"),
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30),
)
HTTP_REQUESTS_IN_PROGRESS = Gauge(
    "http_requests_in_progress",
    "HTTP requests currently being processed.",
    ("method", "endpoint"),
)

AI_REQUESTS_TOTAL = Counter(
    "ai_requests_total",
    "Total calls to an external AI provider.",
    ("provider", "model"),
)
AI_REQUEST_FAILURES_TOTAL = Counter(
    "ai_request_failures_total",
    "Failed calls to an external AI provider.",
    ("provider", "model"),
)
AI_REQUEST_DURATION_SECONDS = Histogram(
    "ai_request_duration_seconds",
    "External AI provider latency in seconds.",
    ("provider", "model"),
    buckets=(0.1, 0.25, 0.5, 1, 2.5, 5, 10, 20, 30, 60),
)

REDIS_CACHE_OPERATIONS_TOTAL = Counter(
    "redis_cache_operations_total",
    "Redis cache lookup outcomes.",
    ("cache", "result"),
)
RATE_LIMITED_REQUESTS_TOTAL = Counter(
    "rate_limited_requests_total",
    "Requests rejected by Redis rate limiting.",
    ("method", "endpoint"),
)
REVIEW_ANALYSES_COMPLETED_TOTAL = Counter(
    "review_analyses_completed_total",
    "Successfully completed review analyses.",
    ("operation", "source"),
)
DATABASE_WRITE_DURATION_SECONDS = Histogram(
    "database_write_duration_seconds",
    "Database write latency in seconds.",
    ("operation", "status"),
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5),
)
