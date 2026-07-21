# GenAI Customer Review Analyzer

## Project Overview

The **GenAI Customer Review Analyzer** is a production-style, full-stack AI application that helps businesses analyze customer feedback at scale. The application combines an **Angular frontend**, a **FastAPI backend**, **Google Gemini** for AI-powered analysis, and **SQLite** for persistent data storage.

Instead of manually reading hundreds of customer reviews, users can submit multiple reviews through the web interface. Each review is analyzed by the backend using Google's Gemini model to determine customer sentiment, assign a sentiment score, identify the primary discussion theme, and optionally generate actionable business suggestions.

The analyzed results are displayed in an interactive dashboard and can be stored for future reporting and historical analysis.

---

# Problem Statement

Businesses receive customer feedback from multiple sources such as:

* Google Reviews
* Amazon
* Flipkart
* Swiggy
* Zomato
* Yelp
* Social Media Platforms

Reading every review manually is time-consuming and often leads to missed customer insights.

This project automates the review analysis process by leveraging Generative AI, enabling businesses to quickly understand customer satisfaction, identify recurring issues, and make informed decisions.

---

# Project Objectives

The application is designed to:

* Analyze multiple customer reviews automatically.
* Detect review sentiment (Positive, Neutral, Negative).
* Generate a sentiment score for every review.
* Identify the primary theme discussed.
* Provide optional AI-generated improvement suggestions.
* Store analyzed reviews in a local database.
* Display historical analysis reports.
* Present business insights through an interactive dashboard.

---

# System Architecture

```text
                  Customer Reviews
                         │
                         ▼
                 Angular Frontend
                         │
               HTTP REST API Requests
                         │
                         ▼
                  FastAPI Backend
                         │
             Google Gemini API (LLM)
                         │
              Structured JSON Response
                         │
                    SQLite Database
                         │
                         ▼
          Dashboard, Reports & History
```

---

# Technology Stack

| Component       | Technology         | Purpose                                                                                              |
| --------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| Frontend        | Angular            | Interactive web application for entering reviews, visualizing results, and managing analysis history |
| Backend         | FastAPI            | REST API responsible for processing requests and communicating with Gemini                           |
| AI Model        | Google Gemini      | Sentiment analysis, theme extraction, and AI-powered business insights                               |
| Database        | SQLite             | Persistent storage of analyzed customer reviews                                                      |
| Validation      | Pydantic           | Structured request and response validation                                                           |
| HTTP Client     | Angular HttpClient | Communication between Angular and FastAPI                                                            |
| Development     | Python, TypeScript | Core programming languages                                                                           |
| Environment     | uv                 | Dependency and virtual environment management                                                        |
| Version Control | Git & GitHub       | Source code management                                                                               |

---

# Core Features

### Customer Review Analysis

* Submit multiple reviews simultaneously.
* One review per line.
* Batch processing of customer feedback.

---

### AI-Powered Analysis

Each review is analyzed using Google Gemini to determine:

* Sentiment

  * Positive
  * Neutral
  * Negative

* Sentiment Score

  * Scale of 1–5

* Primary Theme

  * Food
  * Delivery
  * Customer Service
  * Pricing
  * Quality
  * Staff
  * Packaging

* Optional Improvement Suggestion

---

### Interactive Angular Dashboard

The frontend allows users to:

* Enter multiple customer reviews.
* Submit reviews for AI analysis.
* View individual review results.
* Display summary statistics.
* View sentiment distribution.
* Search and filter analyzed reviews.
* View saved history.
* Stream analysis results as they are processed (optional enhancement).

---

### Backend API

The FastAPI backend provides REST endpoints that:

* Receive customer reviews.
* Generate prompts for Gemini.
* Validate structured AI responses.
* Return JSON responses to Angular.
* Handle API failures gracefully.

---

### Database Management

The application stores every analyzed review inside a SQLite database.

Each record may include:

* Original Review
* Sentiment Label
* Sentiment Score
* Theme
* AI Suggestion
* Timestamp

Historical data enables businesses to monitor customer satisfaction trends over time.

---

# Project Workflow

1. User enters one or more customer reviews in the Angular application.
2. Angular sends each review to the FastAPI backend.
3. FastAPI calls the Google Gemini API.
4. Gemini analyzes the review.
5. FastAPI validates the response using Pydantic.
6. Structured JSON is returned to Angular.
7. Angular updates the dashboard with the analysis results.
8. Users can save the analyzed reviews into SQLite.
9. Saved records can be viewed later through the History page.

---

# Dashboard Analytics

The application automatically generates useful business metrics including:

* Total Reviews Processed
* Average Sentiment Score
* Positive Review Percentage
* Negative Review Percentage
* Neutral Review Percentage
* Most Frequently Mentioned Theme
* Theme Distribution Charts
* Sentiment Distribution Charts

