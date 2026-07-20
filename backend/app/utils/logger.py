import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger("genai-review-analyzer")

# in any service:
# from app.utils.logger import logger

# logger.info("Gemini request started")