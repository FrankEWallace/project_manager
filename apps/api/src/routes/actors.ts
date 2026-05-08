import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, actors } from "@repo/db";
import { createActorSchema, updateActorSchema } from "@repo/validators";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.ts";
import { writeAuditLog } from "../lib/audit.ts";

export const actorsRouter = new Hono()
  .use(requireAuth)

  .get("/", async (c) => {
    const { workspaceId } = c.get("auth");

    const rows = await db.query.actors.findMany({
      where: eq(actors.workspaceId, workspaceId),
      orderBy: (a, { asc }) => [asc(a.name)],
    });

    return c.json({ data: rows });
  })

  .post("/", zValidator("json", createActorSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const body = c.req.valid("json");

    const [actor] = await db.insert(actors).values({
      workspaceId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      type: body.type,
      company: body.company,
      notes: body.notes,
    }).returning();

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "actor",
      entityId: actor!.id,
      action: "created",
      metadata: { name: body.name, type: body.type },
    });

    return c.json({ data: actor }, 201);
  })

  .get("/:id", async (c) => {
    const { workspaceId } = c.get("auth");
    const { id } = c.req.param();

    const actor = await db.query.actors.findFirst({
      where: and(eq(actors.id, id), eq(actors.workspaceId, workspaceId)),
    });

    if (!actor) return c.json({ error: "Not found" }, 404);
    return c.json({ data: actor });
  })

  .patch("/:id", zValidator("json", updateActorSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();
    const body = c.req.valid("json");

    const existing = await db.query.actors.findFirst({
      where: and(eq(actors.id, id), eq(actors.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const [updated] = await db.update(actors)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(actors.id, id))
      .returning();

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "actor",
      entityId: id,
      action: "updated",
      diff: { before: existing, after: updated },
    });

    return c.json({ data: updated });
  })

  .delete("/:id", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();

    const existing = await db.query.actors.findFirst({
      where: and(eq(actors.id, id), eq(actors.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    await db.delete(actors).where(eq(actors.id, id));

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "actor",
      entityId: id,
      action: "deleted",
      diff: { before: existing },
    });

    return c.json({ success: true });
  });
