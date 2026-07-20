from fastapi import Request
from fastapi.responses import JSONResponse

from app.exceptions.custom_exceptions import AppException


async def app_exception_handler(
    request: Request,
    exc: AppException,
):

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "path": request.url.path,
        },
    )
    
async def global_exception_handler(
    request: Request,
    exc: Exception,
):

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error",
            "path": request.url.path,
        },
    )