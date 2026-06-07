import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, categories, projects } from "@repo/db";
import { createCategorySchema, updateCategorySchema } from "@repo/validators";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../lib/audit.js";

export const categoriesRouter = new Hono()
  .use(requireAuth)

  .get("/", async (c) => {
    const { workspaceId } = c.get("auth");
    const { archived } = c.req.query();

    const rows = await db.query.categories.findMany({
      where: and(
        eq(categories.workspaceId, workspaceId),
        archived === undefined ? undefined : eq(categories.archived, archived === "true"),
      ),
      orderBy: (cat, { asc }) => [asc(cat.name)],
    });

    // Project counts per category — drives "Projects by category" analytics
    const counts = await db
      .select({ categoryId: projects.categoryId, total: count() })
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .groupBy(projects.categoryId);

    const countMap = new Map(counts.map((r) => [r.categoryId, r.total]));

    return c.json({
      data: rows.map((cat) => ({ ...cat, projectCount: countMap.get(cat.id) ?? 0 })),
    });
  })

  .post("/", zValidator("json", createCategorySchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const body = c.req.valid("json");

    const [category] = await db.insert(categories).values({
      workspaceId,
      name: body.name,
      color: body.color,
      icon: body.icon,
      description: body.description,
    } as any).returning();

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "category",
      entityId: category!.id,
      action: "created",
      metadata: { name: body.name },
    });

    return c.json({ data: category }, 201);
  })

  .get("/:id", async (c) => {
    const { workspaceId } = c.get("auth");
    const { id } = c.req.param();

    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.workspaceId, workspaceId)),
    });

    if (!category) return c.json({ error: "Not found" }, 404);
    return c.json({ data: category });
  })

  .patch("/:id", zValidator("json", updateCategorySchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();
    const body = c.req.valid("json");

    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const [updated] = await db.update(categories)
      .set({ ...body, updatedAt: new Date() } as any)
      .where(eq(categories.id, id))
      .returning();

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "category",
      entityId: id,
      action: body.archived !== undefined && body.archived !== existing.archived ? "archived" : "updated",
      diff: { before: existing, after: updated },
    });

    return c.json({ data: updated });
  })

  .delete("/:id", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();

    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    // projects.categoryId is ON DELETE SET NULL — projects keep existing, just lose the tag
    await db.delete(categories).where(eq(categories.id, id));

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "category",
      entityId: id,
      action: "deleted",
      diff: { before: existing },
    });

    return c.json({ success: true });
  });
