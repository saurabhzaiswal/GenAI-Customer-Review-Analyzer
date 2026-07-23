from uuid import UUID

from fastapi import APIRouter, Depends, status
from app.exceptions.custom_exceptions import FeedbackNotFoundException
from app.dependencies.services import (
    get_cached_feedback_service,
    get_cached_review_service,
    get_review_service_with_repository,
)
from app.models.feedback import Feedback
from app.schemas.api_response import ApiResponse
from app.schemas.feedback import (
    AnalysisResponse,
    FeedbackResponse,
    ReviewRequest,
)
from app.utils.responses import success_response

from app.services.review_service import ReviewService
from app.services.cached_feedback_service import CachedFeedbackService
from app.services.cached_review_service import CachedReviewService

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


@router.post(
    "/analyze",
    response_model=ApiResponse[AnalysisResponse],
    status_code=status.HTTP_200_OK,
)
async def analyze_review(
    request: ReviewRequest,
    review_service: CachedReviewService = Depends(get_cached_review_service),
):
    """
    Analyze a customer review using AI LLM without saving it.
    """

    analysis = await review_service.analyze_review(request.text)
    analysis_response = analysis.model_dump(mode="json")

    return success_response(
        data=analysis_response,
        message="Review analyzed successfully.",
    )


def build_feedback_response(feedback: Feedback) -> dict[str, object]:
    return FeedbackResponse.model_validate(feedback).model_dump(mode="json")


def build_feedback_history(
    history: list[FeedbackResponse],
) -> list[dict[str, object]]:
    return [item.model_dump(mode="json") for item in history]


@router.post(
    "/analyze-and-save",
    response_model=ApiResponse[FeedbackResponse],
    status_code=status.HTTP_201_CREATED,
)
async def analyze_and_save(
    request: ReviewRequest,
    review_service: CachedFeedbackService = Depends(get_cached_feedback_service),
):
    """
    Analyze a customer review and save it to the database.
    """

    feedback = await review_service.analyze_and_save(
        review=request.text,
    )
    feedback_response = build_feedback_response(feedback)

    return success_response(
        data=feedback_response,
        message="Review saved successfully.",
    )


@router.get(
    "/history",
    response_model=ApiResponse[list[FeedbackResponse]],
    status_code=status.HTTP_200_OK,
)
async def get_history(
    review_service: CachedFeedbackService = Depends(get_cached_feedback_service),
):
    """
    Return all previously analyzed customer reviews.
    """

    history = await review_service.get_history()
    history_response = build_feedback_history(history)

    return success_response(
        data=history_response,
        message="Review history loaded successfully.",
    )


@router.get(
    "/{feedback_id}",
    response_model=ApiResponse[FeedbackResponse],
    status_code=status.HTTP_200_OK,
)
def get_feedback(
    feedback_id: UUID,
    review_service: ReviewService = Depends(get_review_service_with_repository),
):
    """
    Get a single feedback record by its UUID.
    """

    feedback = review_service.get_feedback_by_id(
        feedback_id=feedback_id,
    )

    if feedback is None:
        raise FeedbackNotFoundException()

    feedback_response = build_feedback_response(feedback)

    return success_response(
        data=feedback_response,
        message="Feedback retrieved successfully.",
    )


@router.delete(
    "/{feedback_id}",
    response_model=ApiResponse[FeedbackResponse],
    status_code=status.HTTP_200_OK,
)
async def delete_feedback(
    feedback_id: UUID,
    review_service: CachedFeedbackService = Depends(get_cached_feedback_service),
):
    """Delete a feedback record."""
    feedback = await review_service.delete_feedback(feedback_id=feedback_id)
    if feedback is None:
        raise FeedbackNotFoundException()

    return success_response(
        data=build_feedback_response(feedback),
        message="Feedback deleted successfully.",
    )
