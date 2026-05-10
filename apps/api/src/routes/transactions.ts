import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, transactions, projects } from "@repo/db";
import { createTransactionSchema } from "@repo/validators";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../lib/audit.js";

export const transactionsRouter = new Hono()
  .use(requireAuth)

  .get("/projects/:projectId/transactions", async (c) => {
    const { workspaceId } = c.get("auth");
    const { projectId } = c.req.param();

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
    });
    if (!project) return c.json({ error: "Not found" }, 404);

    const rows = await db.query.transactions.findMany({
      where: eq(transactions.projectId, projectId),
      with: { actor: true },
      orderBy: [desc(transactions.date)],
    });

    return c.json({ data: rows });
  })

  .post("/projects/:projectId/transactions", zValidator("json", createTransactionSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId } = c.req.param();
    const body = c.req.valid("json");

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
    });
    if (!project) return c.json({ error: "Not found" }, 404);

    const [tx] = await db.insert(transactions).values({
      projectId,
      phaseId: body.phaseId,
      milestoneId: body.milestoneId,
      taskId: body.taskId,
      actorId: body.actorId,
      type: body.type,
      category: body.category,
      description: body.description,
      amount: String(body.amount),
      currency: body.currency as any,
      normalizedAmount: String(body.normalizedAmount),
      workspaceCurrency: project.currency,
      date: new Date(body.date),
      receiptUrl: body.receiptUrl,
      notes: body.notes,
      createdBy: userId,
    } as any).returning();

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "transaction",
      entityId: tx!.id,
      action: "created",
      metadata: { projectId, type: body.type, amount: body.amount },
    });

    return c.json({ data: tx }, 201);
  })

  .delete("/projects/:projectId/transactions/:id", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { projectId, id } = c.req.param();

    const existing = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.projectId, projectId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    await db.delete(transactions).where(eq(transactions.id, id));

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "transaction",
      entityId: id,
      action: "deleted",
      diff: { before: existing },
    });

    return c.json({ success: true });
  });
