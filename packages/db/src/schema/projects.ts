import {
  pgTable, text, timestamp, boolean, integer, pgEnum, numeric, index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { workspaces, categories, currencyCodeEnum } from "./workspace.ts";
import { actors } from "./actors.ts";

export const projectStatusEnum = pgEnum("project_status", [
  "draft", "active", "on_hold", "completed", "cancelled",
]);

export const projectHealthEnum = pgEnum("project_health", [
  "healthy", "at_risk", "delayed", "blocked",
]);

export const projectPriorityEnum = pgEnum("project_priority", [
  "low", "medium", "high", "critical",
]);

export const projectVisibilityEnum = pgEnum("project_visibility", [
  "private", "workspace",
]);

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("draft"),
  health: projectHealthEnum("health").notNull().default("healthy"),
  priority: projectPriorityEnum("priority").notNull().default("medium"),
  visibility: projectVisibilityEnum("visibility").notNull().default("workspace"),
  budget: numeric("budget", { precision: 14, scale: 2 }),
  currency: currencyCodeEnum("currency").notNull().default("USD"),
  tags: text("tags").array().notNull().default([]),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  archived: boolean("archived").notNull().default(false),
  ownerId: text("owner_id").notNull(), // Better Auth user.id
  createdBy: text("created_by").notNull(), // Better Auth user.id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("projects_workspace_id_idx").on(t.workspaceId),
  index("projects_workspace_status_idx").on(t.workspaceId, t.status),
  index("projects_workspace_archived_idx").on(t.workspaceId, t.archived),
]);

export const projectActors = pgTable("project_actors", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull().references(() => actors.id, { onDelete: "cascade" }),
  role: text("role"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectMembers = pgTable("project_members", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Better Auth user.id
  role: text("role"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const phaseStatusEnum = pgEnum("phase_status", [
  "pending", "active", "completed", "skipped",
]);

export const phases = pgTable("phases", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: phaseStatusEnum("status").notNull().default("pending"),
  order: integer("order").notNull().default(0),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("phases_project_id_idx").on(t.projectId),
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "open", "completed",
]);

export const milestones = pgTable("milestones", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  phaseId: text("phase_id").notNull().references(() => phases.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: milestoneStatusEnum("status").notNull().default("open"),
  order: integer("order").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  assignedTo: text("assigned_to"), // Better Auth user.id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("milestones_project_id_idx").on(t.projectId),
  index("milestones_phase_id_idx").on(t.phaseId),
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo", "in_progress", "done", "cancelled",
]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  milestoneId: text("milestone_id").references(() => milestones.id, { onDelete: "cascade" }),
  phaseId: text("phase_id").references(() => phases.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("todo"),
  order: integer("order").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  assignedTo: text("assigned_to"), // Better Auth user.id
  createdBy: text("created_by").notNull(), // Better Auth user.id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
