from app.core.config import settings

from app.services.ai.provider import AIProvider
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.claude_provider import ClaudeProvider


class AIProviderFactory:

    @staticmethod
    def create() -> AIProvider:

        provider = settings.AI_PROVIDER.lower()

        if provider == "gemini":
            return GeminiProvider()

        if provider == "openai":
            return OpenAIProvider()

        if provider == "claude":
            return ClaudeProvider()

        raise ValueError(
            f"Unsupported AI Provider: {provider}"
        )