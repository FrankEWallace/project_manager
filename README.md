# Project Manager

A personal operational OS for solo developers that scales to full teams. Combines project lifecycle management, financial tracking, and analytics into a single workspace.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui |
| Backend API | Hono (Node.js, TypeScript) |
| Database | PostgreSQL (Neon) via Drizzle ORM |
| Auth | Better Auth (magic link / email+password) |
| Email | Resend |
| Monorepo | Turborepo + pnpm workspaces |
| Deployment | Vercel (web) · Railway (API) · Neon (DB) |

## Monorepo Structure

```
apps/
  web/        # Next.js frontend (port 3000)
  api/        # Hono API server (port 3001)
packages/
  db/         # Drizzle schema + migrations
  auth/       # Better Auth shared config
  validators/ # Zod schemas shared across apps
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 11+
- PostgreSQL database (or Neon connection string)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env.local
```

**`apps/api/.env`**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/project_manager
PORT=3001
WEB_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_SECRET=           # openssl rand -base64 32
```

**`apps/web/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Set up the database

```bash
pnpm db:push        # push schema to database
pnpm db:generate    # generate migration files
pnpm db:migrate     # run migrations
```

### 4. Start development

```bash
pnpm dev
```

Web runs at `http://localhost:3000`, API at `http://localhost:3001`.

## Database Commands

```bash
pnpm db:push        # sync schema (dev)
pnpm db:generate    # generate migration
pnpm db:migrate     # run migrations
pnpm db:studio      # open Drizzle Studio
```

## Features (v1)

- **Projects** — full lifecycle with phases and milestones
- **Finances** — income/expense tracking per project
- **Analytics** — per-project and portfolio-level dashboards
- **Actors** — client/collaborator/vendor directory
- **Timeline** — roadmap and calendar views
- **Teams** — invite flow, roles (owner/admin/member), workspace settings
- **Audit log** — every action recorded (backend)

## Project Hierarchy

```
Project → Phase → Milestone → Task
```

Progress is fully computed — milestone completion rolls up to phases and projects automatically.

## Deployment

| App | Platform | Notes |
|---|---|---|
| `apps/web` | Vercel | `NEXT_PUBLIC_API_URL` must point to deployed API |
| `apps/api` | Railway | Set all `.env` vars in Railway dashboard |
| Database | Neon | `DATABASE_URL` connection string |
