import type { Context, Next } from "hono";
import { auth } from "../lib/auth.ts";
import { db, workspaceMembers } from "@repo/db";
import { eq, and } from "drizzle-orm";

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "member";
}

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const workspaceId = c.req.header("X-Workspace-Id");
  if (!workspaceId) {
    return c.json({ error: "X-Workspace-Id header required" }, 400);
  }

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, session.user.id),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });

  if (!membership) {
    return c.json({ error: "Forbidden" }, 403);
  }

  c.set("auth", {
    userId: session.user.id,
    workspaceId,
    role: membership.role,
  });

  await next();
}

export function requireRole(...roles: AuthContext["role"][]) {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth");
    if (!roles.includes(auth.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}
