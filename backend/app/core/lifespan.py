from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.redis import close_redis, initialize_redis
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when the application starts
    and once when it shuts down.
    """

    logger.info("Starting GenAI Customer Review Analyzer")
    await initialize_redis()

    try:
        yield
    finally:
        await close_redis()
        logger.info("Shutting down GenAI Customer Review Analyzer")
