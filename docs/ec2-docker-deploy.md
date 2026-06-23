# EC2 Docker Deployment — Payment Dispute Triage

Build and run the app **on an existing EC2 instance** as containers, behind Caddy
with automatic HTTPS. Three services on one Docker network:

```
            Internet (443/80)
                  │
            ┌─────▼─────┐
            │   caddy   │  TLS termination + routing (auto Let's Encrypt)
            └──┬─────┬──┘
     /api/*    │     │   /*
        ┌──────▼─┐ ┌─▼────────┐
        │  api   │ │  client  │
        │ Node   │ │  nginx   │
        │ :3001  │ │  :80     │
        └───┬────┘ └──────────┘
            │ SQLite on a named volume (api_data:/data/triage.db)
```

## Files (repo root)

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | caddy + client + api services, volumes, network |
| `Caddyfile` | TLS + routes `/api/*`→api, `/*`→client |
| `client/Dockerfile` + `client/nginx.conf` | build Vite app, serve via nginx |
| `server/Dockerfile` + `server/docker-entrypoint.sh` | build Express app, migrate then run |
| `.env.example` | `DOMAIN`, `SEED` (copy to `.env`) |
| `.dockerignore` | keep build context lean |

## Prerequisites on the EC2 instance

- **Docker Engine + Compose v2.** On Amazon Linux 2023:
  ```
  sudo dnf install -y docker
  sudo systemctl enable --now docker
  sudo usermod -aG docker ec2-user          # re-login after this
  # Compose v2 plugin:
  DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
  mkdir -p $DOCKER_CONFIG/cli-plugins
  curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
    -o $DOCKER_CONFIG/cli-plugins/docker-compose
  chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
  ```
- **Security group:** inbound **80** and **443** from the allowed CIDR (e.g. the
  corporate range), plus 22 for SSH from your admin IP. Nothing else — the api
  (3001) and client (80) ports are internal to the Docker network only.
- **DNS (for HTTPS):** an **A record** pointing your domain at the instance's
  public/Elastic IP. Without a real domain, leave `DOMAIN=localhost` (self-signed).

## Deploy (build on the box)

```
# 1. Get the code
git clone https://github.com/black2be/Payment-Dispute-Triage.git
cd Payment-Dispute-Triage

# 2. Configure
cp .env.example .env
#   edit .env -> DOMAIN=triage.yourbank.co.za   (and SEED=true for the first run)

# 3. Build + start
DOMAIN=$(grep DOMAIN .env | cut -d= -f2) docker compose up -d --build
#   or simply:  docker compose --env-file .env up -d --build

# 4. Check
docker compose ps
docker compose logs -f caddy api client
```

App is then at `https://<DOMAIN>` (Caddy fetches a cert automatically).

## Update / redeploy

```
git pull
docker compose up -d --build       # rebuilds changed images, recreates containers
docker image prune -f              # reclaim space
```

## Data & persistence

- SQLite lives on the **`api_data`** Docker volume at `/data/triage.db`, so it
  survives rebuilds and restarts. Back it up with:
  ```
  docker run --rm -v payment-dispute-triage_api_data:/data -v "$PWD":/backup \
    alpine sh -c "cp /data/triage.db /backup/triage-$(date +%F).db"
  ```
- First run with `SEED=true` loads the mock dataset; set it back to `false`
  afterwards so seeding doesn't repeat.

## Governance notes (AI SDLC)

- **Build-on-box means no registry** — nothing is pushed to an external/unapproved
  registry, so `gov-mcp-guard` / registry rules are not engaged. (If you later
  switch to CI→ECR, ECR is the approved registry.)
- **Route this through the Deployment Approval Gate** before running in any shared
  environment — don't treat `docker compose up` as an unreviewed deploy.
- **Region:** keep the instance in **af-south-1** for POPIA data sovereignty.
- **Mock data only** — no real PII/PCI in the SQLite DB; the CI secrets/PII gate
  still applies to the source.
- **No secrets in images** — `.env` stays on the host (git-ignored); the only
  config is `DOMAIN` and the SQLite file path.

## Troubleshooting

- **Cert not issued:** confirm the A record resolves to the instance and 80/443
  are open; Caddy needs port 80 reachable for the ACME challenge.
- **api restarts:** check `docker compose logs api` — usually a failed migration;
  the entrypoint runs `prisma migrate deploy` against `/data/triage.db`.
- **502 from Caddy:** the api or client container isn't healthy yet; `docker
  compose ps` and re-check logs.
