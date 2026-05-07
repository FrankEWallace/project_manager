import { Hono } from "hono";
import { db, workspaceMembers } from "@repo/db";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth.ts";

export const workspacesRouter = new Hono()

  // No X-Workspace-Id needed — this is how the client discovers the workspace
  .get("/me", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, session.user.id),
    });

    return c.json({ data: memberships });
  });