---

# Error Handling and Robustness

Robust error handling is implemented throughout the application to ensure reliability.

### Python Exception Handling

The project demonstrates handling common runtime exceptions including:

* ZeroDivisionError
* IndexError
* ValueError
* FileNotFoundError
* Database Errors
* Network Exceptions

Appropriate `try-except` blocks prevent unexpected application crashes and provide meaningful error messages.

### API Error Handling

The backend validates:

* Missing API Keys
* Invalid Requests
* Gemini API Errors
* Network Timeouts
* Invalid JSON Responses

HTTP status codes are handled correctly, including:

* 200 OK
* 400 Bad Request
* 401 Unauthorized
* 404 Not Found
* 500 Internal Server Error

---

# AI Integration

The application demonstrates practical integration with Large Language Models by:

* Designing effective prompts.
* Requesting structured JSON responses.
* Validating responses using Pydantic.
* Combining live application data with LLM-generated insights.
* Managing API authentication securely through environment variables.

---

# Development Practices

The project follows modern development practices including:

* Modular project architecture
* Separation of frontend and backend
* Environment variable management
* Virtual environments using uv
* Git version control
* Comprehensive README documentation
* AI-assisted development with developer validation and understanding

---

# Future Enhancements

* JWT Authentication
* Role-Based Access Control
* CSV/Excel Upload
* PDF Report Generation
* Interactive Charts
* Real-Time Streaming Responses
* PostgreSQL Integration
* Docker Deployment
* Cloud Hosting
* Email Notifications
* Multi-language Support

---

# Learning Outcomes

This project demonstrates practical knowledge of:

* Angular Development
* FastAPI
* REST API Design
* Google Gemini Integration
* Prompt Engineering
* Structured AI Output
* Pydantic Validation
* SQLite Database Operations
* Error Handling
* AI-Assisted Software Development
* Full-Stack Application Architecture
* Version Control using Git & GitHub

---

# Conclusion

The **GenAI Customer Review Analyzer** demonstrates how modern AI technologies can be integrated into a full-stack application to automate customer feedback analysis. By combining Angular, FastAPI, Google Gemini, and SQLite, the project delivers meaningful business insights while showcasing scalable software architecture, robust backend design, interactive frontend development, and practical AI integration.


Final Architecture
Angular
    │
    ▼
Review Route (Controller)
    │
    ▼
ReviewService
    │
    ├──────────────┐
    ▼              ▼
GeminiService   FeedbackRepository
                     │
                     ▼
              SQLAlchemy + PostgreSQL

Notice something:

Route → receives HTTP request.
ReviewService → business logic.
GeminiService → AI only.
Repository → database only.

This follows the Single Responsibility Principle.


POST /reviews/analyze
           │
           ▼
Review Route
           │
 Depends(get_review_service)
           │
           ▼
ReviewService
           │
           ├──────────────┐
           ▼              ▼
GeminiService      FeedbackRepository
           │              │
           ▼              ▼
Google Gemini      PostgreSQL
           │              │
           └──────┬───────┘
                  ▼
         FeedbackResponse
                  │
                  ▼
              JSON Response

Each class has a single responsibility, which makes the code easier to test, maintain, and extend.

Angular
    │
    ▼
Review Routes (Controller)
    │
    ▼
FeedbackService (Business Logic)
    │
    ├──────────────┐
    ▼              ▼
GeminiService   FeedbackRepository
    │              │
    ▼              ▼
 Gemini API    PostgreSQL


 app/
│
├── api/
│   ├── review_routes.py
│   ├── health_routes.py
│   └── __init__.py
│
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   └── __init__.py
│
├── dependencies/
│   ├── services.py
│   └── __init__.py
│
├── exceptions/
│   ├── handlers.py
│   ├── custom_exceptions.py
│   └── __init__.py
│
├── middleware/
│   ├── logging.py
│   ├── request_id.py
│   ├── cors.py
│   └── __init__.py
│
├── models/
├── repositories/
├── schemas/
├── services/
├── utils/
│   ├── logger.py
│   ├── responses.py
│   └── __init__.py
│
└── main.py

                   AIProvider
                 (Abstract Base)
                      ▲
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
 GeminiProvider               OpenAIProvider
        │                           │
        ▼                           ▼
 Google Gemini API          OpenAI GPT API


Final phases:

Phase 6

Docker
Docker Compose
FastAPI
Angular
PostgreSQL
Redis

Phase 7

GitHub Actions
Ruff
Black
Pytest
Angular tests
Build pipeline
Deployment
------------------------------------------





This design follows the Dependency Inversion Principle (SOLID),
Review Routes
      │
      ▼
