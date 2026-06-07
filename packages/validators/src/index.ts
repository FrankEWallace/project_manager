import { z } from "zod";

// ─── Workspace ────────────────────────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  baseCurrency: z.string().length(3).default("USD"),
});

// ─── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  archived: z.boolean().optional(),
});

// ─── Project ──────────────────────────────────────────────────────────────────

const projectStatuses = ["draft", "active", "on_hold", "completed", "cancelled"] as const;
const projectHealthValues = ["healthy", "at_risk", "delayed", "blocked"] as const;
const projectPriorityValues = ["low", "medium", "high", "critical"] as const;
const projectVisibilityValues = ["private", "workspace"] as const;

export const createProjectSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(projectStatuses).default("draft"),
  health: z.enum(projectHealthValues).default("healthy"),
  priority: z.enum(projectPriorityValues).default("medium"),
  visibility: z.enum(projectVisibilityValues).default("workspace"),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  tags: z.array(z.string().max(50)).default([]),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─── Phase ────────────────────────────────────────────────────────────────────

export const createPhaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updatePhaseSchema = createPhaseSchema.partial();

// ─── Milestone ────────────────────────────────────────────────────────────────

export const createMilestoneSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
});

export const updateMilestoneSchema = createMilestoneSchema.partial();

// ─── Actor ────────────────────────────────────────────────────────────────────

const actorTypes = ["client", "collaborator", "vendor", "advisor", "investor"] as const;

export const createActorSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(actorTypes),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export const updateActorSchema = createActorSchema.partial();

// ─── Transaction ──────────────────────────────────────────────────────────────

const transactionTypes = ["income", "expense"] as const;
const transactionCategories = [
  "client_payment", "grant", "sponsorship", "investment", "refund", "other_income",
  "salary", "contractor", "software", "hosting", "hardware", "transport",
  "marketing", "legal", "office", "utilities", "other_expense",
] as const;

export const createTransactionSchema = z.object({
  type: z.enum(transactionTypes),
  category: z.enum(transactionCategories),
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3),
  normalizedAmount: z.number().positive(),
  date: z.string().datetime(),
  phaseId: z.string().optional(),
  milestoneId: z.string().optional(),
  taskId: z.string().optional(),
  actorId: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseCurrency: z.string().length(3).optional(),
});

// ─── Task ─────────────────────────────────────────────────────────────────────

const taskStatuses = ["todo", "in_progress", "done", "cancelled"] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(taskStatuses).default("todo"),
  milestoneId: z.string().optional(),
  phaseId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().min(0).default(0),
});

export const updateTaskSchema = createTaskSchema.partial();

// ─── Invitation ───────────────────────────────────────────────────────────────

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

// ─── Invoice ──────────────────────────────────────────────────────────────────

const invoiceStatuses = ["draft", "sent", "partially_paid", "paid", "void"] as const;

export const invoiceItemSchema = z.object({
  description: z.string().min(1).max(255),
  details: z.string().optional(),
  quantity: z.number().positive(),
  rate: z.number().min(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const createInvoiceSchema = z.object({
  projectId: z.string().optional(),
  actorId: z.string().min(1),
  currency: z.string().length(3),
  normalizedTotal: z.number().positive(),
  taxRate: z.number().min(0).max(100).default(0),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

export const updateInvoiceSchema = z.object({
  projectId: z.string().optional().nullable(),
  actorId: z.string().optional(),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  normalizedTotal: z.number().positive().optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  normalizedAmount: z.number().positive(),
  date: z.string().datetime(),
  notes: z.string().optional(),
});

export const upsertInvoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1).max(10).optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().optional(),
  paymentDetails: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultPaymentTermsDays: z.number().int().min(0).max(365).optional(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type CreateWorkspace = z.infer<typeof createWorkspaceSchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type CreatePhase = z.infer<typeof createPhaseSchema>;
export type CreateMilestone = z.infer<typeof createMilestoneSchema>;
export type CreateActor = z.infer<typeof createActorSchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type InviteUser = z.infer<typeof inviteUserSchema>;
