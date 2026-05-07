import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.ts";
import { projectsRouter } from "./routes/projects.ts";
import { transactionsRouter } from "./routes/transactions.ts";
import { analyticsRouter } from "./routes/analytics.ts";
import { workspacesRouter } from "./routes/workspaces.ts";

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
app.route("/api/analytics", analyticsRouter);
app.route("/api/workspaces", workspacesRouter);
app.route("/api", transactionsRouter);

const port = Number(process.env["PORT"] ?? 3001);
console.log(`API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
