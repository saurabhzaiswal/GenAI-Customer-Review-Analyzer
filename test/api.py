# from fastapi import FastAPI
# from pydantic import BaseModel
# from dotenv import load_dotenv
# from google import genai
# from google.genai import types
# from fastapi import HTTPException
# from prompt_toolkit import choice

# load_dotenv()

# client = genai.Client()

# app = FastAPI()

# # What is the review text that you want to analyze?
# class Review(BaseModel):
#     text: str
    
# # What LLM gives back, and  what we send to the  caller.
# # We keep it small on purpose -> fewer tokens, less cost, faster response.
# class Analysis(BaseModel):
#     label: str   # "positive", "negative", or "neutral"
#     score: int   # 1 (very bad) to 5 (very good)
#     theme: str   # one word: what the review is mainly about (e.g. "delivery")

# # Streaming interactions

# '''from google import genai

# client = genai.Client()

# stream = client.interactions.create(
#     model="gemini-3.5-flash",
#     input="Count from 1 to 25.",
#     stream=True,
# )
# for event in stream:
#     if event.event_type == "step.delta":
#         if event.delta.type == "text":
#             print(event.delta.text, end="", flush=True)'''
            
# @app.post("/analyze")
# async def analyze(review: Review):
#     prompt = (
#             "Analyze this customer review.\n"
#             "label must be 'positive', 'negative', or 'neutral'.\n"
#             "score must be a number from 1 (very bad) to 5 (very good).\n"
#             "theme must be ONE lowercase word for the main topic "
#             "(for example: delivery, taste, price, service, quality).\n"
#             f"Review: {review.text}"
#         )
#     try:
#         response = client.models.generate_content(
#             model="gemini-3.5-flash",
#             contents=[
#                 types.Content(
#                     type="text",
#                     text=prompt,
#                 )
#             ],
#             config=types.GenerateContentConfig(
#                 temperature=0.2,
#                 top_p=0.95,
#                 max_output_tokens=1024,
#                 response_mime_type="application/json",
#                 response_schema=Analysis,
#             ),
#         )
#         if response and response.parsed is None:
#             raise HTTPException(
#                 status_code=500,
#                 detail="Failed to parse response from the model."
#         )
            
#         return response.parsed
    
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=str(f'Error occurred: {e}')
#         )