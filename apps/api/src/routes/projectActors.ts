import { Hono } from "hono";
import { db, projects, projectActors, actors } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.ts";
import { writeAuditLog } from "../lib/audit.ts";

async function verifyProjectAccess(projectId: string, workspaceId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
  });
}

export const projectActorsRouter = new Hono()
  .use(requireAuth)

  .get("/:projectId/actors", async (c) => {
    const { workspaceId } = c.get("auth");
    const { projectId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const rows = await db.query.projectActors.findMany({
      where: eq(projectActors.projectId, projectId),
      with: { actor: true },
    });

    return c.json({ data: rows });
  })

  .post("/:projectId/actors", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId } = c.req.param();
    const body = await c.req.json<{ actorId: string; role?: string }>();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const actor = await db.query.actors.findFirst({
      where: and(eq(actors.id, body.actorId), eq(actors.workspaceId, workspaceId)),
    });
    if (!actor) return c.json({ error: "Actor not found" }, 404);

    const existing = await db.query.projectActors.findFirst({
      where: and(eq(projectActors.projectId, projectId), eq(projectActors.actorId, body.actorId)),
    });
    if (existing) return c.json({ error: "Already linked" }, 409);

    const [row] = await db.insert(projectActors).values({
      projectId,
      actorId: body.actorId,
      role: body.role ?? null,
    } as any).returning();

    await writeAuditLog({
      workspaceId, userId,
      entity: "project", entityId: projectId,
      action: "member_added",
      metadata: { actorId: body.actorId, role: body.role },
    });

    return c.json({ data: { ...row, actor } }, 201);
  })

  .delete("/:projectId/actors/:actorId", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, actorId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    await db.delete(projectActors).where(
      and(eq(projectActors.projectId, projectId), eq(projectActors.actorId, actorId))
    );

    await writeAuditLog({
      workspaceId, userId,
      entity: "project", entityId: projectId,
      action: "member_removed",
      metadata: { actorId },
    });

    return c.json({ success: true });
  });
