"use client";

import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, FolderKanban,
  CheckCircle2, AlertTriangle, BarChart3,
} from "lucide-react";

interface Portfolio {
  statusBreakdown: { status: string; count: number }[];
  overdue: number;
  totalProjects: number;
  financials: { totalIncome: number; totalExpenses: number; profit: number };
}

interface MilestonesSummary {
  total: number;
  completed: number;
  completionRate: number;
}

interface TopSpending {
  projectId: string;
  projectName: string;
  totalExpenses: string;
}

interface ByCategory {
  categoryId: string | null;
  count: number;
  totalIncome: string;
  totalExpenses: string;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-400",
  active: "bg-blue-500",
  on_hold: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className}`} />;
}

export default function AnalyticsPage() {
  const { data: portfolio, loading: portfolioLoading } = useApi<Portfolio>("/api/analytics/portfolio");
  const { data: milestones, loading: milestonesLoading } = useApi<MilestonesSummary>("/api/analytics/milestones-summary");
  const { data: topSpending, loading: topSpendingLoading } = useApi<TopSpending[]>("/api/analytics/top-spending?limit=5");
  const { data: byCategory, loading: byCategoryLoading } = useApi<ByCategory[]>("/api/analytics/by-category");

  const loading = portfolioLoading || milestonesLoading;

  const profit = portfolio?.financials.profit ?? 0;
  const totalProjects = portfolio?.totalProjects ?? 0;
  const active = portfolio?.statusBreakdown.find((s) => s.status === "active")?.count ?? 0;
  const completed = portfolio?.statusBreakdown.find((s) => s.status === "completed")?.count ?? 0;
  const maxSpend = topSpending && topSpending.length > 0
    ? Math.max(...topSpending.map((t) => Number(t.totalExpenses)))
    : 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Portfolio intelligence</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5" /> Total projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-3xl font-bold text-foreground">{totalProjects}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-3xl font-bold text-foreground">{active}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-3xl font-bold text-foreground">{completed}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-10" /> : (
              <p className={`text-3xl font-bold ${(portfolio?.overdue ?? 0) > 0 ? "text-red-600" : "text-foreground"}`}>
                {portfolio?.overdue ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" /> Total revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioLoading ? <Skeleton className="h-9 w-32" /> : (
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(portfolio?.financials.totalIncome ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Total expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioLoading ? <Skeleton className="h-9 w-32" /> : (
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(portfolio?.financials.totalExpenses ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net profit</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioLoading ? <Skeleton className="h-9 w-32" /> : (
              <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(profit)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestones + Status breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Milestone completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Milestone completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestonesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : milestones ? (
              <>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-foreground">{milestones.completionRate}%</span>
                  <span className="text-sm text-muted-foreground pb-1">
                    {milestones.completed} of {milestones.total} completed
                  </span>
                </div>
                <Progress value={milestones.completionRate} className="h-2" />
                {milestones.total === 0 && (
                  <p className="text-xs text-muted-foreground">No milestones created yet.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Projects by status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {portfolioLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
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
                  <span className="text-sm font-medium text-foreground w-6 text-right shrink-0">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            )}
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
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
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
          ) : (
            <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* By category */}
      {byCategory && byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {byCategory.map((item, i) => (
                <div key={item.categoryId ?? `uncategorized-${i}`} className="py-3 flex items-center justify-between gap-4">
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
                    <span className="text-red-500">−{formatCurrency(Number(item.totalExpenses))}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
