from abc import ABC, abstractmethod

from app.schemas.feedback import AnalysisResponse


class AIProvider(ABC):
    """
    Base interface for every AI provider.
    """

    @abstractmethod
    def analyze_review(
        self,
        review: str,
    ) -> AnalysisResponse:
        """
        Analyze a customer review and return structured output.
        """
        raise NotImplementedError