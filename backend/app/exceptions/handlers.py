from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.exceptions.custom_exceptions import AppException
from app.utils.responses import error_response


def _response(message: str, status_code: int) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=error_response(message))


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return _response(exc.message, exc.status_code)


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    first_error = exc.errors()[0] if exc.errors() else {}
    message = first_error.get(
        "msg", "Please check the submitted information and try again."
    )
    return _response(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    message = (
        exc.detail
        if isinstance(exc.detail, str)
        else "The request could not be completed."
    )
    return _response(message, exc.status_code)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return _response(
        "Something went wrong on our side. Please try again shortly.",
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
