"use client";

import { WorkspaceInit } from "@/components/workspace-init";
import { useApi } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, FolderKanban, CheckSquare, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import { useSession } from "@/lib/auth-client";

interface Dashboard {
  portfolio: {
    statusBreakdown: { status: string; count: number }[];
    overdue: number;
    totalProjects: number;
    financials: { totalIncome: number; totalExpenses: number; profit: number };
  };
  trends: {
    income: { current: number; previous: number; pct: number | null };
    expenses: { current: number; previous: number; pct: number | null };
    profit: { current: number; previous: number; pct: number | null };
    activeProjects: { current: number; previous: number; pct: number | null };
  };
  projects: {
    id: string;
    name: string;
    status: string;
    health: string;
    priority: string;
    budget: string | null;
    dueDate: string | null;
    createdAt: string;
    progress: number;
  }[];
  milestones: { total: number; completed: number; completionRate: number };
  upcomingPayments: {
    id: string;
    description: string;
    type: "income" | "expense";
    amount: string;
    currency: string;
    date: string;
    projectName: string;
  }[];
  onboarding: { hasProject: boolean; hasActor: boolean; hasMember: boolean };
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />;
}

function TrendIcon({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  const good = invert ? pct <= 0 : pct >= 0;
  if (pct === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  return good
    ? <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
    : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
}

function TrendLabel({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">No prior data</span>;
  const good = invert ? pct <= 0 : pct >= 0;
  const color = pct === 0 ? "text-muted-foreground" : good ? "text-green-600" : "text-red-500";
  return (
    <span className={`text-xs font-medium ${color} flex items-center gap-0.5`}>
      <TrendIcon pct={pct} invert={invert} />
      {pct >= 0 ? "+" : ""}{pct}% vs last month
    </span>
  );
}

const statusBadgeVariant: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  completed: "bg-green-500/10 text-green-700 dark:text-green-300",
  on_hold: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300",
};

const healthDot: Record<string, string> = {
  healthy: "bg-green-500",
  at_risk: "bg-yellow-500",
  delayed: "bg-orange-500",
  blocked: "bg-red-500",
};

const priorityLabel: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-blue-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, loading } = useApi<Dashboard>("/api/analytics/dashboard");

  const portfolio = data?.portfolio;
  const trends = data?.trends;
  const projects = data?.projects ?? [];
  const milestones = data?.milestones;
  const upcomingPayments = data?.upcomingPayments ?? [];
  const onboarding = data?.onboarding;

  const now = new Date();

  const active = portfolio?.statusBreakdown.find((s) => s.status === "active")?.count ?? 0;
  const completed = portfolio?.statusBreakdown.find((s) => s.status === "completed")?.count ?? 0;
  const onHold = portfolio?.statusBreakdown.find((s) => s.status === "on_hold")?.count ?? 0;

  const recentProjects = projects.slice(0, 6);
  const overdueProjects = projects.filter(
    (p) => p.status === "active" && p.dueDate && new Date(p.dueDate) < now
  );
  const dueSoonProjects = projects.filter(
    (p) =>
      p.status === "active" &&
      p.dueDate &&
      new Date(p.dueDate) >= now &&
      new Date(p.dueDate) <= new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  );

  const kpis = [
    {
      label: "Total revenue",
      value: formatCurrency(portfolio?.financials.totalIncome ?? 0),
      pct: trends?.income.pct ?? null,
      invert: false,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Total expenses",
      value: formatCurrency(portfolio?.financials.totalExpenses ?? 0),
      pct: trends?.expenses.pct ?? null,
      invert: true,
      icon: <ArrowDownRight className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Net profit",
      value: formatCurrency(portfolio?.financials.profit ?? 0),
      pct: trends?.profit.pct ?? null,
      invert: false,
      colored: true,
      profit: portfolio?.financials.profit ?? 0,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Active projects",
      value: String(active),
      pct: trends?.activeProjects.pct ?? null,
      invert: false,
      icon: <FolderKanban className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  const onboardingSteps = [
    { id: 1, title: "Create your first project", isCompleted: onboarding?.hasProject ?? false },
    { id: 2, title: "Add an actor (client, collaborator…)", isCompleted: onboarding?.hasActor ?? false },
    { id: 3, title: "Log your first transaction", isCompleted: (portfolio?.financials.totalIncome ?? 0) > 0 },
    { id: 4, title: "Invite a team member", isCompleted: onboarding?.hasMember ?? false },
    { id: 5, title: "Set up workspace settings", isCompleted: !!(session?.user?.name) },
  ];
  const showOnboarding = !loading && !onboardingSteps.every((s) => s.isCompleted);

  return (
    <>
      <WorkspaceInit />
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Portfolio overview</p>
          </div>
          <Button asChild>
            <Link href="/projects/new">New project</Link>
          </Button>
        </div>

        {showOnboarding && (
          <OnboardingChecklist
            steps={onboardingSteps}
            title={`Getting started · ${onboardingSteps.filter(s => s.isCompleted).length}/${onboardingSteps.length}`}
          />
        )}

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-muted/40 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                {kpi.icon}
              </div>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <span
                    className={[
                      "text-2xl font-bold leading-none tracking-tight",
                      kpi.colored
                        ? (kpi.profit ?? 0) >= 0 ? "text-green-600" : "text-destructive"
                        : "text-foreground",
                    ].join(" ")}
                  >
                    {kpi.value}
                  </span>
                  <TrendLabel pct={kpi.pct} invert={kpi.invert} />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Status + milestone row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Active", value: active, dot: "bg-blue-500" },
            { label: "Completed", value: completed, dot: "bg-green-500" },
            { label: "On hold", value: onHold, dot: "bg-yellow-500" },
            { label: "Overdue", value: portfolio?.overdue ?? 0, dot: "bg-red-500", warn: true },
          ].map(({ label, value, dot, warn }) => (
            <div key={label} className="bg-muted/40 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <div>
                <p className={`text-xl font-bold ${warn && value > 0 ? "text-destructive" : "text-foreground"}`}>
                  {loading ? "—" : value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
          <div className="bg-muted/40 rounded-2xl p-4 flex items-center gap-3">
            <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xl font-bold text-foreground">
                {milestones ? `${milestones.completionRate}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Milestones done</p>
            </div>
          </div>
        </div>

        {/* Alert banner */}
        {(portfolio?.overdue ?? 0) > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium">
              {portfolio!.overdue} project{portfolio!.overdue > 1 ? "s are" : " is"} overdue.{" "}
              <Link href="/projects" className="underline underline-offset-2">View projects</Link>
            </p>
          </div>
        )}

        {/* Main grid: recent projects + sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Recent projects table */}
          <div className="xl:col-span-2 bg-card rounded-2xl overflow-hidden shadow-sm ring-1 ring-border/50">
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h2 className="font-semibold text-foreground text-sm">Recent projects</h2>
              <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No projects yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell w-36">Progress</th>
                    <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((p) => {
                    const isOverdue = p.status === "active" && p.dueDate && new Date(p.dueDate) < now;
                    return (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors group border-t border-border/30 first:border-t-0">
                        <td className="px-5 py-3">
                          <Link href={`/projects/${p.id}`} className="flex items-center gap-2.5">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${healthDot[p.health] ?? "bg-muted"}`} />
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]">
                              {p.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeVariant[p.status] ?? "bg-muted text-muted-foreground"}`}>
                            {p.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell w-36">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums w-7 text-right">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right hidden lg:table-cell">
                          {p.dueDate ? (
                            <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {isOverdue ? "Overdue · " : ""}{formatDate(p.dueDate)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Due soon */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-sm ring-1 ring-border/50">
              <div className="flex items-center gap-2 px-5 pt-5 pb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground text-sm">Due in 14 days</h2>
              </div>
              {dueSoonProjects.length === 0 && overdueProjects.length === 0 ? (
                <p className="px-5 py-4 text-xs text-muted-foreground">Nothing coming up</p>
              ) : (
                <ul className="space-y-0.5 px-2 pb-2">
                  {[...overdueProjects, ...dueSoonProjects].slice(0, 5).map((p) => {
                    const overdue = p.dueDate && new Date(p.dueDate) < now;
                    return (
                      <li key={p.id}>
                        <Link href={`/projects/${p.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                          <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{p.name}</span>
                          <span className={`text-xs shrink-0 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {p.dueDate ? formatDate(p.dueDate) : "—"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Upcoming payments */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-sm ring-1 ring-border/50">
              <div className="px-5 pt-5 pb-4">
                <h2 className="font-semibold text-foreground text-sm">Upcoming payments</h2>
              </div>
              {upcomingPayments.length === 0 ? (
                <p className="px-5 py-4 text-xs text-muted-foreground">No upcoming payments</p>
              ) : (
                <ul className="space-y-0.5 px-2 pb-2">
                  {upcomingPayments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-[140px]">{p.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${p.type === "income" ? "text-green-600" : "text-destructive"}`}>
                        {p.type === "income" ? "+" : "-"}{formatCurrency(Number(p.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
