# AWS setup and deployment

This document describes the intended production layout. Complete these steps in your own AWS account; the repository workflow cannot create AWS resources without authorized credentials.

## Architecture

- One EC2 instance runs Docker Compose, the React/Nginx frontend, Spring Boot backend, Prometheus, Grafana and Node Exporter.
- Amazon RDS for MySQL is in private subnets, with public access disabled.
- EC2 reaches RDS on TCP 3306. The RDS security group inbound rule must reference the EC2 security group, not `0.0.0.0/0`.
- The EC2 instance profile should be least-privilege. If using AWS Secrets Manager/SSM, grant read access only to the specific application secrets.
- Public inbound traffic: TCP 80 (and 443 when TLS is configured) from the intended audience. SSH TCP 22 should be limited to your fixed admin IP or replaced by Systems Manager Session Manager. Do not expose MySQL, Prometheus (9090), or Grafana (3001) publicly.

## Create the RDS database

1. Create a MySQL RDS instance in private subnets, with **Public access = No**.
2. Create a dedicated application database and user; do not use the RDS master account in the app.
3. Configure the RDS security group to accept TCP 3306 only from the EC2 security group.
4. Store the JDBC URL, username and password in GitHub Actions secrets or AWS Secrets Manager. JDBC URL format: `jdbc:mysql://YOUR-RDS-ENDPOINT:3306/todo_db`.
5. Use TLS for RDS connections where required by your security policy and verify the RDS CA certificate when enabling certificate validation.

## Create the EC2 host

1. Launch a supported Ubuntu LTS instance in a public subnet (or private subnet with an appropriate deployment path). Attach a security group with only required ingress.
2. Attach an instance profile if using AWS APIs. Do not put access keys on disk.
3. Install Docker Engine and the Docker Compose plugin, then create `/opt/todo-summary-assistant` owned by the deployment user.
4. Copy this repository's `docker-compose.yml` and `monitoring/` directory to `/opt/todo-summary-assistant`. The workflow expects those files to already exist there. The EC2 user needs permission to run Docker.
5. Create DNS and configure TLS using an ALB or a reverse proxy with valid certificates before production use. The sample exposes HTTP on port 8081 and is not a complete TLS termination setup.

## GitHub Actions secrets

Configure these under **Repository → Settings → Secrets and variables → Actions**:

- `EC2_HOST`: public DNS name or IP of the host
- `EC2_USER`: SSH deployment username
- `EC2_SSH_PRIVATE_KEY`: private key matching the EC2 user's authorized key
- `GHCR_USERNAME`: GitHub username with package read access
- `GHCR_READ_TOKEN`: token with `read:packages` for private GHCR images (not needed if images are public)
- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
- `COHERE_API_KEY`, `SLACK_WEBHOOK_URL`, `GRAFANA_ADMIN_PASSWORD`

Use a dedicated deploy key and rotate credentials. Never store these values in the repository. Ensure the GitHub Actions token can publish packages and that package visibility/permissions allow EC2 to pull images.

## First deployment

1. Push the repository to a GitHub repository and set the default branch to `main`.
2. Create `/opt/todo-summary-assistant`, install Docker/Compose, and copy `docker-compose.yml` plus `monitoring/` to it.
3. Add the secrets above. Push to `main`; the workflow runs tests, publishes commit-SHA images to GHCR, and connects to EC2.
4. Validate `docker compose ps`, `docker compose logs --tail=100 backend`, and `curl -fsS http://127.0.0.1:8081/actuator/health` on EC2.
5. Visit the public site on port 8081 only for initial testing. For production, place a TLS-capable load balancer or reverse proxy in front and restrict direct app access.

## Security notes

- Do not expose Grafana or Prometheus ports to the internet. The compose file binds their ports to loopback on the EC2 host.
- Use a secret manager and inject secrets at runtime in mature deployments. Environment variables are a baseline, not a replacement for secret rotation or IAM controls.
- Restrict access to GitHub Actions environments and require reviewers for production deploys.
- Database schema currently uses Hibernate `ddl-auto=update`; use controlled migrations (e.g. Flyway) before production workloads.
