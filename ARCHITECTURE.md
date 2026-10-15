# Architecture

```mermaid
flowchart LR
  User[Browser / User] -->|HTTP 8081; TLS via ALB or reverse proxy in production| Nginx[React static UI + Nginx]
  Nginx -->|/api reverse proxy| API[Spring Boot API :8080]
  API -->|JDBC 3306| RDS[(Private MySQL RDS in AWS)]
  API -->|HTTPS| Cohere[Cohere API]
  API -->|HTTPS webhook| Slack[Slack Incoming Webhook]
  Prom[Prometheus] -->|/actuator/prometheus| API
  Prom -->|:9100| Node[Node Exporter on EC2]
  Grafana[Grafana dashboards] --> Prom
  GH[GitHub Actions] -->|build/test + push SHA-tagged images| GHCR[GitHub Container Registry]
  GH -->|SSH deploy| EC2[EC2 Docker Compose host]
  GHCR -->|pull images| EC2
```

## Trust boundaries

- The browser reaches only the frontend entry point; Nginx proxies `/api` internally to Spring Boot.
- The backend reaches MySQL on a private RDS endpoint. RDS security group ingress should reference the EC2 security group only.
- Cohere and Slack credentials are injected at runtime and must not be committed.
- Prometheus and Grafana ports are loopback-bound in the sample Compose file; use a private tunnel/VPN or authenticated proxy for administration.
- GitHub Actions publishes immutable commit-SHA image tags. The EC2 host pulls those tags during deployment.
```
