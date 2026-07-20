from contextlib import asynccontextmanager

from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when the application starts
    and once when it shuts down.
    """

    print("Starting GenAI Customer Review Analyzer...")

    yield

    print("Shutting down...")