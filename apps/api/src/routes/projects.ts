import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, projects, phases, milestones, transactions } from "@repo/db";
import { createProjectSchema, updateProjectSchema } from "@repo/validators";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import { writeAuditLog } from "../lib/audit.ts";
import { computeProjectProgress } from "../lib/progress.ts";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const projectsRouter = new Hono()
  .use(requireAuth)

  .get("/", async (c) => {
    const { workspaceId } = c.get("auth");
    const { status, categoryId, archived } = c.req.query();

    const rows = await db.query.projects.findMany({
      where: and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.archived, archived === "true"),
        status ? eq(projects.status, status as "draft" | "active" | "on_hold" | "completed" | "cancelled") : undefined,
        categoryId ? eq(projects.categoryId, categoryId) : undefined,
      ),
      with: { category: true },
      orderBy: [desc(projects.createdAt)],
    });

    return c.json({ data: rows });
  })

  .post("/", zValidator("json", createProjectSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const body = c.req.valid("json");

    const [project] = await db.insert(projects).values({
      name: body.name,
      slug: slugify(body.name),
      description: body.description,
      categoryId: body.categoryId,
      status: body.status,
      health: body.health,
      priority: body.priority,
      visibility: body.visibility,
      budget: body.budget != null ? String(body.budget) : null,
      currency: body.currency as any,
      tags: body.tags,
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      workspaceId,
      ownerId: userId,
      createdBy: userId,
    }).returning();

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "project",
      entityId: project!.id,
      action: "created",
      metadata: { name: project!.name },
    });

    return c.json({ data: project }, 201);
  })

  .get("/:id", async (c) => {
    const { workspaceId } = c.get("auth");
    const { id } = c.req.param();

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)),
      with: { category: true },
    });

    if (!project) return c.json({ error: "Not found" }, 404);

    const progress = await computeProjectProgress(id);

    const [financials] = await db
      .select({
        totalIncome: sql<string>`coalesce(sum(case when type = 'income' then normalized_amount else 0 end), 0)`,
        totalExpenses: sql<string>`coalesce(sum(case when type = 'expense' then normalized_amount else 0 end), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.projectId, id));

    return c.json({
      data: {
        ...project,
        progress,
        financials: {
          totalIncome: Number(financials?.totalIncome ?? 0),
          totalExpenses: Number(financials?.totalExpenses ?? 0),
          profit: Number(financials?.totalIncome ?? 0) - Number(financials?.totalExpenses ?? 0),
          budget: project.budget ? Number(project.budget) : null,
          budgetUsed: project.budget
            ? Math.round((Number(financials?.totalExpenses ?? 0) / Number(project.budget)) * 100)
            : null,
        },
      },
    });
  })

  .patch("/:id", zValidator("json", updateProjectSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();
    const body = c.req.valid("json");

    const existing = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const [updated] = await db
      .update(projects)
      .set({
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        status: body.status,
        health: body.health,
        priority: body.priority,
        visibility: body.visibility,
        budget: body.budget != null ? String(body.budget) : undefined,
        currency: body.currency as any,
        tags: body.tags,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, existing.id))
      .returning();

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "project",
      entityId: id,
      action: body.status && body.status !== existing.status ? "status_changed" : "updated",
      diff: { before: existing, after: updated },
    });

    return c.json({ data: updated });
  })

  .post("/:id/archive", requireRole("admin", "owner"), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();

    const [updated] = await db
      .update(projects)
      .set({ archived: true, updatedAt: new Date() })
      .where(and(eq(projects.id, id!), eq(projects.workspaceId, workspaceId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);

    await writeAuditLog({ workspaceId, userId, entity: "project", entityId: id!, action: "archived" });

    return c.json({ data: updated });
  });
