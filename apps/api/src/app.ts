import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { phasesRouter } from "./routes/phases.js";
import { milestonesRouter } from "./routes/milestones.js";
import { transactionsRouter } from "./routes/transactions.js";
import { analyticsRouter } from "./routes/analytics.js";
import { workspacesRouter } from "./routes/workspaces.js";
import { actorsRouter } from "./routes/actors.js";
import { projectActorsRouter } from "./routes/projectActors.js";
import { invitationsRouter } from "./routes/invitations.js";
import { tasksRouter } from "./routes/tasks.js";
import { invoicesRouter } from "./routes/invoices.js";

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

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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
app.route("/api/projects", tasksRouter);
app.route("/api/invoices", invoicesRouter);

export default app;
