import { Hono } from "hono";
import { db, projects, transactions, milestones, phases } from "@repo/db";
import { eq, sql, count, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.ts";

export const analyticsRouter = new Hono()
  .use(requireAuth)

  // Portfolio overview
  .get("/portfolio", async (c) => {
    const { workspaceId } = c.get("auth");

    const [statusCounts, financials, projectList] = await Promise.all([
      db
        .select({ status: projects.status, count: count() })
        .from(projects)
        .where(and(eq(projects.workspaceId, workspaceId), eq(projects.archived, false)))
        .groupBy(projects.status),

      db
        .select({
          totalIncome: sql<string>`coalesce(sum(case when t.type = 'income' then t.normalized_amount else 0 end), 0)`,
          totalExpenses: sql<string>`coalesce(sum(case when t.type = 'expense' then t.normalized_amount else 0 end), 0)`,
        })
        .from(transactions)
        .innerJoin(projects, eq(transactions.projectId, projects.id))
        .where(eq(projects.workspaceId, workspaceId)),

      db
        .select({ id: projects.id, name: projects.name, status: projects.status, dueDate: projects.dueDate })
        .from(projects)
        .where(and(eq(projects.workspaceId, workspaceId), eq(projects.archived, false))),
    ]);

    const now = new Date();
    const overdue = projectList.filter(
      (p) => p.status === "active" && p.dueDate && p.dueDate < now
    ).length;

    const totalIncome = Number(financials[0]?.totalIncome ?? 0);
    const totalExpenses = Number(financials[0]?.totalExpenses ?? 0);

    return c.json({
      data: {
        statusBreakdown: statusCounts,
        overdue,
        totalProjects: projectList.length,
        financials: {
          totalIncome,
          totalExpenses,
          profit: totalIncome - totalExpenses,
        },
      },
    });
  })

  // Per-category breakdown
  .get("/by-category", async (c) => {
    const { workspaceId } = c.get("auth");

    const rows = await db
      .select({
        categoryId: projects.categoryId,
        count: count(),
        totalIncome: sql<string>`coalesce(sum(case when t.type = 'income' then t.normalized_amount else 0 end), 0)`,
        totalExpenses: sql<string>`coalesce(sum(case when t.type = 'expense' then t.normalized_amount else 0 end), 0)`,
      })
      .from(projects)
      .leftJoin(transactions, eq(transactions.projectId, projects.id))
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.archived, false)))
      .groupBy(projects.categoryId);

    return c.json({ data: rows });
  })

  // Milestones completion summary
  .get("/milestones-summary", async (c) => {
    const { workspaceId } = c.get("auth");

    const projectIds = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.archived, false)));

    if (projectIds.length === 0) {
      return c.json({ data: { total: 0, completed: 0, completionRate: 0 } });
    }

    const ids = projectIds.map((p) => p.id);

    const [total, completed] = await Promise.all([
      db.select({ count: count() }).from(milestones).where(inArray(milestones.projectId, ids)),
      db.select({ count: count() }).from(milestones).where(
        and(inArray(milestones.projectId, ids), eq(milestones.status, "completed"))
      ),
    ]);

    const totalCount = total[0]?.count ?? 0;
    const completedCount = completed[0]?.count ?? 0;

    return c.json({
      data: {
        total: totalCount,
        completed: completedCount,
        completionRate: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
      },
    });
  })

  // Top spending projects
  .get("/top-spending", async (c) => {
    const { workspaceId } = c.get("auth");
    const limit = Number(c.req.query("limit") ?? 5);

    const rows = await db
      .select({
        projectId: transactions.projectId,
        projectName: projects.name,
        totalExpenses: sql<string>`sum(case when t.type = 'expense' then t.normalized_amount else 0 end)`,
      })
      .from(transactions)
      .innerJoin(projects, eq(transactions.projectId, projects.id))
      .where(eq(projects.workspaceId, workspaceId))
      .groupBy(transactions.projectId, projects.name)
      .orderBy(sql`sum(case when t.type = 'expense' then t.normalized_amount else 0 end) desc`)
      .limit(limit);

    return c.json({ data: rows });
  });
