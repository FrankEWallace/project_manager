import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, invoices, invoiceItems, invoiceSettings, transactions, workspaces, projects, tasks, milestones } from "@repo/db";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  upsertInvoiceSettingsSchema,
} from "@repo/validators";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.ts";
import { writeAuditLog } from "../lib/audit.ts";

export const invoicesRouter = new Hono()
  .use(requireAuth)

  // ─── Invoice Settings ─────────────────────────────────────────────────────────

  .get("/settings", async (c) => {
    const { workspaceId } = c.get("auth");
    const settings = await db.query.invoiceSettings.findFirst({
      where: eq(invoiceSettings.workspaceId, workspaceId),
    });
    return c.json({ data: settings ?? null });
  })

  .put("/settings", zValidator("json", upsertInvoiceSettingsSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const body = c.req.valid("json");

    const [result] = await db
      .insert(invoiceSettings)
      .values({
        workspaceId,
        invoicePrefix: body.invoicePrefix ?? "INV",
        companyName: body.companyName,
        companyAddress: body.companyAddress,
        companyEmail: body.companyEmail,
        companyPhone: body.companyPhone,
        paymentDetails: body.paymentDetails,
        defaultTaxRate: body.defaultTaxRate != null ? String(body.defaultTaxRate) : "0",
        defaultPaymentTermsDays: body.defaultPaymentTermsDays ?? 30,
      })
      .onConflictDoUpdate({
        target: invoiceSettings.workspaceId,
        set: {
          ...(body.invoicePrefix && { invoicePrefix: body.invoicePrefix }),
          ...(body.companyName !== undefined && { companyName: body.companyName }),
          ...(body.companyAddress !== undefined && { companyAddress: body.companyAddress }),
          ...(body.companyEmail !== undefined && { companyEmail: body.companyEmail }),
          ...(body.companyPhone !== undefined && { companyPhone: body.companyPhone }),
          ...(body.paymentDetails !== undefined && { paymentDetails: body.paymentDetails }),
          ...(body.defaultTaxRate != null && { defaultTaxRate: String(body.defaultTaxRate) }),
          ...(body.defaultPaymentTermsDays != null && { defaultPaymentTermsDays: body.defaultPaymentTermsDays }),
          updatedAt: new Date(),
        },
      })
      .returning();

    await writeAuditLog({ workspaceId, userId, entity: "invoice_settings", entityId: workspaceId, action: "updated" });

    return c.json({ data: result });
  })

  // ─── List Invoices ────────────────────────────────────────────────────────────

  .get("/", async (c) => {
    const { workspaceId } = c.get("auth");
    const { status, actorId, projectId } = c.req.query();

    const rows = await db.query.invoices.findMany({
      where: and(
        eq(invoices.workspaceId, workspaceId),
        status ? eq(invoices.status, status as any) : undefined,
        actorId ? eq(invoices.actorId, actorId) : undefined,
        projectId ? eq(invoices.projectId, projectId) : undefined,
      ),
      with: { actor: true, project: true },
      orderBy: [desc(invoices.createdAt)],
    });

    return c.json({ data: rows });
  })

  // ─── Create Invoice ───────────────────────────────────────────────────────────

  .post("/", zValidator("json", createInvoiceSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const body = c.req.valid("json");

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });
    if (!workspace) return c.json({ error: "Workspace not found" }, 404);

    // Ensure settings row exists, then atomically claim the next sequence number
    await db.insert(invoiceSettings)
      .values({ workspaceId, nextSequenceNumber: 1 })
      .onConflictDoNothing();

    const [settings] = await db
      .update(invoiceSettings)
      .set({ nextSequenceNumber: sql`${invoiceSettings.nextSequenceNumber} + 1`, updatedAt: new Date() })
      .where(eq(invoiceSettings.workspaceId, workspaceId))
      .returning();

    const sequenceNumber = settings!.nextSequenceNumber - 1;
    const invoiceNumber = `${settings!.invoicePrefix}-${String(sequenceNumber).padStart(3, "0")}`;

    const subtotal = body.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (body.taxRate / 100);
    const total = subtotal + taxAmount;

    const [invoice] = await db.insert(invoices).values({
      workspaceId,
      projectId: body.projectId ?? null,
      actorId: body.actorId,
      invoiceNumber,
      sequenceNumber,
      status: "draft",
      currency: body.currency as any,
      subtotal: subtotal.toFixed(2),
      taxRate: String(body.taxRate),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      paidAmount: "0",
      normalizedTotal: body.normalizedTotal.toFixed(2),
      workspaceCurrency: workspace.baseCurrency,
      issueDate: new Date(body.issueDate),
      dueDate: new Date(body.dueDate),
      notes: body.notes ?? null,
      paymentDetails: settings!.paymentDetails ?? null,
      createdBy: userId,
    } as any).returning();

    await db.insert(invoiceItems).values(
      body.items.map((item, i) => ({
        invoiceId: invoice!.id,
        description: item.description,
        details: item.details ?? null,
        quantity: String(item.quantity),
        rate: item.rate.toFixed(2),
        amount: (item.quantity * item.rate).toFixed(2),
        sortOrder: item.sortOrder ?? i,
      }))
    );

    await writeAuditLog({
      workspaceId,
      userId,
      entity: "invoice",
      entityId: invoice!.id,
      action: "created",
      metadata: { invoiceNumber, actorId: body.actorId, total },
    });

    const result = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoice!.id),
      with: { items: true, actor: true },
    });

    return c.json({ data: result }, 201);
  })

  // ─── Import Line Items from Project ──────────────────────────────────────────
  // Must be declared before /:id to avoid route collision

  .get("/import-items/:projectId", async (c) => {
    const { workspaceId } = c.get("auth");
    const { projectId } = c.req.param();

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)),
    });
    if (!project) return c.json({ error: "Not found" }, 404);

    const [projectTasks, projectMilestones] = await Promise.all([
      db.query.tasks.findMany({
        where: and(eq(tasks.projectId, projectId), eq(tasks.status, "done")),
      }),
      db.query.milestones.findMany({
        where: eq(milestones.projectId, projectId),
      }),
    ]);

    return c.json({
      data: {
        tasks: projectTasks.map((t) => ({
          sourceId: t.id,
          sourceType: "task",
          description: t.title,
          details: t.description ?? null,
          quantity: 1,
          rate: 0,
        })),
        milestones: projectMilestones.map((m) => ({
          sourceId: m.id,
          sourceType: "milestone",
          description: m.name,
          details: m.description ?? null,
          quantity: 1,
          rate: 0,
        })),
      },
    });
  })

  // ─── Get Invoice ──────────────────────────────────────────────────────────────

  .get("/:id", async (c) => {
    const { workspaceId } = c.get("auth");
    const { id } = c.req.param();

    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)),
      with: { items: true, actor: true, project: true, transactions: true },
    });

    if (!invoice) return c.json({ error: "Not found" }, 404);
    return c.json({ data: invoice });
  })

  // ─── Update Invoice (draft only) ──────────────────────────────────────────────

  .patch("/:id", zValidator("json", updateInvoiceSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();
    const body = c.req.valid("json");

    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (existing.status !== "draft") return c.json({ error: "Only draft invoices can be edited" }, 422);

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (body.projectId !== undefined) updates.projectId = body.projectId;
    if (body.actorId) updates.actorId = body.actorId;
    if (body.currency) updates.currency = body.currency;
    if (body.issueDate) updates.issueDate = new Date(body.issueDate);
    if (body.dueDate) updates.dueDate = new Date(body.dueDate);
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.normalizedTotal != null) updates.normalizedTotal = body.normalizedTotal.toFixed(2);

    if (body.items) {
      const taxRate = body.taxRate ?? Number(existing.taxRate);
      const subtotal = body.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      updates.taxRate = String(taxRate);
      updates.subtotal = subtotal.toFixed(2);
      updates.taxAmount = taxAmount.toFixed(2);
      updates.total = total.toFixed(2);

      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      await db.insert(invoiceItems).values(
        body.items.map((item, i) => ({
          invoiceId: id,
          description: item.description,
          details: item.details ?? null,
          quantity: String(item.quantity),
          rate: item.rate.toFixed(2),
          amount: (item.quantity * item.rate).toFixed(2),
          sortOrder: item.sortOrder ?? i,
        }))
      );
    } else if (body.taxRate !== undefined) {
      const subtotal = Number(existing.subtotal);
      const taxAmount = subtotal * (body.taxRate / 100);
      updates.taxRate = String(body.taxRate);
      updates.taxAmount = taxAmount.toFixed(2);
      updates.total = (subtotal + taxAmount).toFixed(2);
    }

    const [updated] = await db
      .update(invoices)
      .set(updates as any)
      .where(eq(invoices.id, id))
      .returning();

    await writeAuditLog({
      workspaceId, userId, entity: "invoice", entityId: id,
      action: "updated", diff: { before: existing, after: updated },
    });

    const result = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: { items: true, actor: true },
    });

    return c.json({ data: result });
  })

  // ─── Delete Invoice (draft only) ──────────────────────────────────────────────

  .delete("/:id", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();

    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (existing.status !== "draft") return c.json({ error: "Only draft invoices can be deleted" }, 422);

    await db.delete(invoices).where(eq(invoices.id, id));

    await writeAuditLog({
      workspaceId, userId, entity: "invoice", entityId: id,
      action: "deleted", diff: { before: existing },
    });

    return c.json({ success: true });
  })

  // ─── Send Invoice ─────────────────────────────────────────────────────────────

  .post("/:id/send", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();

    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (existing.status !== "draft") return c.json({ error: "Only draft invoices can be sent" }, 422);

    const [updated] = await db
      .update(invoices)
      .set({ status: "sent", updatedAt: new Date() } as any)
      .where(eq(invoices.id, id))
      .returning();

    await writeAuditLog({
      workspaceId, userId, entity: "invoice", entityId: id,
      action: "status_changed", metadata: { from: "draft", to: "sent" },
    });

    return c.json({ data: updated });
  })

  // ─── Record Payment ───────────────────────────────────────────────────────────

  .post("/:id/payment", zValidator("json", recordPaymentSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();
    const body = c.req.valid("json");

    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (!["sent", "partially_paid"].includes(existing.status)) {
      return c.json({ error: "Payment can only be recorded on sent or partially paid invoices" }, 422);
    }

    const newPaidAmount = Number(existing.paidAmount) + body.amount;
    const newStatus = newPaidAmount >= Number(existing.total) ? "paid" : "partially_paid";

    const [updated] = await db
      .update(invoices)
      .set({ paidAmount: newPaidAmount.toFixed(2), status: newStatus, updatedAt: new Date() } as any)
      .where(eq(invoices.id, id))
      .returning();

    const [tx] = await db.insert(transactions).values({
      projectId: existing.projectId ?? null,
      actorId: existing.actorId,
      invoiceId: id,
      type: "income",
      category: "client_payment",
      description: `Payment for invoice ${existing.invoiceNumber}`,
      amount: body.amount.toFixed(2),
      currency: body.currency as any,
      normalizedAmount: body.normalizedAmount.toFixed(2),
      workspaceCurrency: existing.workspaceCurrency,
      date: new Date(body.date),
      notes: body.notes ?? null,
      createdBy: userId,
    } as any).returning();

    await writeAuditLog({
      workspaceId, userId, entity: "invoice", entityId: id,
      action: "payment_recorded",
      metadata: { amount: body.amount, newStatus, transactionId: tx!.id },
    });

    return c.json({ data: { invoice: updated, transaction: tx } });
  })

  // ─── Void Invoice ─────────────────────────────────────────────────────────────

  .post("/:id/void", async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { id } = c.req.param();

    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (existing.status === "void") return c.json({ error: "Invoice is already void" }, 422);
    if (existing.status === "paid") return c.json({ error: "Paid invoices cannot be voided" }, 422);

    const [updated] = await db
      .update(invoices)
      .set({ status: "void", updatedAt: new Date() } as any)
      .where(eq(invoices.id, id))
      .returning();

    await writeAuditLog({
      workspaceId, userId, entity: "invoice", entityId: id,
      action: "status_changed", metadata: { from: existing.status, to: "void" },
    });

    return c.json({ data: updated });
  });
