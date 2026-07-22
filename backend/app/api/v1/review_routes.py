# from sqlalchemy.orm import Session

# from fastapi import APIRouter
# from fastapi import Depends
# from fastapi import HTTPException
# from fastapi import status

# from app.core.database import get_db
# from app.schemas.feedback import (
#     AnalysisResponse,
#     FeedbackResponse,
#     ReviewRequest,
# )
# from app.services.feedback_service import feedback_service

# router = APIRouter(
#     prefix="/reviews",
#     tags=["Reviews"],
# )


# @router.post(
#     "/analyze",
#     response_model=AnalysisResponse,
#     status_code=status.HTTP_200_OK,
# )
# def analyze_review(
#     request: ReviewRequest,
# ):
#     """
#     Analyze a customer review without saving it.
#     """

#     return feedback_service.analyze_review(request.text)


# @router.post(
#     "/analyze-and-save",
#     response_model=FeedbackResponse,
#     status_code=status.HTTP_201_CREATED,
# )
# def analyze_and_save(
#     request: ReviewRequest,
#     db: Session = Depends(get_db),
# ):
#     """
#     Analyze a review and save it to the database.
#     """

#     return feedback_service.analyze_and_save(
#         db=db,
#         review=request.text,
#     )


# @router.get(
#     "/history",
#     response_model=list[FeedbackResponse],
# )
# def get_history(
#     db: Session = Depends(get_db),
# ):
#     """
#     Return all saved reviews.
#     """

#     return feedback_service.get_history(db)


# @router.delete(
#     "/{feedback_id}",
#     response_model=FeedbackResponse,
# )
# def delete_feedback(
#     feedback_id: str,
#     db: Session = Depends(get_db),
# ):
#     """
#     Delete one review.
#     """

#     feedback = feedback_service.delete_feedback(
#         db,
#         feedback_id,
#     )

#     if feedback is None:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Feedback not found.",
#         )

#     return feedback


from uuid import UUID

# from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import APIRouter, Depends, status
from app.exceptions.custom_exceptions import FeedbackNotFoundException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.services import get_review_service
from app.models.feedback import Feedback
from app.schemas.api_response import ApiResponse
from app.schemas.feedback import (
    AnalysisResponse,
    FeedbackResponse,
    ReviewRequest,
)
from app.utils.responses import success_response

# from app.services.feedback_service import FeedbackService
from app.services.review_service import ReviewService

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


@router.post(
    "/analyze",
    response_model=ApiResponse[AnalysisResponse],
    status_code=status.HTTP_200_OK,
)
def analyze_review(
    request: ReviewRequest,
    # feedback_service: FeedbackService = Depends(get_feedback_service),
    review_service: ReviewService = Depends(get_review_service),
):
    """
    Analyze a customer review using AI LLM without saving it.
    """

    analysis = review_service.analyze_review(request.text)
    analysis_response = analysis.model_dump(mode="json")

    return success_response(
        data=analysis_response,
        message="Review analyzed successfully.",
    )


def _build_feedback_response(feedback: Feedback) -> dict[str, object]:
    return FeedbackResponse.model_validate(feedback).model_dump(mode="json")


def _build_feedback_history(history: list[Feedback]) -> list[dict[str, object]]:
    return [
        FeedbackResponse.model_validate(item).model_dump(mode="json")
        for item in history
    ]


@router.post(
    "/analyze-and-save",
    response_model=ApiResponse[FeedbackResponse],
    status_code=status.HTTP_201_CREATED,
)
def analyze_and_save(
    request: ReviewRequest,
    db: Session = Depends(get_db),
    review_service: ReviewService = Depends(get_review_service),
):
    """
    Analyze a customer review and save it to the database.
    """

    feedback = review_service.analyze_and_save(
        db=db,
        review=request.text,
    )
    feedback_response = _build_feedback_response(feedback)

    return success_response(
        data=feedback_response,
        message="Review saved successfully.",
    )


@router.get(
    "/history",
    response_model=ApiResponse[list[FeedbackResponse]],
    status_code=status.HTTP_200_OK,
)
def get_history(
    db: Session = Depends(get_db),
    review_service: ReviewService = Depends(get_review_service),
):
    """
    Return all previously analyzed customer reviews.
    """

    history = review_service.get_history(db)
    history_response = _build_feedback_history(history)

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
    db: Session = Depends(get_db),
    review_service: ReviewService = Depends(get_review_service),
):
    """
    Get a single feedback record by its UUID.
    """

    feedback = review_service.get_feedback_by_id(
        db=db,
        feedback_id=feedback_id,
    )

    if feedback is None:
        raise FeedbackNotFoundException()

    feedback_response = _build_feedback_response(feedback)

    return success_response(
        data=feedback_response,
        message="Feedback retrieved successfully.",
    )


# @router.delete(
#     "/{feedback_id}",
#     response_model=ApiResponse[FeedbackResponse],
#     status_code=status.HTTP_200_OK,
# )
# def delete_feedback(
#     feedback_id: UUID,
#     db: Session = Depends(get_db),
#     review_service: ReviewService = Depends(get_review_service),
# ):
#     """
#     Delete a feedback record.
#     """

#     feedback = review_service.delete_feedback(
#         db=db,
#         feedback_id=feedback_id,
#     )

#     if feedback is None:
#         raise FeedbackNotFoundException()

#     feedback_response = _build_feedback_response(feedback)

#     return success_response(
#         data=feedback_response,
#         message="Feedback deleted successfully.",
#     )
