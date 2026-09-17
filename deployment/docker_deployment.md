# Deployment Documentation — University Research Portal

## Overview

The University Research Portal is a PERN-stack (PostgreSQL, Express, React, Node) application originally built for the CET324 Advanced CyberSecurity Programming module, featuring JWT authentication with refresh tokens, TOTP-based MFA, and Attribute-Based Access Control (ABAC).

This document covers containerizing and self-hosting the application with Docker — a deliberate second deployment path, separate from any managed-PaaS deployment, undertaken specifically to demonstrate hands-on infrastructure and cloud engineering skills: multi-container orchestration, reverse proxying, environment/secrets management, and database migration automation.

## Architecture

```
Browser ──HTTP:80──▶ Frontend (Nginx/React) ──API──▶ Backend (Node/Express):8003 ──DB:5432──▶ PostgreSQL 16

```

All three services run as separate containers, orchestrated via Docker Compose, communicating over Docker's internal network using service names (`db`, `backend`) rather than `localhost`.

## Stack

- **Frontend:** React 19 + Vite, TypeScript, built to static assets, served by nginx (Alpine)
- **Backend:** Node 20, Express 5, Prisma 6 ORM
- **Database:** PostgreSQL 16
- **Orchestration:** Docker Compose
- **Host (current):** Ubuntu Server 26.04 LTS, running as a VM under VMware Workstation Pro

## Dockerfiles

**`backend/Dockerfile`** — single-stage build:

```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 8003
CMD ["./start.sh"]
```

**`backend/start.sh`** — ensures migrations (and seed data) run automatically on every container startup, before the server starts:

```bash
#!/bin/sh
echo "Running database migrations..."
npx prisma migrate deploy
echo "Seeding university data..."
node src/utility/seedUniversityData.js
echo "Starting server..."
node src/server.js
```

**`frontend/Dockerfile`** — multi-stage build (Node builds the static assets, then a lightweight nginx image serves them — the Node toolchain is discarded, keeping the final image small):

```dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## Compose configuration

`docker-compose.yml` defines three services (`db`, `backend`, `frontend`) and reads secrets from a root-level `.env` file via `${VARNAME}` substitution, keeping credentials out of version-controlled YAML.

A PostgreSQL healthcheck (`pg_isready`) combined with `depends_on: condition: service_healthy` on the backend service ensures the backend only starts once the database is actually ready to accept connections — not just once the container process has started.

## Environment variables (root `.env`, not committed)

```
DB_PASSWORD=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
VM_IP=
```

Note: this is a separate `.env` from `backend/.env` and `frontend/.env.local` — those remain in place for non-Docker local development; Docker Compose only reads the root-level file.

## Running it

```bash
docker compose up -d --build
docker compose ps
```

Access the app at `http://<host-ip>` (frontend, nginx on port 80). Backend API is reachable at `http://<host-ip>:8003/api`.

## Issues encountered and resolved

**1. Duplicate `app.listen()` call**
`server.js` called `app.listen()` twice — once correctly inside `startServer()`, and again as leftover code at module scope using a different port variable. This risked a port-binding conflict. Removed the redundant second call.

**2. Frontend build stage silently running the dev server instead of building**
An early `docker compose up --build` hung indefinitely. Logs showed the frontend build stage running `npm run dev` (Vite's dev server, which never exits) instead of `npm run build`. Root cause was stale Docker layer cache from an earlier attempt. Resolved with a forced clean rebuild (`docker compose build --no-cache frontend`), after confirming the Dockerfile itself correctly specified `npm run build`.

**3. Hardcoded `localhost` values breaking cross-machine access**
Both `ALLOWED_ORIGINS` (backend CORS) and `VITE_API_URL` (frontend, baked in at Vite build time) defaulted to `localhost`. Since the app is accessed from a separate host machine's browser rather than the same machine as the server, both were updated to the VM's actual network IP.

**4. TypeScript build failure — enum drift between files**
Production build failed (`TS2353`) because `Badges.tsx`'s department-label map referenced values (`LAW`, `ARTS`, `GENERAL`) that don't exist in the actual `Department` type, while omitting two that do (`CHEMISTRY`, `BIOLOGY`). Cross-referenced against `types/index.ts` — the source of truth, matching the Prisma schema — and corrected the map.

**5. Backend crash-looping — "Can't reach database server at db:5432"**
The backend container exited immediately despite the `db` container showing "Up." Root cause: `depends_on` alone only waits for a container to _start_, not for PostgreSQL to finish initializing inside it — a startup race condition. Resolved with a `pg_isready` healthcheck on `db` and `depends_on: condition: service_healthy` on `backend`.

**6. CORS error masking a real backend crash**
A login attempt failed with a browser-reported CORS error even after correcting `ALLOWED_ORIGINS`. The preflight (`OPTIONS`) request succeeded (204), but the actual request failed — a pattern that typically means the real request crashed server-side before CORS headers were attached, and the browser misreports the failure as a CORS issue. Backend logs revealed the actual cause: `prisma.user.findUnique()` failing with `P2021` — the `users` table didn't exist, because Prisma migrations had never been run against the fresh database container.

**7. Migrations not running automatically on startup**
Running `npx prisma migrate deploy` manually fixed the immediate issue, but would need repeating on every fresh deployment. Solved by introducing `start.sh`, which runs migrations (and seed data) before starting the server, and pointing the backend Dockerfile's `CMD` at that script. `migrate deploy` is idempotent — safe to run on every startup, since it only applies migrations that haven't already been applied.

**8. Residual stale CORS origin value**
After fixing the above, a CORS mismatch persisted due to a leftover hardcoded fallback origin (`http://localhost:5173`, Vite's dev-server port — irrelevant once serving via nginx on port 80) still present in the backend's CORS fallback logic and not fully scrubbed from `.env`/compose values. Removed all remaining `:5173` references across `app.js`, `.env`, and `docker-compose.yml`.

**9. Seed script module path error inside the container**
`start.sh` initially referenced `/app/backend/src/utility/seedUniversityData.js`, mirroring the host machine's folder structure. Inside the container, `WORKDIR /app` already corresponds to the `backend/` folder root (Docker's `COPY . .` flattens it there) — corrected the path to `src/utility/seedUniversityData.js`.

## Known deferred items

- `noUnusedLocals` / `noUnusedParameters` were disabled in `tsconfig.app.json` to unblock the production build. Three unused imports (`SecurityPage.tsx`, `SetupPasswordPage.tsx`) remain uncleaned as a result and should be addressed before treating the strict-mode settings as permanently off.
- This deployment currently runs on a local Ubuntu Server VM (VMware), not a real cloud environment. It validates the containerization and orchestration approach, but does not yet demonstrate cloud-specific concerns (security groups, IAM, a real public IP, load balancing). The next step is deploying the same Docker images to AWS (ECR + EC2 or ECS).
