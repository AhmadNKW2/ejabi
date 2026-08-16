# Ejabi — انطلاقتك الدراسية

Full-stack study-path product: **NestJS API**, **Next.js student site**, **Next.js admin site**, and **PostgreSQL** (Neon).

## Apps

| App | Path | Local port | Production |
|---|---|---|---|
| API | `apps/api` | http://localhost:3001 | Railway |
| Student site | `apps/web` | http://localhost:3000 | Vercel |
| Admin site | `apps/admin` | http://localhost:3002 | Vercel |
| Database | Neon Postgres | — | Neon |

## Prerequisites

- Node.js 20+
- pnpm 11+
- A [Neon](https://neon.tech) project (or Docker Desktop for a local Postgres)

## Setup

```bash
pnpm install
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Put your Neon URLs in `apps/api/.env`:

- `DATABASE_URL` — pooled host (`…-pooler…`) with `sslmode=require&pgbouncer=true`
- `DIRECT_URL` — same credentials, **without** `-pooler`, with `sslmode=require`

Then:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Optional local Postgres instead of Neon:

```bash
docker compose up -d
```

Use the Docker URLs from `.env.example` (host port **5433**).

Default admin login (admin site):

- Email: `admin@ejabi.local`
- Password: `Admin123!`

## Production

Recommended split:

1. **Neon** — Postgres
2. **Railway** — NestJS API (`Dockerfile` + `railway.toml`)
3. **Vercel** — two projects from this repo: `apps/web` and `apps/admin`

### Railway (API)

Create a service from this GitHub repo. Set:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** URL |
| `DIRECT_URL` | Neon **direct** URL (migrations) |
| `JWT_ACCESS_SECRET` | Long random string |
| `JWT_REFRESH_SECRET` | Different long random string |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `ADMIN_EMAIL` | Production admin email |
| `ADMIN_PASSWORD` | Strong password (used only on first seed) |
| `WEB_ORIGIN` | `https://<web>.vercel.app` (comma-separated if several) |
| `ADMIN_ORIGIN` | `https://<admin>.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `PORT` | Railway sets this; do not hardcode |

After the first deploy, seed once (Railway shell or locally against Neon):

```bash
pnpm db:seed
```

Mount a volume at `/app/apps/api/uploads` and set `UPLOADS_DIR` to that path if admins will upload logos. Without a volume, new uploads disappear on redeploy.

### Vercel (web + admin)

Create **two** Vercel projects from [https://github.com/AhmadNKW2/ejabi](https://github.com/AhmadNKW2/ejabi):

| Project | Root Directory | Env |
|---|---|---|
| Student site | `apps/web` | `NEXT_PUBLIC_API_URL=https://<api>.up.railway.app` |
| Admin site | `apps/admin` | `NEXT_PUBLIC_API_URL=https://<api>.up.railway.app` |

Then put the real Vercel URLs into Railway `WEB_ORIGIN` / `ADMIN_ORIGIN` and redeploy the API.

## What students can do

- Browse the Arabic RTL Ejabi catalog (country, field, major, stage, university)
- See estimated years and annual USD cost (same formulas as the original HTML)
- Compare options, pick 3 in preference order, and submit an application
- Register / login, view applications, and edit profile

## What admins can do

- Dashboard counts
- Review and update application status + notes
- Search students
- CRUD countries, fields, majors, stages, universities, duration rules, and overrides

Pricing is computed on the API:

`annualCost = round(major.base * country.mult * stage.mult / 500) * 500`

Custom majors show “تُحدد لاحقًا”. Pharmacy bachelor duration is an override in the seed data.
