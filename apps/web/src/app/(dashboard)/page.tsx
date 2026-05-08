"use client";

import { WorkspaceInit } from "@/components/workspace-init";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Portfolio {
  statusBreakdown: { status: string; count: number }[];
  overdue: number;
  totalProjects: number;
  financials: { totalIncome: number; totalExpenses: number; profit: number };
}

interface Trends {
  income: { current: number; previous: number; pct: number | null };
  expenses: { current: number; previous: number; pct: number | null };
  profit: { current: number; previous: number; pct: number | null };
  activeProjects: { current: number; previous: number; pct: number | null };
}

function TrendBadge({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return null;
  const positive = invert ? pct <= 0 : pct >= 0;
  return (
    <Badge
      className={
        positive
          ? "bg-green-500/10 text-green-700 dark:text-green-300"
          : "bg-red-500/10 text-destructive"
      }
    >
      {pct >= 0 ? "+" : ""}{pct}%
    </Badge>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />;
}

const statusLabels: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
  overdue: "Overdue",
};

const statusColors: Record<string, string> = {
  active: "bg-blue-500",
  completed: "bg-green-500",
  on_hold: "bg-yellow-500",
  overdue: "bg-red-500",
};

export default function DashboardPage() {
  const { data: portfolio, loading: pLoading } = useApi<Portfolio>("/api/analytics/portfolio");
  const { data: trends, loading: tLoading } = useApi<Trends>("/api/analytics/trends");

  const loading = pLoading || tLoading;

  const active = portfolio?.statusBreakdown.find((s) => s.status === "active")?.count ?? 0;
  const completed = portfolio?.statusBreakdown.find((s) => s.status === "completed")?.count ?? 0;
  const onHold = portfolio?.statusBreakdown.find((s) => s.status === "on_hold")?.count ?? 0;

  const kpis = [
    {
      label: "Total revenue",
      value: formatCurrency(portfolio?.financials.totalIncome ?? 0),
      pct: trends?.income.pct ?? null,
      invert: false,
    },
    {
      label: "Total expenses",
      value: formatCurrency(portfolio?.financials.totalExpenses ?? 0),
      pct: trends?.expenses.pct ?? null,
      invert: true,
    },
    {
      label: "Net profit",
      value: formatCurrency(portfolio?.financials.profit ?? 0),
      pct: trends?.profit.pct ?? null,
      invert: false,
      colored: true,
      profit: portfolio?.financials.profit ?? 0,
    },
    {
      label: "Active projects",
      value: String(active),
      pct: trends?.activeProjects.pct ?? null,
      invert: false,
    },
  ];

  return (
    <>
      <WorkspaceInit />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Portfolio overview</p>
          </div>
          <Button asChild>
            <Link href="/projects/new">New project</Link>
          </Button>
        </div>

        {/* Unified KPI grid */}
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="grid grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, i) => {
              const isLastRow = i >= 2;
              const isRight = i % 2 === 1;
              return (
                <div
                  key={kpi.label}
                  className={[
                    "p-5 flex flex-col gap-3",
                    !isLastRow ? "border-b border-foreground/10" : "",
                    !isRight ? "border-r border-foreground/10" : "",
                  ].join(" ")}
                >
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <div className="flex items-end justify-between gap-2">
                      <span
                        className={[
                          "text-2xl font-bold leading-none",
                          kpi.colored
                            ? kpi.profit >= 0
                              ? "text-green-600"
                              : "text-destructive"
                            : "text-foreground",
                        ].join(" ")}
                      >
                        {kpi.value}
                      </span>
                      <TrendBadge pct={kpi.pct} invert={kpi.invert} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active", value: active, key: "active" },
            { label: "Completed", value: completed, key: "completed" },
            { label: "On hold", value: onHold, key: "on_hold" },
            { label: "Overdue", value: portfolio?.overdue ?? 0, key: "overdue" },
          ].map(({ label, value, key }) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusColors[key]}`} />
                  <div>
                    <p className={`text-2xl font-bold ${key === "overdue" && value > 0 ? "text-destructive" : "text-foreground"}`}>
                      {loading ? "—" : value}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(portfolio?.overdue ?? 0) > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">
                  {portfolio!.overdue} project{portfolio!.overdue > 1 ? "s are" : " is"} overdue.{" "}
                  <Link href="/projects?status=active" className="underline">View projects</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
