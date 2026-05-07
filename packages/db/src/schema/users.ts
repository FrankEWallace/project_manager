import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { workspaces } from "./workspace.ts";

export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "member"]);

// workspace_members links Better Auth's user.id to our workspaces
export const workspaceMembers = pgTable("workspace_members", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // references Better Auth's user.id
  role: workspaceRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invitations = pgTable("invitations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: workspaceRoleEnum("role").notNull().default("member"),
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by").notNull(), // references Better Auth's user.id
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
