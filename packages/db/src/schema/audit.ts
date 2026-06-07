import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { workspaces } from "./workspace.ts";

export const auditEntityEnum = pgEnum("audit_entity", [
  "workspace", "project", "phase", "milestone", "task",
  "transaction", "actor", "user", "invitation",
  "invoice", "invoice_settings", "category",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "created", "updated", "deleted", "status_changed",
  "member_added", "member_removed", "invited", "archived",
  "completed", "reopened", "payment_recorded",
]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id"), // Better Auth user.id — nullable for system actions
  entity: auditEntityEnum("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: auditActionEnum("action").notNull(),
  diff: jsonb("diff"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
