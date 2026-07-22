from fastapi import status


class AppException(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code


class FeedbackNotFoundException(AppException):
    def __init__(self):
        super().__init__(
            message="Feedback not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class AIProviderException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class DatabaseException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class ValidationException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class EmptyReviewException(AppException):
    def __init__(self):

        super().__init__(
            message="Review is empty.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
