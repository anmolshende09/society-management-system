# Skill: devops-deployment

## Purpose

Manage Docker Compose environments, IaC definitions, secrets management, and CI/CD pipelines.

## Activation Conditions

- Modifying Docker Compose, Dockerfiles, or container topologies.
- Changing GitHub Actions workflows.
- Managing environment configuration templates.

## Procedure

1. Ensure all local services bind to loopback (`127.0.0.1`) only; never expose databases or Redis publicly.
2. In production Dockerfiles, use multi-stage builds on Node.js 24 slim/distroless with a non-root user.
3. Validate environment variables at container boot with Zod.
4. Ensure migration jobs connect as `app_migrator` and run in an isolated deployment step before traffic switches.

## Verification Commands

```bash
docker compose -f infra/docker/compose.yaml config
```
