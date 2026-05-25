# Project Manager

> A personal operational OS for solo developers that scales to full teams — project lifecycle, financial tracking, and analytics in one workspace.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Hono](https://img.shields.io/badge/API-Hono-orange)](https://hono.dev)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-green)](https://orm.drizzle.team)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-blue)](https://turbo.build)
[![Deployed on Vercel](https://img.shields.io/badge/Web-Vercel-black?logo=vercel)](https://vercel.com)

---

## Features

| Module | What it does |
|---|---|
| **Dashboard** | Portfolio-level overview — revenue, active projects, upcoming milestones |
| **Projects** | Full lifecycle management: phases → milestones → tasks, progress computed automatically |
| **Finances** | Income & expense tracking per project; invoice generation with configurable settings |
| **Analytics** | Per-project and portfolio dashboards with SQL-powered aggregates |
| **Actors** | Unified directory for clients, collaborators, and vendors; link to any project |
| **Timeline** | Roadmap and calendar views across all active work |
| **Settings** | Workspace config, invoice defaults, member management |
| **Teams** | Invite flow, roles (owner / admin / member), multi-workspace support |
| **Audit Log** | Every mutation recorded server-side for full traceability |

### Project Hierarchy

```
Project → Phase → Milestone → Task
```

Milestone completion rolls up to phases and projects automatically — no manual progress updates.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, Alpine.js |
| **Backend API** | Hono (Node.js, TypeScript) |
| **Database** | PostgreSQL (Neon) via Drizzle ORM |
| **Auth** | Better Auth — magic link + email/password |
| **Email** | Resend |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Deployment** | Vercel (web) · Vercel (API) · Neon (DB) |

---

## Monorepo Structure

```
apps/
  web/        # Next.js 15 frontend          → port 3000
  api/        # Hono REST API server          → port 3001
packages/
  db/         # Drizzle schema + migrations
  auth/       # Better Auth shared config
  ui/         # Shared component library
  validators/ # Zod schemas shared across apps
docs/         # Mintlify documentation site
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 11+
- PostgreSQL database (or [Neon](https://neon.tech) connection string)

### 1. Clone & install

```bash
git clone https://github.com/FrankEWallace/project_manager.git
cd project_manager
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

**`apps/api/.env`**

```env
DATABASE_URL=postgresql://user:password@host:5432/project_manager
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
pnpm db:push        # push schema to database (dev)
pnpm db:generate    # generate migration files
pnpm db:migrate     # run pending migrations
```

### 4. Start development

```bash
pnpm dev
```

- Web → `http://localhost:3000`
- API → `http://localhost:3001`

---

## Database Commands

```bash
pnpm db:push        # sync schema without migrations (dev only)
pnpm db:generate    # generate a new migration file
pnpm db:migrate     # apply pending migrations
pnpm db:studio      # open Drizzle Studio in the browser
```

---

## API Routes

The Hono API exposes the following resource groups under `/api/`:

| Route | Resource |
|---|---|
| `/workspaces` | Multi-workspace management |
| `/projects` | Project CRUD + phase/milestone/task nesting |
| `/phases` | Phase management within projects |
| `/milestones` | Milestones within phases |
| `/tasks` | Task tracking |
| `/actors` | Clients, collaborators, vendors |
| `/project-actors` | Link actors to projects |
| `/transactions` | Income & expense records |
| `/invoices` | Invoice generation and settings |
| `/analytics` | Aggregated financial and progress metrics |
| `/invitations` | Workspace invite flow |

---

## Deployment

| App | Platform | Notes |
|---|---|---|
| `apps/web` | Vercel | Set `NEXT_PUBLIC_API_URL` to the deployed API URL |
| `apps/api` | Vercel | Set all `.env` vars in Vercel dashboard |
| Database | Neon | Provide `DATABASE_URL` connection string to the API |

### Production deploy

```bash
# Web
vercel --cwd apps/web --prod

# API
vercel --cwd apps/api --prod
```

---

## Documentation

Full architecture and API reference docs live in `/docs` (powered by [Mintlify](https://mintlify.com)).

---

## License

Private — all rights reserved.
