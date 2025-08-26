# Troubleshooting Guide

This document provides solutions to common problems and debugging tips for the AI Daily News platform.

## Docker-Related Issues

This section covers issues you might encounter when running the application with Docker Compose.

### 1. `agent` Container Fails with "virtual environment" Error

-   **Symptom**: The `agent-1` container logs show an error like `❌ 虚拟环境中的Python不存在` (Python in virtual environment does not exist) and the container exits.
-   **Cause**: The original `ai-news-agent/start.py` script was designed for manual execution and includes a check for a Python virtual environment (`venv`). This check is unnecessary and incorrect within a Docker container, as the container itself is an isolated environment.
-   **Solution**: The `docker-compose.yml` has been configured to bypass this script and directly execute the Flask server via `python api_server.py`. If you encounter this error, ensure your `docker-compose.yml` for the `agent` service uses the correct command.

    ```yaml
    # In docker-compose.yml
    services:
      agent:
        # ...
        command: python api_server.py
        # ...
    ```

### 2. `backend` Container Shows "Connection refused" to Port 5001

-   **Symptom**: The `backend-1` logs are filled with errors like `HTTPConnectionPool(host='localhost', port=5001): ... Connection refused`.
-   **Cause**: The `backend` service is trying to communicate with the `agent` service by calling `localhost:5001`. Inside a Docker network, `localhost` refers to the container itself, not other containers. For inter-container communication, the service name must be used as the hostname.
-   **Solution**: The backend code is configured to get the agent's URL from the `NEWS_AGENT_BASE_URL` environment variable. This variable must be set correctly in the root `.env` file to point to the `agent` service.

    ```dotenv
    # In .env
    NEWS_AGENT_BASE_URL=http://agent:5001
    ```
    After adding or correcting this line in the `.env` file, restart the services with `docker-compose up` for the change to take effect.

### 3. Code Changes Are Not Reflected After Restart

-   **Symptom**: You modify the source code (e.g., a Python or a React file), but when you restart the containers, the changes don't appear to be applied.
-   **Cause**:
    1.  For the **frontend**, the React app is compiled into static files during the Docker image build. Changes to the source code require a rebuild of the image.
    2.  For the **backend** and **agent**, while the source code is mounted as a volume (allowing changes to be reflected), some changes (like installing a new dependency in `requirements.txt`) require a rebuild.
-   **Solution**: Always use the `--build` flag when you want to be sure that all your latest changes are included.
    ```bash
    docker-compose up --build
    ```

## General Application Issues

### Backend (Django)

-   **Problem**: 500 Internal Server Error.
    -   **Solution**: Check the logs for the `backend` container (`docker-compose logs -f backend`) for a detailed Python traceback. Ensure `DEBUG=True` is set in your `.env` file for more informative error pages during development.

-   **Problem**: CORS (Cross-Origin Resource Sharing) errors.
    -   **Solution**: Ensure the `CORS_ALLOWED_ORIGINS` variable in your `.env` file includes the correct address for your frontend (e.g., `http://localhost:3000`).

### Frontend (React)

-   **Problem**: The site doesn't load or shows a white screen.
    -   **Solution**: Open your browser's developer tools (F12 or Ctrl+Shift+I) and check the Console tab for JavaScript errors. Also, check the Network tab to see if any API calls are failing.

-   **Problem**: API requests are failing.
    -   **Solution**: Verify that the `REACT_APP_API_BASE_URL` in your `.env` file is pointing to the correct public address of your backend service (e.g., `http://localhost:8000`).

### AI Agent

-   **Problem**: News fetching fails.
    -   **Solution**: Check the logs for the `agent` container (`docker-compose logs -f agent`). This could be due to an invalid `SILICONFLOW_API_KEY`, an issue with the upstream RSS feeds, or a problem with the AI model API.
