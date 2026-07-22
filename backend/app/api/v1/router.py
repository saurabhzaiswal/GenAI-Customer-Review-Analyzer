from fastapi import APIRouter

from app.api.v1.review_routes import router as review_router

router = APIRouter(prefix="/v1")
router.include_router(review_router)
