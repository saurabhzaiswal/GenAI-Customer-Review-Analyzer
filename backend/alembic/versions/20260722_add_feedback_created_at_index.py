"""Add an index for newest-first feedback history queries.

Revision ID: 20260722_created_at_idx
Revises: d79f95d19650
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260722_created_at_idx"
down_revision: str | Sequence[str] | None = "d79f95d19650"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_feedbacks_created_at",
        "feedbacks",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_feedbacks_created_at", table_name="feedbacks")
