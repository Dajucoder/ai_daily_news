# Contributing Guide 🤝

Thank you for your interest in contributing to AI Daily News! We welcome all forms of contributions, including code, documentation, design, and testing.

## Development Environment Setup

This project is fully containerized with Docker. All you need to get started is Docker and Docker Compose.

1.  **Fork & Clone**: Fork the repository on GitHub, then clone it to your local machine.
    ```bash
    git clone https://github.com/YOUR_USERNAME/ai_daily_news.git
    cd ai_daily_news
    ```

2.  **Configure Environment**: Copy the root `.env.example` file to `.env`.
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and add your `SILICONFLOW_API_KEY`.

3.  **Build and Run**: Use Docker Compose to build the images and start the services.
    ```bash
    docker-compose up --build
    ```
    The application will be available at `http://localhost:3000`.

## Development Workflow

1.  **Create a Branch**: Create a new branch for your feature or bug fix.
    ```bash
    git checkout -b feature/your-amazing-feature
    # or
    git checkout -b fix/a-specific-bug
    ```

2.  **Make Changes**: Modify the code. Since the application is running in Docker, changes to the source code in `backend`, `frontend`, and `ai-news-agent` will be reflected automatically. For frontend changes, you may need to manually refresh your browser.

3.  **Run Tests**: To run tests, `exec` into the appropriate container.

    -   **Backend Tests**:
        ```bash
        docker-compose exec backend python manage.py test
        ```

    -   **Frontend Tests**:
        ```bash
        docker-compose exec frontend npm test
        ```

4.  **Commit Your Changes**: Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
    ```bash
    # Example:
    git commit -m "feat(api): add user preference endpoint"
    ```

5.  **Push and Create a Pull Request**: Push your branch to your fork and open a pull request against the main repository. Provide a clear description of your changes.

## Coding Standards

-   **General**: Please follow the existing code style. Keep code clean, readable, and well-documented where necessary.
-   **Python (Backend/Agent)**: We follow PEP 8. `black` and `flake8` are recommended.
-   **TypeScript (Frontend)**: We use Prettier and ESLint. Please ensure your code passes the linter checks.

## Reporting Bugs

If you find a bug, please open an issue on GitHub. Provide a clear title, a detailed description, steps to reproduce, and any relevant logs or screenshots.

---

Thank you for your contribution!
