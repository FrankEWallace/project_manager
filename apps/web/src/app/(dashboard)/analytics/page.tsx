"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, Area, AreaChart, XAxis, YAxis, Bar, BarChart } from "recharts";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, FolderKanban,
  CheckCircle2, AlertTriangle, BarChart3,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Portfolio {
  statusBreakdown: { status: string; count: number }[];
  overdue: number;
  totalProjects: number;
  financials: { totalIncome: number; totalExpenses: number; profit: number };
}

interface Trends {
  income: { current: number; pct: number | null };
  expenses: { current: number; pct: number | null };
  profit: { current: number; pct: number | null };
  activeProjects: { current: number; pct: number | null };
}

interface MilestonesSummary { total: number; completed: number; completionRate: number }
interface TopSpending { projectId: string; projectName: string; totalExpenses: string }
interface ByCategory { categoryId: string | null; count: number; totalIncome: string; totalExpenses: string }
interface IncomeExpensePoint { period: string; income: number; expenses: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className}`} />;
}

function TrendBadge({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return null;
  const positive = invert ? pct <= 0 : pct >= 0;
  return (
    <Badge className={positive ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-destructive"}>
      {pct >= 0 ? "+" : ""}{pct}% vs last month
    </Badge>
  );
}

const statusLabels: Record<string, string> = {
  draft: "Draft", active: "Active", on_hold: "On hold", completed: "Completed", cancelled: "Cancelled",
};
const statusColors: Record<string, string> = {
  draft: "bg-gray-400", active: "bg-blue-500", on_hold: "bg-yellow-500",
  completed: "bg-green-500", cancelled: "bg-red-400",
};

const chartConfig: ChartConfig = {
  income: { label: "Income", color: "var(--color-green-500)" },
  expenses: { label: "Expenses", color: "var(--color-red-400)" },
};

// ─── Income vs Expense Chart ──────────────────────────────────────────────────

function IncomeExpenseChart() {
  const [period, setPeriod] = React.useState("monthly");
  const { data, loading } = useApi<IncomeExpensePoint[]>(
    `/api/analytics/income-expense-over-time?period=${period}`,
    [period]
  );

  const formatLabel = (val: string) => {
    try {
      const d = parseISO(val);
      if (period === "yearly") return format(d, "yyyy");
      if (period === "quarterly") return format(d, "QQQ yyyy");
      return format(d, "MMM yyyy");
    } catch {
      return val;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Income vs Expenses</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : data && data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} strokeDasharray="0" />
              <XAxis
                dataKey="period"
                tickFormatter={formatLabel}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickMargin={8}
              />
              <YAxis hide axisLine={false} tickLine={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={formatLabel}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                }
              />
              <Area
                dataKey="income"
                stroke="var(--color-income)"
                strokeWidth={2}
                fill="url(#incomeGradient)"
                dot={false}
                strokeLinecap="round"
              />
              <Line
                dataKey="expenses"
                stroke="var(--color-expenses)"
                strokeWidth={1.5}
                dot={false}
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-56 items-center justify-center text-muted-foreground text-sm">
            No transaction data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── By Category ──────────────────────────────────────────────────────────────

function ByCategorySection({ data, loading, totalProjects }: {
  data: ByCategory[] | null;
  loading: boolean;
  totalProjects: number;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">By category</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) return null;

  // Horizontal bar chart for ≥3 categories, styled list for <3
  if (data.length >= 3) {
    const chartData = data.map((item) => ({
      name: item.categoryId ?? "Uncategorized",
      income: Number(item.totalIncome),
      expenses: Number(item.totalExpenses),
    }));

    return (
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">By category</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full" style={{ height: `${Math.max(180, data.length * 48)}px` }}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                width={100}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />
                }
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={[0, 3, 3, 0]} barSize={10} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[0, 3, 3, 0]} barSize={10} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  // Styled list for <3 categories
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm font-medium">By category</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={item.categoryId ?? `u-${i}`} className="py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  {item.categoryId ?? "Uncategorized"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.count} project{item.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-4 text-sm shrink-0">
                <span className="text-green-600">{formatCurrency(Number(item.totalIncome))}</span>
                <span className="text-destructive">−{formatCurrency(Number(item.totalExpenses))}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: portfolio, loading: portfolioLoading } = useApi<Portfolio>("/api/analytics/portfolio");
  const { data: trends, loading: trendsLoading } = useApi<Trends>("/api/analytics/trends");
  const { data: milestones, loading: milestonesLoading } = useApi<MilestonesSummary>("/api/analytics/milestones-summary");
  const { data: topSpending, loading: topSpendingLoading } = useApi<TopSpending[]>("/api/analytics/top-spending?limit=5");
  const { data: byCategory, loading: byCategoryLoading } = useApi<ByCategory[]>("/api/analytics/by-category");

  const loading = portfolioLoading || trendsLoading;
  const profit = portfolio?.financials.profit ?? 0;
  const totalProjects = portfolio?.totalProjects ?? 0;
  const active = portfolio?.statusBreakdown.find((s) => s.status === "active")?.count ?? 0;
  const completed = portfolio?.statusBreakdown.find((s) => s.status === "completed")?.count ?? 0;
  const maxSpend = topSpending?.length
    ? Math.max(...topSpending.map((t) => Number(t.totalExpenses)))
    : 1;

  const kpis = [
    { label: "Total projects", value: totalProjects, icon: <FolderKanban className="h-3.5 w-3.5" />, pct: null },
    { label: "Active", value: active, icon: <div className="w-2 h-2 rounded-full bg-blue-500" />, pct: trends?.activeProjects.pct ?? null },
    { label: "Completed", value: completed, icon: <div className="w-2 h-2 rounded-full bg-green-500" />, pct: null },
    { label: "Overdue", value: portfolio?.overdue ?? 0, icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />, pct: null, danger: true },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Portfolio intelligence</p>
      </div>

      {/* KPI strip with trend badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon, pct, danger }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                {icon} {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <p className={`text-2xl font-semibold ${danger && value > 0 ? "text-destructive" : "text-foreground"}`}>
                  {value}
                </p>
              )}
              <TrendBadge pct={pct} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" /> Total revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {portfolioLoading ? <Skeleton className="h-9 w-32" /> : (
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(portfolio?.financials.totalIncome ?? 0)}
              </p>
            )}
            <TrendBadge pct={trends?.income.pct ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Total expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {portfolioLoading ? <Skeleton className="h-9 w-32" /> : (
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(portfolio?.financials.totalExpenses ?? 0)}
              </p>
            )}
            <TrendBadge pct={trends?.expenses.pct ?? null} invert />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net profit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {portfolioLoading ? <Skeleton className="h-9 w-32" /> : (
              <p className={`text-2xl font-semibold ${profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                {formatCurrency(profit)}
              </p>
            )}
            <TrendBadge pct={trends?.profit.pct ?? null} />
          </CardContent>
        </Card>
      </div>

      {/* Income vs expenses chart */}
      <IncomeExpenseChart />

      {/* Milestones + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Milestone completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestonesLoading ? (
              <div className="space-y-3"><Skeleton className="h-8 w-24" /><Skeleton className="h-2 w-full" /></div>
            ) : milestones ? (
              <>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-semibold text-foreground">{milestones.completionRate}%</span>
                  <span className="text-sm text-muted-foreground pb-1">
                    {milestones.completed} of {milestones.total} completed
                  </span>
                </div>
                <Progress value={milestones.completionRate} className="h-2" />
                {milestones.total === 0 && (
                  <p className="text-xs text-muted-foreground">No milestones created yet.</p>
                )}
              </>
            ) : <p className="text-sm text-muted-foreground">No data.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Projects by status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {portfolioLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : portfolio?.statusBreakdown.length ? (
              portfolio.statusBreakdown.map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[item.status] ?? "bg-gray-400"}`} />
                  <span className="text-sm text-muted-foreground w-24 shrink-0">
                    {statusLabels[item.status] ?? item.status}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColors[item.status] ?? "bg-gray-400"}`}
                      style={{ width: totalProjects > 0 ? `${Math.round((item.count / totalProjects) * 100)}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-6 text-right shrink-0">{item.count}</span>
                </div>
              ))
            ) : <p className="text-sm text-muted-foreground">No projects yet.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Top spending projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" /> Top spending projects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topSpendingLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : topSpending && topSpending.length > 0 ? (
            topSpending.map((item) => (
              <div key={item.projectId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate">{item.projectName}</span>
                  <span className="text-muted-foreground shrink-0 ml-4">
                    {formatCurrency(Number(item.totalExpenses))}
                  </span>
                </div>
                <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${Math.round((Number(item.totalExpenses) / maxSpend) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>}
        </CardContent>
      </Card>

      {/* By category */}
      <ByCategorySection data={byCategory} loading={byCategoryLoading} totalProjects={totalProjects} />
    </div>
  );
}
