import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, workspaceMembers, workspaces } from "@repo/db";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth.ts";
import { updateWorkspaceSchema } from "@repo/validators";
import { requireAuth } from "../middleware/auth.ts";

type CurrencyCode = "USD" | "EUR" | "GBP" | "MYR" | "TZS" | "NGN" | "KES" | "GHS" | "ZAR" | "INR" | "AUD" | "CAD" | "SGD" | "AED" | "SAR" | "JPY" | "CNY" | "BRL" | "MXN" | "PKR";

export const workspacesRouter = new Hono()

  // No X-Workspace-Id needed — this is how the client discovers the workspace
  .get("/me", async (c) => {
    const session = await auth.api.getSession({ headers: (c.req.raw as any).headers });
    if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, session.user.id),
    });

    return c.json({ data: memberships });
  })

  .get("/current", requireAuth, async (c) => {
    const { workspaceId } = c.get("auth");

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) return c.json({ error: "Not found" }, 404);
    return c.json({ data: workspace });
  })

  .patch("/current", requireAuth, zValidator("json", updateWorkspaceSchema), async (c) => {
    const { workspaceId } = c.get("auth");
    const body = c.req.valid("json");

    const [updated] = await db.update(workspaces)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.baseCurrency ? { baseCurrency: body.baseCurrency as CurrencyCode } : {}),
        updatedAt: new Date(),
      } as any)
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ data: updated });
  });
