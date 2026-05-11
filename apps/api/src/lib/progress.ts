import { db, milestones, phases } from "@repo/db";
import { eq, count, and, sql } from "drizzle-orm";

export async function computePhaseProgress(phaseId: string): Promise<number> {
  const [row] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${milestones.status} = 'completed')`,
    })
    .from(milestones)
    .where(eq(milestones.phaseId, phaseId));

  const total = row?.total ?? 0;
  if (total === 0) return 0;
  return Math.round(((row?.completed ?? 0) / total) * 100);
}

export async function computeProjectProgress(projectId: string): Promise<number> {
  const [row] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${milestones.status} = 'completed')`,
    })
    .from(milestones)
    .innerJoin(phases, eq(milestones.phaseId, phases.id))
    .where(eq(phases.projectId, projectId));

  const total = row?.total ?? 0;
  if (total === 0) return 0;
  return Math.round(((row?.completed ?? 0) / total) * 100);
}
