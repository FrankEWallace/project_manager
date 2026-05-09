import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, tasks, milestones, phases, projects } from "@repo/db";
import { createTaskSchema, updateTaskSchema } from "@repo/validators";
import { eq, and, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { requireAuth } from "../middleware/auth.ts";
import { writeAuditLog } from "../lib/audit.ts";

async function verifyProjectAccess(projectId: string, workspaceId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
  });
}

export const tasksRouter = new Hono()
  .use(requireAuth)

  .get("/:projectId/tasks", async (c) => {
    const { workspaceId } = c.get("auth");
    const { projectId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        order: tasks.order,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        milestoneId: tasks.milestoneId,
        phaseId: tasks.phaseId,
        createdAt: tasks.createdAt,
        milestoneName: milestones.name,
        phaseName: phases.name,
      })
      .from(tasks)
      .leftJoin(milestones, eq(tasks.milestoneId, milestones.id))
      .leftJoin(phases, eq(tasks.phaseId, phases.id))
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.order), asc(tasks.createdAt));

    return c.json({ data: rows });
  })

  .post("/:projectId/tasks", zValidator("json", createTaskSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId } = c.req.param();
    const body = c.req.valid("json");

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const [task] = await db
      .insert(tasks)
      .values({
        id: createId(),
        projectId,
        title: body.title,
        description: body.description,
        status: body.status,
        order: body.order,
        milestoneId: body.milestoneId ?? null,
        phaseId: body.phaseId ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdBy: userId,
      })
      .returning();

    await writeAuditLog({
      workspaceId, userId,
      entity: "task", entityId: task!.id,
      action: "created", metadata: { title: task!.title, projectId },
    });

    return c.json({ data: task }, 201);
  })

  .patch("/:projectId/tasks/:taskId", zValidator("json", updateTaskSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, taskId } = c.req.param();
    const body = c.req.valid("json");

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    const existing = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const isDone = body.status === "done";
    const wasDone = existing.status === "done";

    const [updated] = await db
      .update(tasks)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.milestoneId !== undefined && { milestoneId: body.milestoneId }),
        ...(body.phaseId !== undefined && { phaseId: body.phaseId }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.status !== undefined && { completedAt: isDone && !wasDone ? new Date() : wasDone && !isDone ? null : undefined }),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    if (body.status && body.status !== existing.status) {
      await writeAuditLog({
        workspaceId, userId,
        entity: "task", entityId: taskId,
        action: body.status === "done" ? "completed" : "updated",
        metadata: { projectId },
      });
    }

    return c.json({ data: updated });
  })

  .delete("/:projectId/tasks/:taskId", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, taskId } = c.req.param();

    const project = await verifyProjectAccess(projectId, workspaceId);
    if (!project) return c.json({ error: "Not found" }, 404);

    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)));

    await writeAuditLog({
      workspaceId, userId,
      entity: "task", entityId: taskId,
      action: "deleted", metadata: { projectId },
    });

    return c.json({ data: { id: taskId } });
  });
