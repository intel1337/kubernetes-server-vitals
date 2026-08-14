# k8s Server Vitals

A self-hosted, mini re-implementation of what tools like Grafana, Prometheus, or UptimeRobot do: poll a set of services on a schedule, record their health history, and surface it through an API (and, soon, a dashboard).

This project is not meant to replace those tools — it exists to understand how they work internally, by rebuilding a small version from scratch: HTTP health checks, a scheduler, a Postgres-backed history, and a Kubernetes deployment with multiple node roles.

## What it does

- Three small Express servers ("decoys") simulate services being monitored. Two are stable; the third randomly delays and occasionally returns a 500, to simulate a flaky service.
- A NestJS API polls each decoy's `/health` endpoint, measures response time, and records every check (status, HTTP code, timestamp, uptime, elapsed time, and a detail message) in PostgreSQL.
- Everything runs in a local Kubernetes cluster (`kind`), spread across nodes dedicated to specific roles, mirroring how a real cluster separates concerns.
- A Next.js dashboard (planned) will expose this data: an overview of all services, a detail view per service, and a public status page.

## Architecture

### Cluster topology

The cluster runs on `kind` (via Docker Desktop) with four nodes: one control-plane and three labeled workers, each dedicated to a role.

| Node | Role label | Hosts |
|---|---|---|
| `desktop-control-plane` | *(control-plane, untouched)* | Kubernetes system components |
| `desktop-worker` | `role=decoys` | `decoy-a`, `decoy-b`, `decoy-c` |
| `desktop-worker2` | `role=app` | `api` (NestJS) |
| `desktop-worker3` | `role=data` | `postgres` |

Every Deployment pins its pods to the correct node via `nodeSelector`, so stateful and stateless workloads never share a node.

### Services

| Service | Type | Port | Purpose |
|---|---|---|---|
| `decoy-a` | ClusterIP | 3000 | Stable target |
| `decoy-b` | ClusterIP | 3000 | Stable target |
| `decoy-c` | ClusterIP | 3000 | Unstable target (random delay + 20% error rate) |
| `api` | ClusterIP | 8080 | NestJS health-check proxy + persistence |
| `postgres` | ClusterIP | 5432 | Health check history |

Images are built locally, pushed to Docker Hub (`i1337x/*`), then pulled by the cluster — `kind` does not read local Docker images directly.

## Tech stack

- **API**: NestJS 11, TypeScript, `@nestjs/schedule`, `@nestjs/config`
- **Database**: PostgreSQL 16 (Alpine), accessed through Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`)
- **Decoys**: Express 5, plain Node.js, no build step
- **Infrastructure**: Kubernetes via `kind`, Docker Hub as the image registry
- **Frontend** *(planned)*: Next.js, shadcn/ui, server actions

## Requirements

- Docker Desktop, with Kubernetes support via `kind` (multi-node cluster)
- `kubectl`, configured against the `kind` cluster
- Node.js 20+ and `npm`
- A Docker Hub account (or another registry) to push images the cluster can pull
- `bash` (Git Bash on Windows works fine) to run the `.sh` helper scripts

## Getting started

### 1. Create the cluster

There's no `kind-config.yaml` committed to this repo — create one yourself with one control-plane and three worker nodes:

```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
  - role: worker
```

```bash
kind create cluster --config kind-config.yaml
```

Then label each of the three workers by role — `api` runs on the `app` node alongside no other workload, `postgres` gets its own `data` node, and all three decoys share the `decoys` node:

```bash
kubectl get nodes   # note the three worker names
kubectl label node <worker-1> role=decoys
kubectl label node <worker-2> role=app
kubectl label node <worker-3> role=data
```

### 2. Create the Postgres secret

The API and the database both read their credentials from a Kubernetes Secret named `postgres-secret`, which is intentionally **not** committed to the repo. Create it yourself before deploying anything:

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=<your-user> \
  --from-literal=POSTGRES_PASSWORD=<your-password> \
  --from-literal=POSTGRES_DB=monitoring
```

### 3. Build and push the images

Decoys (from `services/`):

```bash
bash services/build.sh
```

This only builds the three decoy images locally (`decoy-a:latest`, `decoy-b:latest`, `decoy-c:latest`). Tag and push them yourself, replacing the username with your own Docker Hub account:

```bash
docker tag decoy-a:latest <your-dockerhub-user>/decoy-a:latest && docker push <your-dockerhub-user>/decoy-a:latest
docker tag decoy-b:latest <your-dockerhub-user>/decoy-b:latest && docker push <your-dockerhub-user>/decoy-b:latest
docker tag decoy-c:latest <your-dockerhub-user>/decoy-c:latest && docker push <your-dockerhub-user>/decoy-c:latest
```

