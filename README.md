# Todo Summary Assistant — DevOps deployment

A React + Spring Boot + MySQL application that manages to-dos, summarizes pending items with Cohere, and posts summaries to Slack. This repository includes container builds, CI/CD, AWS deployment guidance, and Prometheus/Grafana monitoring.

## Repository layout

- `Backend/todo-summary-assistant`: Spring Boot API and multi-stage Dockerfile
- `Frontend/todo`: React UI, Nginx reverse proxy, multi-stage Dockerfile
- `docker-compose.yml`: local runtime and optional monitoring stack
- `.github/workflows/ci-cd.yml`: tests, GHCR image publishing, and optional EC2 deployment
- `monitoring/`: Prometheus scrape config, alert rules, Grafana provisioning/dashboard
- `ARCHITECTURE.md`: architecture diagram and trust boundaries
- `aws/aws-setup.md`: AWS setup instructions
- `FAILURE_AND_ROLLBACK.md`: incident and rollback runbook
- `MONITORING_AND_OPERATIONS.md`: monitoring and operating guide

## Run locally with Docker

Prerequisites: Docker Desktop / Docker Engine with Compose.

```bash
cp .env.example .env
# Edit .env and replace all sample passwords
docker compose --profile local-db up --build -d
```

Open the app at `http://localhost:8081`. Backend health is available at `http://localhost:8081/actuator/health`.

Optional monitoring:

```bash
docker compose --profile local-db --profile monitoring up --build -d
```

Grafana is at `http://localhost:3001`; Prometheus is at `http://localhost:9090` on the host loopback. Set `GRAFANA_ADMIN_PASSWORD` in `.env` before starting the monitoring profile.

For local non-Docker development, use Java 17+ and Node.js 20+. Configure backend environment variables from `.env.example`; frontend uses `/api` when served through Nginx. To run the React dev server separately, set `REACT_APP_API_BASE_URL=http://localhost:8080/api` in `Frontend/todo/.env` before `npm start`.

## Environment variables

Backend configuration is externalized via `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `COHERE_API_KEY`, `SLACK_WEBHOOK_URL`, and `CORS_ALLOWED_ORIGINS`. Never commit `.env` or real credentials. See `.env.example` for the local template.

## CI/CD and AWS

The GitHub Actions workflow tests backend and frontend, publishes images tagged with the commit SHA and `latest` to GitHub Container Registry (GHCR), then deploys on pushes to `main` when EC2 secrets are configured. Deployment requires a prepared EC2 host at `/opt/todo-summary-assistant` with `docker-compose.yml` and `monitoring/` copied there. Follow [`aws/aws-setup.md`](aws/aws-setup.md) and add the documented repository secrets before expecting deployment to work.

Production architecture uses private RDS MySQL. The local MySQL service is enabled only with the `local-db` Compose profile. Do not expose database, Prometheus, or Grafana ports publicly. Configure TLS, backups, alert notification routing, and least-privilege IAM before production use.

## Monitoring

Actuator endpoints: `/actuator/health` and `/actuator/prometheus`. Prometheus rules cover backend availability, host CPU and host memory. Grafana provisions an operations dashboard from `monitoring/grafana/dashboards/`.

## Important limitations

- No AWS resources are created by this repository; account-side setup and credentials are required.
- Cohere and Slack integrations require valid credentials to be supplied at runtime.
- The source project currently uses Hibernate `ddl-auto=update`; use reviewed migrations before production.
- Workflow deploy step and Docker images should be validated in your GitHub/AWS environment before treating a release as production-ready.
