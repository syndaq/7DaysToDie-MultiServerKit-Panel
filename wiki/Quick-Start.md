# Quick Start

Development setup for local or LAN access.

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- One or more game servers running [MultiServerKit](https://github.com/syndaq/7DaysToDie-MultiServerKit)

## Install

```bash
git clone https://github.com/syndaq/7DaysToDie-MultiServerKit-Panel.git
cd 7DaysToDie-MultiServerKit-Panel
npm install
```

## Configure

```bash
cp .env.example .env
```

Edit `.env`:

```env
PUBLIC_HOST=YOUR-IP-HERE
WEB_ORIGIN=http://YOUR-IP-HERE:5173
PANEL_URL=http://YOUR-IP-HERE:5173
SESSION_SECRET=use-a-long-random-string-here
DATABASE_URL=postgresql://msk:msk_dev_password@localhost:5432/multiserverkit
```

Use your machine's **reachable IP** (not `localhost`) when accessing from another device.

## Start PostgreSQL

```bash
docker compose up -d
```

## Initialize database

```bash
npm run db:push
npm run db:generate
```

## Run

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Web UI | `http://YOUR-IP:5173` |
| Panel API | `http://YOUR-IP:3001` |
| Health | `http://YOUR-IP:3001/health` |

Open ports **5173** and **3001** in your firewall.

## First login

1. Open the web UI — create the first admin account.
2. Go to **Servers** and register each game server. See [[Server Registry]].
3. Confirm the dashboard shows servers online.

## Production

For Docker-based production deployment, see [[Production Deployment]].