(Unlike the decoys, `api/build.sh` builds, tags, *and* pushes in one go — see below.)

API (from `api/`):

```bash
bash api/build.sh
```

This runs `nest build`, builds the Docker image, tags it, and pushes it to `i1337x/api:latest`.

### 4. Deploy to the cluster

Deploy in this order — Postgres first, since the API's `migrate` init container needs it reachable on startup:

```bash
bash k8s/data/deploy.sh       # Postgres (PVC + Deployment + Service)
bash k8s/services/decoys/deploy.sh   # decoy-a, decoy-b, decoy-c
bash k8s/api/deploy.sh        # API (runs Prisma migrations via an init container, then starts)
```

Each `deploy.sh` is just `kubectl apply -f <manifest>.yaml` for that component.

### 5. Redeploying after a code change

Editing a YAML file does nothing to the cluster until it's applied. The workflow differs depending on what changed:

- **You changed a manifest** (`api.yaml`, `postgres.yaml`, a decoy yaml): run that component's `deploy.sh` again. `kubectl apply` pushes the new spec and triggers a rollout automatically.
- **You changed application code but not the manifest** (e.g. rebuilt the `api` image under the same `:latest` tag): run that component's `rollout.sh` instead, which does `kubectl rollout restart deployment <name>` to force pods to restart and re-pull the image.

| Component | `imagePullPolicy` | Why |
|---|---|---|
| `decoy-a`, `decoy-b`, `decoy-c` | `IfNotPresent` | Stable images that rarely change |
| `api` | `Always` | Actively iterated on; must always fetch the current `:latest` |

## Local development (without the cluster)

The API can run outside Kubernetes for faster iteration. Copy `api/.env.example` to `api/.env.local` and adjust it:

```
DATABASE_URL="postgresql://user:password@localhost:5432/monitoring"
DECOY_A_URL=http://localhost:3001/health
DECOY_B_URL=http://localhost:3002/health
DECOY_C_URL=http://localhost:3003/health
PROD=0
```

With `PROD=0`, the API targets `localhost:3001`–`3003` instead of the in-cluster DNS names (`http://decoy-a:3000`, etc.). Forward the decoy ports from the cluster so those local addresses resolve to the real pods:

```bash
kubectl port-forward svc/decoy-a 3001:3000
kubectl port-forward svc/decoy-b 3002:3000
kubectl port-forward svc/decoy-c 3003:3000
```

Then, from `api/`:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

## API example (end to end)

With the cluster running, forward the API service locally:

```bash
kubectl port-forward svc/api 8080:8080
```

Check a single target:

```bash
curl http://localhost:8080/hc/target/decoy-a
```

```json
{
  "status": "ok",
  "service": "decoy-a",
  "timestamp": "2026-08-13T22:32:37.512Z",
  "uptime": 118.221,
  "elapsed": 4,
  "detail": "Health check successful for decoy-a",
  "httpStatus": 200
}
```

Check all targets at once:

```bash
curl http://localhost:8080/hc/all
```

Returns an array of the same shape, one entry per decoy. A target that fails (non-2xx response, or unreachable) still returns the same shape, with `status` set to `"error"` or `"unreachable"`, `httpStatus` reflecting the real HTTP code (or `null` if the request never completed), and `detail` describing what happened. Every request — success or failure — is written to the `HealthReport` table in Postgres as it happens, so the response body and the persisted history always match.

`serverId` is restricted to a fixed allow-list (`decoy-a`, `decoy-b`, `decoy-c`); any other value returns a 403.

## Features

- Three containerized decoy services, one intentionally unreliable, for realistic failure testing
- NestJS API proxying health checks to each decoy, with per-target and bulk endpoints
- Response-time measurement (`elapsed`, in milliseconds) timed locally around each request, independent of any clock skew between pods
- Every health check persisted to PostgreSQL via Prisma, with a uniform result shape across success, HTTP error, and unreachable cases
- A composite database index (`service`, `createdAt`) tuned for "latest status per service" and "history over N days" query patterns
- Kubernetes deployment across role-dedicated nodes (`decoys`, `app`, `data`), with Postgres-backed persistent storage
- Database migrations applied automatically on deploy via a Kubernetes init container

## Roadmap

- Automatic polling on an interval using `@nestjs/schedule` (`@Cron`), instead of checks only firing on request
- `GET /healthcheck`-style endpoint that reads the last known state from the database, without triggering a new fetch
- Next.js dashboard: services overview, per-service detail view, an "add service" form via server actions, and a public status page (as an exercise in metadata/SEO)
- Ingress, replacing direct `port-forward`/NodePort access
- A Kubernetes CronJob for periodic maintenance (e.g. purging health reports older than 7 days)
- Production-style image pulling via a private registry and `imagePullSecrets`, instead of public Docker Hub images
