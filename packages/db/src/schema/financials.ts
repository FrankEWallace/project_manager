import { pgTable, text, timestamp, pgEnum, numeric, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { currencyCodeEnum } from "./workspace.ts";
import { projects, phases, milestones, tasks } from "./projects.ts";
import { actors } from "./actors.ts";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income", "expense",
]);

export const transactionCategoryEnum = pgEnum("transaction_category", [
  "client_payment", "grant", "sponsorship", "investment", "refund", "other_income",
  "salary", "contractor", "software", "hosting", "hardware", "transport",
  "marketing", "legal", "office", "utilities", "other_expense",
]);

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  phaseId: text("phase_id").references(() => phases.id, { onDelete: "set null" }),
  milestoneId: text("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  actorId: text("actor_id").references(() => actors.id, { onDelete: "set null" }),
  type: transactionTypeEnum("type").notNull(),
  category: transactionCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: currencyCodeEnum("currency").notNull(),
  normalizedAmount: numeric("normalized_amount", { precision: 14, scale: 2 }).notNull(),
  workspaceCurrency: currencyCodeEnum("workspace_currency").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  invoiceId: text("invoice_id"), // set when transaction is auto-created from an invoice payment
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  createdBy: text("created_by").notNull(), // Better Auth user.id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("transactions_project_id_idx").on(t.projectId),
  index("transactions_date_idx").on(t.date),
]);
