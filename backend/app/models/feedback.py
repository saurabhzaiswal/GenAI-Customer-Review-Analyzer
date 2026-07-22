from datetime import datetime
from uuid import UUID

from sqlalchemy import Float

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from app.core.database import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    # id: Mapped[UUID] = mapped_column(
    #     PG_UUID(as_uuid=True),
    #     primary_key=True,
    #     default=uuid7,
    # )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid7,
    )

    review: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    label: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    theme: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    suggestion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
