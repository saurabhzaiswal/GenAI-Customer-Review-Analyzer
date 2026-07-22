from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# -----------------------------
# Request Schema
# -----------------------------

class ReviewRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Customer review text",
        examples=["The food was amazing but delivery was slow."]
    )


# -----------------------------
# AI LMM Analysis Schema
# -----------------------------

class AnalysisResponse(BaseModel):
    label: Literal["positive", "neutral", "negative"]
    score: int = Field(..., ge=1, le=5)
    theme: str
    suggestion: str | None = None
    confidence: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Model confidence score (0.0 to 1.0)"
    )


# -----------------------------
# Database Create Schema
# -----------------------------

class FeedbackCreate(BaseModel):
    review: str
    label: Literal["positive", "neutral", "negative"]
    score: int = Field(..., ge=1, le=5)
    theme: str
    suggestion: str | None = None
    confidence: float | None = Field(
        default=None,
        ge=0,
        le=1
    )


# -----------------------------
# API Response Schema
# -----------------------------

class FeedbackResponse(BaseModel):
    id: UUID
    review: str
    label: str
    score: int
    theme: str
    suggestion: str | None
    confidence: float | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={UUID: str},
    )