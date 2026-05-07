import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, projects, phases, milestones } from "@repo/db";
import { createMilestoneSchema, updateMilestoneSchema } from "@repo/validators";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.ts";
import { writeAuditLog } from "../lib/audit.ts";

async function verifyProjectAccess(projectId: string, workspaceId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
  });
}

export const milestonesRouter = new Hono()
  .use(requireAuth)

  .post("/:projectId/phases/:phaseId/milestones", zValidator("json", createMilestoneSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId } = c.req.param();
    const body = c.req.valid("json");

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const phase = await db.query.phases.findFirst({
      where: and(eq(phases.id, phaseId), eq(phases.projectId, projectId)),
    });
    if (!phase) return c.json({ error: "Not found" }, 404);

    const [milestone] = await db.insert(milestones).values({
      phaseId,
      projectId,
      name: body.name,
      description: body.description,
      order: body.order,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assignedTo: body.assignedTo,
    }).returning();

    await writeAuditLog({
      workspaceId, userId,
      entity: "milestone", entityId: milestone!.id,
      action: "created", metadata: { name: milestone!.name, projectId, phaseId },
    });

    return c.json({ data: milestone }, 201);
  })

  .patch("/:projectId/phases/:phaseId/milestones/:milestoneId", zValidator("json", updateMilestoneSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId, milestoneId } = c.req.param();
    const body = c.req.valid("json");

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const existing = await db.query.milestones.findFirst({
      where: and(eq(milestones.id, milestoneId), eq(milestones.phaseId, phaseId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const [updated] = await db
      .update(milestones)
      .set({
        name: body.name,
        description: body.description,
        order: body.order,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        assignedTo: body.assignedTo,
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, milestoneId))
      .returning();

    return c.json({ data: updated });
  })

  .patch("/:projectId/phases/:phaseId/milestones/:milestoneId/toggle", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId, milestoneId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const existing = await db.query.milestones.findFirst({
      where: and(eq(milestones.id, milestoneId), eq(milestones.phaseId, phaseId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const newStatus = existing.status === "completed" ? "open" : "completed";

    const [updated] = await db
      .update(milestones)
      .set({
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, milestoneId))
      .returning();

    await writeAuditLog({
      workspaceId, userId,
      entity: "milestone", entityId: milestoneId,
      action: newStatus === "completed" ? "completed" : "reopened",
      metadata: { projectId, phaseId },
    });

    return c.json({ data: updated });
  })

  .delete("/:projectId/phases/:phaseId/milestones/:milestoneId", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId, milestoneId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    await db.delete(milestones).where(
      and(eq(milestones.id, milestoneId), eq(milestones.phaseId, phaseId))
    );

    await writeAuditLog({
      workspaceId, userId,
      entity: "milestone", entityId: milestoneId,
      action: "deleted", metadata: { projectId, phaseId },
    });

    return c.json({ data: { id: milestoneId } });
  });
