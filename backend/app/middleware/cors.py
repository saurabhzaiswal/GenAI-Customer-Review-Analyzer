from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def register_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            # "http://localhost:4200",
            settings.APP_URL
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
