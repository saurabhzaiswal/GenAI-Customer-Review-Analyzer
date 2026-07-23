from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str
    APP_URL: str
    APP_VERSION: str
    DEBUG: bool = False

    DATABASE_URL: str

    REDIS_URL: str | None = None
    METRICS_ENABLED: bool = False

    AI_PROVIDER: str
    AI_API_KEY: str
    AI_MODEL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
