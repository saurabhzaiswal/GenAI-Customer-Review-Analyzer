import os

os.environ["APP_NAME"] = "Test Review Analyzer"
os.environ["APP_URL"] = "http://localhost:4200"
os.environ["APP_VERSION"] = "0.0.0"
os.environ["DEBUG"] = "false"
os.environ["DATABASE_URL"] = "postgresql+psycopg://test:test@localhost/test"
os.environ["AI_PROVIDER"] = "gemini"
os.environ["AI_API_KEY"] = "test-key"
os.environ["AI_MODEL"] = "test-model"
os.environ.pop("REDIS_URL", None)
