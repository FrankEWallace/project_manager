import { relations } from "drizzle-orm";
import { workspaces, categories } from "./workspace.ts";
import { projects, phases, milestones, tasks, projectActors, projectMembers } from "./projects.ts";
import { actors } from "./actors.ts";
import { transactions } from "./financials.ts";

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  projects: many(projects),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [categories.workspaceId], references: [workspaces.id] }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  category: one(categories, { fields: [projects.categoryId], references: [categories.id] }),
  phases: many(phases),
  milestones: many(milestones),
  transactions: many(transactions),
  actors: many(projectActors),
  members: many(projectMembers),
}));

export const phasesRelations = relations(phases, ({ one, many }) => ({
  project: one(projects, { fields: [phases.projectId], references: [projects.id] }),
  milestones: many(milestones),
  tasks: many(tasks),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  phase: one(phases, { fields: [milestones.phaseId], references: [phases.id] }),
  project: one(projects, { fields: [milestones.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  phase: one(phases, { fields: [tasks.phaseId], references: [phases.id] }),
  milestone: one(milestones, { fields: [tasks.milestoneId], references: [milestones.id] }),
}));

export const actorsRelations = relations(actors, ({ many }) => ({
  projectActors: many(projectActors),
  transactions: many(transactions),
}));

export const projectActorsRelations = relations(projectActors, ({ one }) => ({
  project: one(projects, { fields: [projectActors.projectId], references: [projects.id] }),
  actor: one(actors, { fields: [projectActors.actorId], references: [actors.id] }),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, { fields: [transactions.projectId], references: [projects.id] }),
  actor: one(actors, { fields: [transactions.actorId], references: [actors.id] }),
}));
