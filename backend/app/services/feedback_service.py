from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.feedback_repository import FeedbackRepository
from app.schemas.feedback import (
    AnalysisResponse,
    FeedbackCreate,
)
from app.services.ai.provider import AIProvider


class ReviewService:
    """
    Business logic for customer review analysis.
    """

    def __init__(
        self,
        ai_provider: AIProvider,
        repository: FeedbackRepository,
    ):
        self.ai = ai_provider
        self.repository = repository

    def analyze_review(
        self,
        review: str,
    ) -> AnalysisResponse:
        """
        Analyze a review without saving it.
        """

        return self.ai.analyze_review(review)

    def analyze_and_save(
        self,
        db: Session,
        review: str,
    ):
        """
        Analyze a review and save the result.
        """

        analysis = self.ai.analyze_review(review)

        feedback = FeedbackCreate(
            review=review,
            label=analysis.label,
            score=analysis.score,
            theme=analysis.theme,
            suggestion=analysis.suggestion,
            confidence=analysis.confidence,
        )

        return self.repository.create(
            db=db,
            feedback=feedback,
        )

    def get_history(
        self,
        db: Session,
    ):
        """
        Return all saved reviews.
        """

        return self.repository.get_all(db)

    def get_feedback_by_id(
        self,
        db: Session,
        feedback_id: UUID,
    ):
        """
        Return one review.
        """

        return self.repository.get_by_id(
            db=db,
            feedback_id=feedback_id,
        )

    def delete_feedback(
        self,
        db: Session,
        feedback_id: UUID,
    ):
        """
        Delete one review.
        """

        feedback = self.repository.get_by_id(
            db=db,
            feedback_id=feedback_id,
        )

        if feedback is None:
            return None

        self.repository.delete(
            db=db,
            feedback=feedback,
        )

        return feedback