ReviewService
      │
      ▼
AIProvider (Abstract)
      ▲
      │
 ┌────┼───────────┬──────────────┬────────────┐
 │    │           │              │            │
 ▼    ▼           ▼              ▼            ▼
Gemini OpenAI   Claude       Ollama      Azure OpenAI
      │
      ▼
Google API

Full Execution Flow
                 HTTP Request
                      │
                      ▼
             review_routes.py
                      │
                      ▼
      Depends(get_review_service())
                      │
                      ▼
                ReviewService
             ┌────────┴────────┐
             ▼                 ▼
        AIProvider      FeedbackRepository
             ▲
             │
    AIProviderFactory
             │
             ▼
     Gemini/OpenAI/Claude


     HTTP Request
      │
      ▼
Review Route
      │
      ▼
Depends(get_review_service)
      │
      ▼
get_review_service()
      │
      ▼
get_ai_provider()
      │
      ▼
AIProviderFactory.create()
      │
      ▼
Reads .env
      │
      ▼
AI_PROVIDER=gemini
      │
      ▼
returns GeminiProvider()
      │
      ▼
ReviewService(ai_provider=GeminiProvider())
      │
      ▼
self.ai.analyze_review()
      │
      ▼
GeminiProvider.analyze_review()
      │
      ▼
Google Gemini API

This is a classic Factory + Dependency Injection pattern
                 .env
                  │
                  ▼
          AIProviderFactory
                  │
     ┌────────────┼────────────┐
     │            │            │
     ▼            ▼            ▼
GeminiProvider OpenAIProvider ClaudeProvider
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
             AIProvider
                  │
                  ▼
            ReviewService
                  │
                  ▼
           review_routes.py

Client
   │
   ▼
RequestID Middleware
   │
   ▼
Logging Middleware
   │
   ▼
CORS Middleware
   │
   ▼
API Router
   │
   ▼
ReviewService
   │
   ├─────────────► AIProvider
   │                  │
   │                  ▼
   │          Gemini/OpenAI/Claude
   │
   ▼
Repository
   │
   ▼
PostgreSQL

Final validation flow
Client
    │
    ▼
Pydantic Validation
(min_length, max_length)
    │
    ▼
ReviewService
    │
    ▼
sanitize_review()
    │
    ▼
Empty after sanitization?
    │
 ┌──┴─────────────┐
 │                │
Yes              No
 │                │
 ▼                ▼
Raise       Gemini AI
EmptyReviewException
                  │
                  ▼
          FeedbackRepository
                  │
                  ▼
             PostgreSQL

This gives you multiple layers of defense:

Pydantic validates request size and basic constraints.
Bleach removes unsafe HTML/JavaScript.
Business validation checks whether the remaining content is meaningful.
Custom exceptions produce consistent API error responses.

---------------------------------------------------------------------------

This won't work:

app.include_router(prefix="/api")  ❌
app.include_router(review_router, prefix="/v1")

because include_router() always expects a router as its first argument. You can't register only a prefix.

Option 1 (Recommended) ⭐⭐⭐⭐⭐

Create a version router.

Folder structure
app/
└── api/
    ├── api.py          👈 master router
    ├── health_routes.py
    └── v1/
        ├── __init__.py
        ├── router.py   👈 v1 router
        ├── review_routes.py
        ├── auth_routes.py
        ├── ai_routes.py
        └── feedback_routes.py
app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1.review_routes import router as review_router

router = APIRouter(prefix="/v1")

router.include_router(review_router)

Later you'll simply add more routes:

router.include_router(auth_router)
router.include_router(user_router)
router.include_router(ai_router)
router.include_router(admin_router)
app/api/api.py
from fastapi import APIRouter

from app.api.v1.router import router as v1_router
from app.api.health_routes import router as health_router

api_router = APIRouter(prefix="/api")

api_router.include_router(v1_router)
api_router.include_router(health_router)
main.py

Now main.py becomes very clean:

from app.api.api import api_router

app.include_router(api_router)

That's it.

Your final URLs become
/api/v1/reviews/analyze
/api/v1/reviews/history
/api/v1/auth/login
/api/v1/users
/api/v1/admin
In the future

When you release version 2:

app/
api/
    v1/
    v2/

You only add another router.

api_router.include_router(v1_router)
api_router.include_router(v2_router)

Endpoints become:

/api/v1/...
/api/v2/...

Both versions can run simultaneously.

Enterprise architecture
FastAPI
    │
    ▼
api_router (/api)
    │
    ├──────────────┐
    ▼              ▼
v1_router      v2_router
 (/v1)          (/v2)
    │               │
    ├──────┐        ├──────┐
    ▼      ▼        ▼      ▼
Reviews  Users    Reviews  Users

