import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, projects, phases } from "@repo/db";
import { createPhaseSchema, updatePhaseSchema } from "@repo/validators";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.ts";
import { writeAuditLog } from "../lib/audit.ts";

async function verifyProjectAccess(projectId: string, workspaceId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
  });
}

export const phasesRouter = new Hono()
  .use(requireAuth)

  .get("/:projectId/phases", async (c) => {
    const { workspaceId } = c.get("auth");
    const { projectId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const phaseList = await db.query.phases.findMany({
      where: eq(phases.projectId, projectId),
      with: { milestones: true },
      orderBy: [asc(phases.order), asc(phases.createdAt)],
    });

    const data = phaseList.map((phase) => {
      const total = phase.milestones.length;
      const completed = phase.milestones.filter((m) => m.status === "completed").length;
      return {
        ...phase,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        milestoneCount: total,
        completedMilestones: completed,
      };
    });

    return c.json({ data });
  })

  .post("/:projectId/phases", zValidator("json", createPhaseSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId } = c.req.param();
    const body = c.req.valid("json");

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const [phase] = await db.insert(phases).values({
      projectId,
      name: body.name,
      description: body.description,
      order: body.order,
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    } as any).returning();

    await writeAuditLog({
      workspaceId, userId,
      entity: "phase", entityId: phase!.id,
      action: "created", metadata: { name: phase!.name, projectId },
    });

    return c.json({ data: phase }, 201);
  })

  .patch("/:projectId/phases/:phaseId", zValidator("json", updatePhaseSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId } = c.req.param();
    const body = c.req.valid("json");

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const existing = await db.query.phases.findFirst({
      where: and(eq(phases.id, phaseId), eq(phases.projectId, projectId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const [updated] = await db
      .update(phases)
      .set({
        name: body.name,
        description: body.description,
        order: body.order,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        updatedAt: new Date(),
      } as any)
      .where(eq(phases.id, phaseId))
      .returning();

    await writeAuditLog({
      workspaceId, userId,
      entity: "phase", entityId: phaseId,
      action: "updated", diff: { before: existing, after: updated },
    });

    return c.json({ data: updated });
  })

  .patch("/:projectId/phases/:phaseId/complete", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const [updated] = await db
      .update(phases)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() } as any)
      .where(and(eq(phases.id, phaseId), eq(phases.projectId, projectId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);

    await writeAuditLog({
      workspaceId, userId,
      entity: "phase", entityId: phaseId,
      action: "completed", metadata: { projectId },
    });

    return c.json({ data: updated });
  })

  .patch("/:projectId/phases/:phaseId/reopen", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const [updated] = await db
      .update(phases)
      .set({ status: "active", completedAt: null, updatedAt: new Date() } as any)
      .where(and(eq(phases.id, phaseId), eq(phases.projectId, projectId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);

    await writeAuditLog({
      workspaceId, userId,
      entity: "phase", entityId: phaseId,
      action: "reopened", metadata: { projectId },
    });

    return c.json({ data: updated });
  })

  .delete("/:projectId/phases/:phaseId", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, phaseId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    await db.delete(phases).where(
      and(eq(phases.id, phaseId), eq(phases.projectId, projectId))
    );

    await writeAuditLog({
      workspaceId, userId,
      entity: "phase", entityId: phaseId,
      action: "deleted", metadata: { projectId },
    });

    return c.json({ data: { id: phaseId } });
  });
