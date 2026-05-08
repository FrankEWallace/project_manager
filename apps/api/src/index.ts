import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.ts";
import { projectsRouter } from "./routes/projects.ts";
import { phasesRouter } from "./routes/phases.ts";
import { milestonesRouter } from "./routes/milestones.ts";
import { transactionsRouter } from "./routes/transactions.ts";
import { analyticsRouter } from "./routes/analytics.ts";
import { workspacesRouter } from "./routes/workspaces.ts";
import { actorsRouter } from "./routes/actors.ts";
import { projectActorsRouter } from "./routes/projectActors.ts";
import { invitationsRouter } from "./routes/invitations.ts";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env["WEB_URL"] ?? "http://localhost:3000",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Workspace-Id"],
  })
);

// Better Auth handles all /api/auth/* routes
app.on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/projects", projectsRouter);
app.route("/api/projects", phasesRouter);
app.route("/api/projects", milestonesRouter);
app.route("/api/analytics", analyticsRouter);
app.route("/api/workspaces", workspacesRouter);
app.route("/api/actors", actorsRouter);
app.route("/api/projects", projectActorsRouter);
app.route("/api", transactionsRouter);
app.route("/api/invitations", invitationsRouter);

const port = Number(process.env["PORT"] ?? 3001);
console.log(`API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
