# Tasky

Goals you can finish — without the overwhelm.

Tasky is a web-based goal and subtask app with Discord-only sign-in, neobrutalist UI, micro-celebrations on completion, personal stats on your profile, and an admin dashboard for aggregate metrics.

## Stack

- Next.js 15 (App Router) + TypeScript
- SQLite (local file) + Prisma
- Auth.js (NextAuth v5) with Discord OAuth
- Tailwind CSS 4

## Prerequisites

- Node.js 20+
- Discord application ([Developer Portal](https://discord.com/developers/applications))

No separate database server is required. Tasky stores data in a SQLite file at `data/tasky.db` (see `DATABASE_URL` in `.env.example`).

## Discord OAuth setup

1. Create an application named **Tasky**.
2. OAuth2 → add redirect URI: `http://localhost:3000/api/auth/callback/discord` (and your production URL; use your `PORT` if not 3000).
3. Copy **Client ID** and **Client Secret** into `.env`.
4. OAuth2 scopes: `identify` (required). `email` is optional.

## Environment

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path (default: `file:../data/tasky.db` from `prisma/`) |
| `PORT` | HTTP port — **must match the port your panel assigns** (often not `3000`) |
| `BIND_HOST` | Bind address (use `0.0.0.0` on panels). Do not use `HOSTNAME`; the OS sets that to the container id |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Public app URL — must match `PORT` (e.g. `http://localhost:8080`) |
| `AUTH_DISCORD_ID` | Discord client ID |
| `AUTH_DISCORD_SECRET` | Discord client secret |
| `ADMIN_DISCORD_IDS` | Comma-separated Discord user IDs for admin role |

## Getting started

```bash
npm install
npx prisma db push
npm run dev
```

Open `http://localhost:3000` (or your `PORT`) and sign in with Discord.

The database file is created on first run or `prisma db push`. Back it up by copying `data/tasky.db` (and `tasky.db-journal` if present while the app is running).

## Pterodactyl (recommended for game panels)

Use the custom egg and follow **[docs/PTERODACTYL.md](docs/PTERODACTYL.md)** — import [`pterodactyl/egg-tasky.json`](pterodactyl/egg-tasky.json), set variables in the panel (no `.env` file required), Install once, then Start.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema to the local database |
| `npm run db:studio` | Open Prisma Studio |

## App areas

- **Today** — up to 5 active goals
- **Goals** — all goals and archive
- **Profile** — Discord identity + personal stats
- **Admin** — aggregate metrics (admin role only)
