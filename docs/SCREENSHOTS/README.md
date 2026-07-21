# Screenshots

This folder is a placeholder - I can't capture real screenshots of your running application, so add your own here once the app is running locally (`ng serve` + `uvicorn`).

Suggested shots to capture, matching what's actually in the frontend (`frontend/src/app/features/`):

1. `review-page.png` - the main Review page: the batch review textarea, "Analyze" / "Analyze & Save" actions, and a resulting AI analysis card (sentiment, score, theme, suggestion, confidence).
2. `review-history.png` - the history table on the Review page: search box, sentiment/theme filters, sort, and pagination.
3. `dashboard.png` - the Dashboard page: stats cards (total reviews, average score, sentiment %, top theme).
4. `dashboard-charts.png` - the three Chart.js charts: sentiment pie chart, theme bar chart, score trend line chart.
5. `delete-confirm.png` - the confirm dialog shown before deleting a saved review.
6. `swagger-docs.png` (optional) - FastAPI's auto-generated docs at `http://localhost:8000/docs`, showing the `/api/v1/reviews/*` endpoints.

Once added, reference them from the root `README.md`, e.g.:

```markdown
![Dashboard](docs/SCREENSHOTS/dashboard.png)
```
