# Project: GenAI Customer Review Analyzer

## Overview

The **GenAI Customer Review Analyzer** is a production-style, full-stack AI application that helps businesses analyze customer feedback at scale. The application combines an **Angular frontend, a FastAPI backend, Google Gemini** for AI-powered analysis, and **SQLite** for persistent data storage.

Instead of manually reading hundreds of customer reviews, users can submit multiple reviews through the web interface. Each review is analyzed by the backend using Google's Gemini model to determine customer sentiment, assign a sentiment score, identify the primary discussion theme, and optionally generate actionable business suggestions.

The analyzed results are displayed in an interactive dashboard and can be stored for future reporting and historical analysis.

Each review is analyzed to determine its sentiment, assign a sentiment score, identify the primary discussion theme, and optionally generate actionable suggestions. All analyzed reviews are stored in a **SQLite database**, allowing businesses to maintain historical customer feedback and monitor customer satisfaction over time.

This project demonstrates the development of a production-style AI application by combining modern frontend technologies, backend APIs, Large Language Models (LLMs), structured data validation, and database management.

---

# Problem Statement

Businesses often receive hundreds of customer reviews across platforms such as Google Reviews, Amazon, Flipkart, Zomato, Swiggy, and social media. Manually reviewing this feedback is time-consuming and inefficient.

This application enables businesses to:

* Analyze multiple customer reviews automatically.
* Detect customer sentiment (Positive, Neutral, or Negative).
* Assign a sentiment score to each review.
* Identify the primary topic discussed in every review.
* Generate AI-powered insights and recommendations.
* Store analyzed reviews for future reference and reporting.

---

# System Architecture

```text
                  Customer Reviews
                         │
                         ▼
                 Angular Frontend
                         │
                 REST API Requests
                         │
                         ▼
                  FastAPI Backend
                         │
          Google Gemini API (LLM)
                         │
          Structured AI Response
                         │
                   SQLite Database
                         │
                         ▼
            Dashboard, Analytics & History
```

---

# Technology Stack

### Frontend

* Angular
* TypeScript
* HTML5
* CSS / SCSS
* Angular HTTP Client

### Backend

* FastAPI
* Google Gemini API
* Pydantic
* Python
* python-dotenv

### Database

* SQLite

### Development Tools

* uv Package Manager
* Git & GitHub
* Visual Studio Code

---

# Key Features

* AI-powered customer review analysis
* Batch processing of multiple reviews
* Sentiment classification (Positive, Neutral, Negative)
* Sentiment scoring (1–5)
* Theme extraction (Food, Delivery, Service, Pricing, etc.)
* AI-generated business suggestions (optional)
* Interactive Angular dashboard
* REST API communication between frontend and backend
* SQLite database for persistent storage
* Historical review management
* Error handling and validation
* Responsive user interface

---

# Application Workflow

1. The user enters one or more customer reviews through the Angular interface.
2. Angular sends each review to the FastAPI backend using HTTP requests.
3. FastAPI forwards the review to the Google Gemini API.
4. Gemini analyzes the review and returns structured information.
5. FastAPI validates the response using Pydantic models.
6. The backend returns a structured JSON response to Angular.
7. Angular displays the results in an interactive dashboard.
8. Users can save analyzed reviews into the SQLite database.
9. Previously analyzed reviews can be viewed through the history section.

---

# Expected AI Response

```json
{
  "label": "Positive",
  "score": 5,
  "theme": "Food",
  "suggestion": "Maintain the current food quality and consistency."
}
```

---

# Dashboard Features

The Angular frontend will provide:

* Multiple review input
* Review analysis with one click
* Review history
* Summary statistics
* Average sentiment score
* Positive vs. Negative review ratio
* Most common discussion themes
* Charts and visual analytics
* Search and filter functionality
* Responsive design for desktop and mobile devices

---

# Learning Outcomes

This project demonstrates practical experience in:

* Full-stack web application development
* Angular frontend development
* RESTful API integration
* FastAPI backend development
* Generative AI integration using Google Gemini
* Prompt engineering
* Structured output validation with Pydantic
* SQLite database operations
* Error handling and exception management
* Modular software architecture
* Git and GitHub version control

---

# Future Enhancements

* JWT Authentication
* User login and role management
* CSV/Excel file upload
* PDF & Excel report generation
* Interactive charts using Chart.js
* Cloud database integration (PostgreSQL/MySQL)
* Docker containerization
* Deployment on Render, Railway, or Azure
* Multi-language support
* Admin analytics dashboard

---

# Conclusion

The **GenAI Customer Review Analyzer** is a production-oriented full-stack AI application that combines **Angular**, **FastAPI**, **Google Gemini**, and **SQLite** to transform raw customer feedback into meaningful business insights. The project demonstrates modern software architecture, RESTful communication, AI integration, and data persistence while providing an intuitive and scalable user experience.
