from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.feedback import AnalysisResponse


class GeminiService:
    """
    Service responsible for communicating with Google Gemini.
    """

    def __init__(self):
        self.client = genai.Client(api_key=settings.AI_API_KEY)

    def analyze_review(
        self,
        review: str,
    ) -> AnalysisResponse:

        prompt = f"""
            You are a customer review analyzer.

            Analyze the following customer review.

            Return ONLY valid JSON.

            Rules:

            - label must be one of:
            - positive
            - neutral
            - negative

            - score must be an integer from 1 to 5.

            - theme should be a short phrase (1–3 words).

            - suggestion should be one short sentence.
            
            - confidence should be a float between 0.0 and 1.0.

            Customer Review:

            {review}
            """
        try:
            response = self.client.models.generate_content(
                model=settings.AI_MODEL,
                contents=[
                    types.Content(
                        type="text",
                        text=prompt,
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json",
                    response_schema=AnalysisResponse,
                ),
            )
            if response.parsed is None:
                raise ValueError("Gemini returned an invalid response.")
            else:
                return response.parsed
        except Exception as e:
            raise RuntimeError(f"Error occurred while communicating with Gemini: {e}")
        

       


# gemini_service = GeminiService()
