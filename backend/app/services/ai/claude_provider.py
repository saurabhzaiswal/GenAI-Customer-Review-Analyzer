from app.schemas.feedback import AnalysisResponse
from app.services.ai.provider import AIProvider


class ClaudeProvider(AIProvider):

    def analyze_review(
        self,
        review: str,
    ) -> AnalysisResponse:

        raise NotImplementedError(
            "Claude provider not implemented."
        )