from uuid import UUID

from app.repositories.feedback_repository import FeedbackRepository
from app.schemas.feedback import (
    AnalysisResponse,
    FeedbackCreate,
)
from app.services.ai.provider import AIProvider

from app.utils.sanitizer import sanitize_text
from app.exceptions.custom_exceptions import EmptyReviewException


class ReviewService:
    """
    Business logic for customer review analysis.
    """

    def __init__(
        self,
        ai_provider: AIProvider,
        repository: FeedbackRepository | None = None,
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
        sanitized_text = sanitize_text(review)
        if not sanitized_text:
            raise EmptyReviewException()
        return self.ai.analyze_review(sanitized_text)

    def analyze_and_save(
        self,
        review: str,
    ):
        """
        Analyze a review and save the result.
        """
        sanitized_text = sanitize_text(review)
        if not sanitized_text:
            raise EmptyReviewException()
        analysis = self.ai.analyze_review(sanitized_text)

        feedback = FeedbackCreate(
            review=sanitized_text,
            label=analysis.label,
            score=analysis.score,
            theme=analysis.theme,
            suggestion=analysis.suggestion,
            confidence=analysis.confidence,
        )

        return self._repository().create(feedback=feedback)

    def get_history(
        self,
    ):
        """
        Return all saved reviews.
        """

        return self._repository().get_all()

    def get_feedback_by_id(
        self,
        feedback_id: UUID,
    ):
        """
        Return one review.
        """

        return self._repository().get_by_id(feedback_id=feedback_id)

    def delete_feedback(
        self,
        feedback_id: UUID,
    ):
        """
        Delete one review.
        """

        repository = self._repository()
        feedback = repository.get_by_id(feedback_id=feedback_id)

        if feedback is None:
            return None

        repository.delete(feedback=feedback)

        return feedback

    def _repository(self) -> FeedbackRepository:
        if self.repository is None:
            raise RuntimeError("This operation requires a database repository.")
        return self.repository
