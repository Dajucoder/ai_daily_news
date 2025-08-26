# Deployment Guide

This document provides instructions for deploying the AI Daily News application. The recommended method for both development and production is using Docker and Docker Compose.

## Docker Deployment (Recommended)

The entire application is containerized, which simplifies setup, ensures consistency across environments, and makes deployment straightforward.

### 1. Architecture Overview

The `docker-compose.yml` file in the project root defines four main services that work together:

-   **`db`**: A PostgreSQL database container. It is responsible for all data persistence. Its data is stored in a named Docker volume (`postgres_data`) to ensure that data is not lost when the container is recreated.

-   **`backend`**: The Django application container. It serves the RESTful API for the frontend and communicates with the `agent` for news processing. On startup, it automatically runs database migrations. It uses Gunicorn as its WSGI server.

-   **`agent`**: The Python-based AI agent container. It runs a Flask server to expose an API that the backend can call to trigger news fetching and processing.

-   **`frontend`**: An Nginx container that serves the static files for the compiled React application. It is the main entry point for users and proxies API requests to the `backend` service.

### 2. Configuration

All configuration is managed via the `.env` file in the project root. This single file provides configuration for all services, making it easy to manage.

**Key Environment Variables:**

-   `SECRET_KEY`: Django's secret key for cryptographic signing.
-   `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: Credentials for the PostgreSQL database.
-   `DATABASE_URL`: The full connection string used by Django to connect to the `db` service.
-   `NEWS_AGENT_BASE_URL`: The internal URL for the `backend` service to communicate with the `agent` service (e.g., `http://agent:5001`).
-   `SILICONFLOW_API_KEY`: Your API key for the AI service, which is used by the `agent`.
-   `REACT_APP_API_BASE_URL`: The public-facing base URL for the frontend to make API calls to the `backend`.
-   `REACT_APP_AGENT_BASE_URL`: The public-facing base URL for the frontend to make API calls to the `agent`.

### 3. Common Docker Commands

All commands should be run from the project's root directory.

-   **Build and start all services (in foreground):**
    *This is useful for initial setup and debugging.*
    ```bash
    docker-compose up --build
    ```

-   **Start all services (in background/detached mode):**
    *This is the standard way to run the application.*
    ```bash
    docker-compose up -d
    ```

-   **Stop all services:**
    *This stops and removes the containers.*
    ```bash
    docker-compose down
    ```

-   **View logs for all services:**
    ```bash
    docker-compose logs -f
    ```

-   **View logs for a specific service:**
    *For example, to see only the backend logs:*
    ```bash
    docker-compose logs -f backend
    ```

-   **Run a Django Management Command:**
    To run `manage.py` commands, such as creating a superuser, you can use `docker-compose exec` to run a command inside the `backend` container.
    ```bash
    docker-compose exec backend python manage.py createsuperuser
    ```
    Follow the prompts to create an administrator account. You can then use these credentials to log in to the Django admin interface at `http://localhost:8000/admin`.

### 4. Data Persistence

The application's state (database content) is persisted in a Docker volume named `postgres_data`. This means your data will be safe even if you stop and remove the application containers with `docker-compose down`.

To view your Docker volumes, you can run:
```bash
docker volume ls
```

If you ever need to completely reset your application and delete all data, you can run:
```bash
docker-compose down -v
```
**Warning**: This command is destructive and will delete your database.
