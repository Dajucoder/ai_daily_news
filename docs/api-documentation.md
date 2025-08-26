# API Documentation

This document provides an overview of the available API endpoints for the AI Daily News platform.

## Accessing the APIs

When running in the recommended Docker environment, the APIs are accessible via the following base URLs:

-   **Backend API**: `http://localhost:8000/api/`
-   **Agent API**: `http://localhost:5001/api/`

## Authentication

The Backend API uses JWT (JSON Web Token) for authentication. To access protected endpoints, you must include an `Authorization` header with a valid access token.

`Authorization: Bearer <your_access_token>`

### Authentication Endpoints

#### `POST /api/auth/token/`

Authenticates a user and returns a JWT access and refresh token pair.

-   **Request Body**:
    ```json
    {
        "username": "your_username",
        "password": "your_password"
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
        "access": "...",
        "refresh": "..."
    }
    ```

#### `POST /api/auth/token/refresh/`

Takes a refresh token and returns a new access token.

-   **Request Body**:
    ```json
    {
        "refresh": "your_refresh_token"
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
        "access": "..."
    }
    ```

## Backend API Endpoints

These endpoints are served by the Django backend.

### News Endpoints

#### `GET /api/news/`

Retrieves a paginated list of processed news articles.

-   **Query Parameters**:
    -   `page` (integer): The page number to retrieve.
    -   `category` (string): Filter by category (e.g., `tech_breakthrough`, `industry_news`).
    -   `search` (string): Search for a keyword in the title or summary.
-   **Response (200 OK)**: A paginated response object containing a `results` array of news items.

#### `GET /api/news/{id}/`

Retrieves a single news article by its ID.

-   **Response (200 OK)**: A single news item object.

### User Profile Endpoints

#### `GET /api/auth/profile/`

Retrieves the profile of the currently authenticated user. (Requires Authentication)

-   **Response (200 OK)**: The user's profile data (e.g., username, email, avatar).

#### `PUT /api/auth/profile/` or `PATCH /api/auth/profile/`

Updates the profile of the currently authenticated user. (Requires Authentication)

-   **Request Body**: A JSON object with the fields to update (e.g., `{"email": "new@example.com"}`).

## Agent API Endpoints

These endpoints are served by the Flask-based AI agent. They are primarily used by the backend service but can be accessed for debugging.

### `GET /api/health`

Checks if the agent service is running.

-   **Response (200 OK)**:
    ```json
    {
        "status": "healthy",
        "timestamp": "...",
        "service": "AI News Agent"
    }
    ```

### `POST /api/fetch-news`

Triggers a background task to fetch and process news for a specific date.

-   **Request Body** (optional):
    ```json
    {
        "date": "YYYY-MM-DD", // Defaults to today if not provided
        "force_refresh": false // Set to true to ignore existing reports
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
        "message": "Started fetching news",
        "target_date": "YYYY-MM-DD"
    }
    ```

### `GET /api/fetch-status`

Returns the real-time status of the current or last news fetching task.

-   **Response (200 OK)**:
    ```json
    {
        "is_fetching": false,
        "progress": 100,
        "message": "Task complete",
        "start_time": "...",
        "last_error": null
    }
    ```

### `GET /api/reports`

Retrieves a list of all available daily news reports.

-   **Response (200 OK)**: A JSON object containing a list of reports.

### `GET /api/reports/{date}`

Retrieves a specific daily report by date (`YYYY-MM-DD`).

-   **Response (200 OK)**: The full JSON report for the specified date.