# Failure and rollback runbook

## Deployment health check fails

1. Check service state: `docker compose ps`.
2. Review logs: `docker compose logs --tail=200 backend frontend`.
3. Verify backend locally from EC2: `curl -fsS http://127.0.0.1:8081/actuator/health`.
4. Verify RDS reachability from EC2 and check the datasource URL/user/password; confirm the RDS security group allows TCP 3306 from the EC2 security group.
5. Confirm required GitHub secrets are present. Blank Cohere/Slack secrets disable those integrations functionally; summary-to-Slack requires both valid services.

## Roll back application images

Images are tagged with the full Git commit SHA. To roll back, SSH to EC2, edit `/opt/todo-summary-assistant/.env` and set `BACKEND_IMAGE` and `FRONTEND_IMAGE` to the previous known-good SHA tags, then run:

```bash
docker compose --profile monitoring pull
docker compose --profile monitoring up -d --remove-orphans
curl -fsS http://127.0.0.1:8081/actuator/health
```

Keep the previous SHA tags in GHCR. Do not use `docker compose down -v` during rollback; it can delete persistent database/monitoring data. This compose configuration does not run MySQL in production unless the `local-db` profile is explicitly enabled.

## Database incidents

- Stop application writes only if necessary and coordinate before any schema/data changes.
- Do not roll back by deleting volumes or recreating RDS.
- Use RDS automated backups/PITR according to the configured retention policy; test restoration to a separate instance before switching endpoints.
- Hibernate `ddl-auto=update` is enabled by default for compatibility with the source app. For production, adopt reviewed schema migrations and a tested backup/restore plan.

## Escalation / evidence to collect

Record the UTC timestamp, affected commit SHA, alert name, `docker compose ps`, relevant logs (redact tokens/credentials), RDS events, and the recovery action. Rotate any secret accidentally written to logs or committed.
