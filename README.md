# Ejabi — انطلاقتك الدراسية

Full-stack study-path product: **NestJS API**, **Next.js student site**, **Next.js admin site**, and **PostgreSQL**.

## Apps

| App | Path | Port |
|---|---|---|
| API | `apps/api` | http://localhost:3001 |
| Student site | `apps/web` | http://localhost:3000 |
| Admin site | `apps/admin` | http://localhost:3002 |

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for PostgreSQL on port **5433** to avoid clashing with a local Postgres on 5432)

## Setup

```bash
pnpm install
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

PostgreSQL is published on **host port 5433** (container 5432) so it does not clash with a local Postgres already using 5432.

Default admin login (admin site):

- Email: `admin@ejabi.local`
- Password: `Admin123!`

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
