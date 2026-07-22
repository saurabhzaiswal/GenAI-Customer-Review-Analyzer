from app.core.config import settings

from app.services.ai.provider import AIProvider


class AIProviderFactory:
    @staticmethod
    def create() -> AIProvider:

        provider = settings.AI_PROVIDER.lower()

        if provider == "gemini":
            from app.services.ai.gemini_provider import GeminiProvider

            return GeminiProvider()

        if provider == "openai":
            from app.services.ai.openai_provider import OpenAIProvider

            return OpenAIProvider()

        if provider == "claude":
            from app.services.ai.claude_provider import ClaudeProvider

            return ClaudeProvider()

        raise ValueError(f"Unsupported AI Provider: {provider}")
