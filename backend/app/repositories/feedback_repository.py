from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate


class FeedbackRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        feedback: FeedbackCreate,
    ) -> Feedback:

        db_feedback = Feedback(
            review=feedback.review,
            label=feedback.label,
            score=feedback.score,
            theme=feedback.theme,
            suggestion=feedback.suggestion,
            confidence=feedback.confidence,
        )

        self.db.add(db_feedback)
        self.db.commit()
        self.db.refresh(db_feedback)

        return db_feedback

    # Get all feedbacks from the table, ordered by creation date (most recent first)
    def get_all(
        self,
    ) -> list[Feedback]:

        statement = select(Feedback).order_by(Feedback.created_at.desc())

        return list(self.db.scalars(statement).all())

    # Get feedbacks by id
    def get_by_id(
        self,
        feedback_id: UUID | str,
    ) -> Feedback | None:

        return self.db.get(
            Feedback,
            feedback_id,
        )

    # Delete feedback by id
    def delete(
        self,
        feedback: Feedback,
    ) -> None:

        self.db.delete(feedback)
        self.db.commit()

    # Count the number of feedbacks in the table
    def count(
        self,
    ) -> int:
        return len(self.get_all())
