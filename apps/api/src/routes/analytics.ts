import { Hono } from "hono";
import { db, projects, transactions, milestones, phases } from "@repo/db";
import { eq, sql, count, and, inArray, gte, lt, gt, desc } from "drizzle-orm";
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
  })

  // Trend: current month vs last month for KPI badges
  .get("/trends", async (c) => {
    const { workspaceId } = c.get("auth");

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = thisMonthStart;

    const financials = (start: Date, end: Date) =>
      db
        .select({
          income: sql<string>`coalesce(sum(case when t.type = 'income' then t.normalized_amount else 0 end), 0)`,
          expenses: sql<string>`coalesce(sum(case when t.type = 'expense' then t.normalized_amount else 0 end), 0)`,
        })
        .from(transactions)
        .innerJoin(projects, eq(transactions.projectId, projects.id))
        .where(
          and(
            eq(projects.workspaceId, workspaceId),
            gte(transactions.date, start),
            lt(transactions.date, end)
          )
        );

    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [current, last, activeNow, activeLast] = await Promise.all([
      financials(thisMonthStart, nextMonthStart),
      financials(lastMonthStart, lastMonthEnd),
      db.select({ count: count() }).from(projects).where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.status, "active"), eq(projects.archived, false))
      ),
      db.select({ count: count() }).from(projects).where(
        and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.status, "active"),
          eq(projects.archived, false),
          lt(projects.createdAt, thisMonthStart)
        )
      ),
    ]);

    const cur = current[0]!;
    const prv = last[0]!;
    const curIncome = Number(cur.income);
    const prvIncome = Number(prv.income);
    const curExpenses = Number(cur.expenses);
    const prvExpenses = Number(prv.expenses);
    const curProfit = curIncome - curExpenses;
    const prvProfit = prvIncome - prvExpenses;
    const curActive = activeNow[0]?.count ?? 0;
    const prvActive = activeLast[0]?.count ?? 0;

    const pct = (cur: number, prv: number) =>
      prv === 0 ? null : Math.round(((cur - prv) / prv) * 100);

    return c.json({
      data: {
        income: { current: curIncome, previous: prvIncome, pct: pct(curIncome, prvIncome) },
        expenses: { current: curExpenses, previous: prvExpenses, pct: pct(curExpenses, prvExpenses) },
        profit: { current: curProfit, previous: prvProfit, pct: pct(curProfit, prvProfit) },
        activeProjects: { current: curActive, previous: prvActive, pct: pct(curActive, prvActive) },
      },
    });
  })

  // Revenue by project (top 5 by income, with % share)
  .get("/revenue-by-project", async (c) => {
    const { workspaceId } = c.get("auth");
    const limit = Number(c.req.query("limit") ?? 5);

    const rows = await db
      .select({
        projectId: transactions.projectId,
        projectName: projects.name,
        totalIncome: sql<string>`coalesce(sum(case when t.type = 'income' then t.normalized_amount else 0 end), 0)`,
      })
      .from(transactions)
      .innerJoin(projects, eq(transactions.projectId, projects.id))
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.archived, false)))
      .groupBy(transactions.projectId, projects.name)
      .orderBy(sql`sum(case when t.type = 'income' then t.normalized_amount else 0 end) desc`)
      .limit(limit);

    const total = rows.reduce((sum, r) => sum + Number(r.totalIncome), 0);

    return c.json({
      data: rows.map((r) => ({
        ...r,
        totalIncome: Number(r.totalIncome),
        share: total > 0 ? Math.round((Number(r.totalIncome) / total) * 100) : 0,
      })),
    });
  })

  // Upcoming payments (future-dated transactions)
  .get("/upcoming-payments", async (c) => {
    const { workspaceId } = c.get("auth");
    const now = new Date();
    const limit = Number(c.req.query("limit") ?? 5);

    const rows = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        type: transactions.type,
        amount: transactions.normalizedAmount,
        currency: transactions.workspaceCurrency,
        date: transactions.date,
        projectId: transactions.projectId,
        projectName: projects.name,
        category: transactions.category,
      })
      .from(transactions)
      .innerJoin(projects, eq(transactions.projectId, projects.id))
      .where(and(eq(projects.workspaceId, workspaceId), gt(transactions.date, now)))
      .orderBy(transactions.date)
      .limit(limit);

    return c.json({ data: rows });
  })

  // Income vs expense over time (monthly/quarterly/yearly)
  .get("/income-expense-over-time", async (c) => {
    const { workspaceId } = c.get("auth");
    const period = c.req.query("period") ?? "monthly";

    let truncFn: string;
    let limit: number;
    if (period === "yearly") {
      truncFn = "year";
      limit = 5;
    } else if (period === "quarterly") {
      truncFn = "quarter";
      limit = 8;
    } else {
      truncFn = "month";
      limit = 12;
    }

    const rows = await db
      .select({
        period: sql<string>`date_trunc('${sql.raw(truncFn)}', t.date)::date`,
        income: sql<string>`coalesce(sum(case when t.type = 'income' then t.normalized_amount else 0 end), 0)`,
        expenses: sql<string>`coalesce(sum(case when t.type = 'expense' then t.normalized_amount else 0 end), 0)`,
      })
      .from(transactions)
      .innerJoin(projects, eq(transactions.projectId, projects.id))
      .where(eq(projects.workspaceId, workspaceId))
      .groupBy(sql`date_trunc('${sql.raw(truncFn)}', t.date)::date`)
      .orderBy(sql`date_trunc('${sql.raw(truncFn)}', t.date)::date desc`)
      .limit(limit);

    return c.json({
      data: rows
        .reverse()
        .map((r) => ({
          period: r.period,
          income: Number(r.income),
          expenses: Number(r.expenses),
        })),
    });
  })

  // All workspace transactions (for finances page table)
  .get("/transactions", async (c) => {
    const { workspaceId } = c.get("auth");
    const limit = Number(c.req.query("limit") ?? 50);
    const offset = Number(c.req.query("offset") ?? 0);

    const rows = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        type: transactions.type,
        category: transactions.category,
        amount: transactions.normalizedAmount,
        currency: transactions.workspaceCurrency,
        date: transactions.date,
        projectId: transactions.projectId,
        projectName: projects.name,
        notes: transactions.notes,
      })
      .from(transactions)
      .innerJoin(projects, eq(transactions.projectId, projects.id))
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    return c.json({ data: rows });
  });
