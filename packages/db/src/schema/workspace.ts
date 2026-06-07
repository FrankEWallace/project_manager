import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const currencyCodeEnum = pgEnum("currency_code", [
  "USD", "EUR", "GBP", "MYR", "TZS", "NGN", "KES", "GHS", "ZAR", "INR",
  "AUD", "CAD", "SGD", "AED", "SAR", "JPY", "CNY", "BRL", "MXN", "PKR",
]);

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  baseCurrency: currencyCodeEnum("base_currency").notNull().default("USD"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon"),
  description: text("description"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
