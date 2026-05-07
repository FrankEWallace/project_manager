import { db, milestones, phases } from "@repo/db";
import { eq, count, and } from "drizzle-orm";

export async function computePhaseProgress(phaseId: string): Promise<number> {
  const [total, completed] = await Promise.all([
    db.select({ count: count() }).from(milestones).where(eq(milestones.phaseId, phaseId)),
    db.select({ count: count() }).from(milestones).where(
      and(eq(milestones.phaseId, phaseId), eq(milestones.status, "completed"))
    ),
  ]);

  const totalCount = total[0]?.count ?? 0;
  if (totalCount === 0) return 0;
  return Math.round(((completed[0]?.count ?? 0) / totalCount) * 100);
}

export async function computeProjectProgress(projectId: string): Promise<number> {
  const projectPhases = await db
    .select({ id: phases.id })
    .from(phases)
    .where(eq(phases.projectId, projectId));

  if (projectPhases.length === 0) return 0;

  const phaseProgresses = await Promise.all(
    projectPhases.map((p) => computePhaseProgress(p.id))
  );

  const avg = phaseProgresses.reduce((sum, p) => sum + p, 0) / phaseProgresses.length;
  return Math.round(avg);
}
