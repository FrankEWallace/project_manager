import { pgTable, text, timestamp, pgEnum, numeric, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { workspaces, currencyCodeEnum } from "./workspace.ts";
import { projects } from "./projects.ts";
import { actors } from "./actors.ts";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft", "sent", "partially_paid", "paid", "void",
]);

export const invoiceSettings = pgTable("invoice_settings", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().unique().references(() => workspaces.id, { onDelete: "cascade" }),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  nextSequenceNumber: integer("next_sequence_number").notNull().default(1),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyEmail: text("company_email"),
  companyPhone: text("company_phone"),
  paymentDetails: text("payment_details"),
  defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  defaultPaymentTermsDays: integer("default_payment_terms_days").notNull().default(30),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  actorId: text("actor_id").notNull().references(() => actors.id, { onDelete: "restrict" }),
  invoiceNumber: text("invoice_number").notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  currency: currencyCodeEnum("currency").notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  normalizedTotal: numeric("normalized_total", { precision: 14, scale: 2 }).notNull(),
  workspaceCurrency: currencyCodeEnum("workspace_currency").notNull(),
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  notes: text("notes"),
  // snapshot of workspace payment details at creation time — survives settings changes
  paymentDetails: text("payment_details"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  details: text("details"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 14, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
