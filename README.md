# AI Daily News

AI Daily News is a comprehensive platform designed to automatically aggregate, analyze, and present the latest news in the field of Artificial Intelligence. It consists of a frontend built with React, a backend powered by Django, and a specialized AI agent for news processing.

## Features

- **Automated News Aggregation**: Fetches news from various RSS sources.
- **AI-Powered Analysis**: Utilizes AI models to summarize, categorize, and analyze news content.
- **Modern Web Interface**: A responsive and user-friendly interface built with React.
- **RESTful API**: A robust backend API provided by Django Rest Framework.
- **Containerized Deployment**: Fully containerized with Docker for easy setup and deployment.

## Tech Stack

- **Frontend**: React, TypeScript, Axios
- **Backend**: Django, Django Rest Framework, PostgreSQL
- **AI Agent**: Python, Flask
- **Deployment**: Docker, Docker Compose, Nginx

## Quick Start with Docker

This project is fully containerized. The following steps will get you up and running in a local development environment.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news
```

### 2. Configure Environment Variables

The project uses a single `.env` file in the root directory to configure all services.

1.  **Create the `.env` file:**
    Copy the example file to create your local configuration:
    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file:**
    Open the newly created `.env` file. At a minimum, you must set your AI service API key:
    ```dotenv
    # In .env
    SILICONFLOW_API_KEY=your_siliconflow_api_key_here
    ```
    All other variables have sensible defaults for a local development environment.

### 3. Build and Run the Application

With Docker running, execute the following command from the project root directory:

```bash
docker-compose up --build
```

This command will:
- Build the Docker images for the frontend, backend, and agent services.
- Start all four containers (`frontend`, `backend`, `agent`, `db`).
- Apply any pending database migrations for the backend.

You will see logs from all services streamed to your terminal.

### 4. Access the Application

Once all services are running, you can access the platform:

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Agent API**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

### 5. Stopping the Application

To stop all services, press `Ctrl+C` in the terminal where `docker-compose` is running. To stop them if you are running in detached mode, use:

```bash
docker-compose down
```

## Development

For more detailed information on the architecture, deployment, and available commands, please refer to the documents in the `/docs` directory.