import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { db, invitations, workspaceMembers, workspaces, authUser } from "@repo/db";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import { inviteUserSchema } from "@repo/validators";
import { auth } from "../lib/auth.ts";

const resend = process.env["RESEND_API_KEY"] ? new Resend(process.env["RESEND_API_KEY"]) : null;

export const invitationsRouter = new Hono()

  // List pending invitations for workspace
  .get("/", requireAuth, async (c) => {
    const { workspaceId } = c.get("auth");
    const pending = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.workspaceId, workspaceId),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date())
        )
      );
    return c.json({ data: pending });
  })

  // List workspace members with user info
  .get("/members", requireAuth, async (c) => {
    const { workspaceId } = c.get("auth");
    const members = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        name: authUser.name,
        email: authUser.email,
      })
      .from(workspaceMembers)
      .leftJoin(authUser, eq(workspaceMembers.userId, authUser.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    return c.json({ data: members });
  })

  // Send invite (owner/admin only)
  .post("/", requireAuth, requireRole("owner", "admin"), zValidator("json", inviteUserSchema), async (c) => {
    const { workspaceId, userId } = c.get("auth");
    const { email, role } = c.req.valid("json");

    const existing = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.workspaceId, workspaceId),
        eq(invitations.email, email),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date())
      ),
    });
    if (existing) return c.json({ error: "Invite already pending for this email" }, 409);

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invite] = await db
      .insert(invitations)
      .values({ id: createId(), workspaceId, email, role, token, invitedBy: userId, expiresAt } as any)
      .returning();

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    const inviteUrl = `${process.env["WEB_URL"] ?? "http://localhost:3000"}/invite?token=${token}`;

    if (resend && workspace) {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: `You've been invited to join ${workspace.name}`,
        html: `
          <p>You've been invited to join <strong>${workspace.name}</strong> as a <strong>${role}</strong>.</p>
          <p><a href="${inviteUrl}">Accept invitation</a></p>
          <p>This link expires in 7 days. If you did not expect this invitation, you can ignore this email.</p>
        `,
      });
    } else {
      console.log(`[invite] ${email} → ${inviteUrl}`);
    }

    return c.json({ data: invite }, 201);
  })

  // Revoke invite (owner/admin only)
  .delete("/:id", requireAuth, requireRole("owner", "admin"), async (c) => {
    const { workspaceId } = c.get("auth");
    const id = c.req.param("id");
    if (!id) return c.json({ error: "ID required" }, 400);

    const [deleted] = await db
      .delete(invitations)
      .where(and(eq(invitations.id, id), eq(invitations.workspaceId, workspaceId)))
      .returning();

    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ data: deleted });
  })

  // Preview invite info (public — no auth)
  .get("/accept", async (c) => {
    const token = c.req.query("token");
    if (!token) return c.json({ error: "Token required" }, 400);

    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invite) return c.json({ error: "Invalid token" }, 404);
    if (invite.acceptedAt) return c.json({ error: "Invite already accepted" }, 410);
    if (invite.expiresAt < new Date()) return c.json({ error: "Invite expired" }, 410);

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, invite.workspaceId),
    });

    return c.json({
      data: {
        email: invite.email,
        role: invite.role,
        workspaceName: workspace?.name ?? "Unknown workspace",
        expiresAt: invite.expiresAt,
      },
    });
  })

  // Accept invite (auth required, no workspace header)
  .post("/accept", async (c) => {
    const session = await auth.api.getSession({ headers: (c.req.raw as any).headers });
    if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json() as { token?: string };
    if (!body.token) return c.json({ error: "Token required" }, 400);

    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.token, body.token),
    });

    if (!invite) return c.json({ error: "Invalid token" }, 404);
    if (invite.acceptedAt) return c.json({ error: "Already accepted" }, 410);
    if (invite.expiresAt < new Date()) return c.json({ error: "Invite expired" }, 410);
    if (invite.email !== session.user.email) {
      return c.json({ error: "This invite is for a different email address" }, 403);
    }

    const alreadyMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, invite.workspaceId),
        eq(workspaceMembers.userId, session.user.id)
      ),
    });
    if (alreadyMember) return c.json({ error: "Already a member of this workspace" }, 409);

    const [member] = await db
      .insert(workspaceMembers)
      .values({
        id: createId(),
        workspaceId: invite.workspaceId,
        userId: session.user.id,
        role: invite.role,
      } as any)
      .returning();

    await db
      .update(invitations)
      .set({ acceptedAt: new Date() } as any)
      .where(eq(invitations.id, invite.id));

    return c.json({ data: { workspaceId: invite.workspaceId, member } });
  });
