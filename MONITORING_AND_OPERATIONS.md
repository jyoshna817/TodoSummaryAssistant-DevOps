# Monitoring and operations

## Components

- Spring Boot Actuator exposes health at `/actuator/health` and Prometheus metrics at `/actuator/prometheus`.
- Prometheus scrapes the backend and Node Exporter every 15 seconds.
- Grafana provisions a Prometheus datasource and an operations dashboard automatically.
- Node Exporter reports host CPU and memory metrics. cAdvisor is not included in this baseline.

## Start locally

1. Copy `.env.example` to `.env` and replace all sample passwords.
2. Start the app and local MySQL: `docker compose --profile local-db up --build -d`.
3. Optional monitoring stack: `docker compose --profile local-db --profile monitoring up --build -d`.
4. Frontend: `http://localhost:8081`; backend health through Nginx: `http://localhost:8081/actuator/health`.
5. Grafana: `http://localhost:3001` (default username is `admin`; password comes from `.env`). Prometheus UI is bound to `127.0.0.1:9090`.

Note: the `db` service is in the `local-db` profile. On AWS, use private RDS and do not enable the local database profile.

## Alerts

- `BackendDown`: backend scrape has failed for two minutes (critical).
- `HighHostCPU`: host CPU above 85% for ten minutes (warning).
- `HighHostMemory`: host memory above 90% for ten minutes (warning).

These rules are loaded into Prometheus. Configure Alertmanager or your organization's notification integration to route alerts to email/chat; alert delivery is not configured in this repository.

## Useful commands

```bash
docker compose ps
docker compose logs --tail=100 backend
docker compose --profile monitoring logs --tail=100 prometheus grafana node-exporter
curl -fsS http://localhost:8081/actuator/health
curl -fsS http://localhost:8081/actuator/prometheus | head
```

## Operational guidance

- Review CPU, memory, request rate, JVM heap, error logs, and scrape health during deploys.
- Keep Grafana and Prometheus private; use SSH tunnel, VPN, or an authenticated reverse proxy for admin access.
- Back up RDS and test restoration; monitoring volumes are useful but are not backups.
- Set retention, disk alerts, log rotation, secret rotation, and an on-call alert destination before production.