This is the pattern you'll commonly see in larger FastAPI projects and aligns well with how API versioning is handled in production systems.

I recommend switching to this structure now, since your project is still evolving. It will keep main.py minimal and make adding future API versions straightforwar


------------------------------------------------------------------

The Angular architecture I'd recommend

Since this is a portfolio project, I'd build it with Angular 20 using standalone components and signals.

frontend/
│
├── src/
│
├── app/
│   │
│   ├── core/
│   │   ├── services/
│   │   │     api.service.ts
│   │   │     review.service.ts
│   │   │
│   │   ├── interceptors/
│   │   │     error.interceptor.ts
│   │   │     loading.interceptor.ts
│   │   │
│   │   ├── guards/
│   │   └── config/
│   │
│   ├── features/
│   │   │
│   │   └── reviews/
│   │        │
│   │        ├── pages/
│   │        │     review.page.ts
│   │        │
│   │        ├── components/
│   │        │     review-form/
│   │        │     review-result/
│   │        │     review-history/
│   │        │
│   │        ├── models/
│   │        │
│   │        └── services/
│   │
│   ├── shared/
│   │
│   ├── layouts/
│   │
│   ├── app.routes.ts
│   └── app.config.ts
│
└── environments/

This mirrors your backend structure nicely.

-----------------------------------------------------------------------------------------

Frontend
✅ Angular 22
TypeScript 5.x
Angular Signals
Standalone Components
Angular Material
Reactive Forms
HttpClient
Functional Interceptors
RxJS
Tailwind CSS
Chart.js (later for analytics)
Frontend Architecture

We'll build it exactly like we built the backend.

frontend/

src/
│
├── app/
│
├── core/
│   │
│   ├── api/
│   │      api.service.ts
│   │
│   ├── interceptors/
│   │      auth.interceptor.ts
│   │      error.interceptor.ts
│   │      loading.interceptor.ts
│   │
│   ├── services/
│   │      review-api.service.ts
│   │
│   ├── config/
│   │      api.config.ts
│   │
│   └── models/
│
├── features/
│
│   └── reviews/
│
│       ├── pages/
│       │      review-page/
│       │
│       ├── components/
│       │      review-form/
│       │      review-card/
│       │      review-history/
│       │      sentiment-badge/
│       │
│       ├── services/
│       │      review.service.ts
│       │
│       └── models/
│
├── shared/
│
│   ├── components/
│   ├── pipes/
│   └── directives/
│
├── layouts/
│
├── app.config.ts
├── app.routes.ts
└── app.component.ts
UI

We'll make it look modern.

--------------------------------------------------

        GenAI Customer Review Analyzer

--------------------------------------------------

Review

+--------------------------------------+
|                                      |
|                                      |
|                                      |
+--------------------------------------+

        Analyze

     Analyze & Save

--------------------------------------------------

AI Analysis

😊 Positive

★★★★☆

Theme

Fast Delivery

Suggestion

Continue maintaining delivery quality.

Confidence

98%

--------------------------------------------------

History

Review

Sentiment

Score

Theme

Delete
Later

Once everything works we'll add

Dashboard

↓

Analytics

↓

Charts

↓

AI Statistics

↓

Export CSV

↓

Dark Mode
Angular Architecture

Exactly like the backend.

Review Page
      │
      ▼
ReviewService
      │
      ▼
ReviewApiService
      │
      ▼
HttpClient
      │
      ▼
FastAPI

No component should call HttpClient directly.

Environment

We'll have

environment.ts

environment.development.ts

environment.production.ts
API_URL=http://localhost:8000/api/v1

So changing environments is just changing the configuration.

Later Docker

Eventually the architecture will become

                 Docker Compose

                     │
     ┌───────────────┼────────────────┐
     │               │                │
     ▼               ▼                ▼

 Angular        FastAPI          PostgreSQL
                    │
                    ▼
                 Gemini API

                    │
                    ▼
                  Redis
CI/CD
GitHub

↓

Actions

↓

Lint

↓

Unit Tests

↓

Angular Build

↓

Docker Build

↓

Deploy
One improvement I'd make

Since this project is going to be one of the strongest items in your portfolio, I wouldn't build it as just a CRUD frontend.

I'd structure it as a real enterprise application from day one:

Angular 22
Standalone Components
Signals for local state
Feature-based architecture
Functional HTTP Interceptors
Typed API models generated from your backend schemas where practical
Angular Material + Tailwind CSS
Lazy-loaded feature routes
Clean separation between UI components and API services

This will mirror the architecture you've already established on the FastAPI side and make the overall project look consistent and production-ready.

I think it's worth investing that extra effort because this project can become a centerpiece of your resume and something you can confidently walk through in senior-level interviews.