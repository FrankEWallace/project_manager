"use client";

import { WorkspaceInit } from "@/components/workspace-init";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, FolderKanban, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Portfolio {
  statusBreakdown: { status: string; count: number }[];
  overdue: number;
  totalProjects: number;
  financials: { totalIncome: number; totalExpenses: number; profit: number };
}

export default function DashboardPage() {
  const { data: portfolio, loading } = useApi<Portfolio>("/api/analytics/portfolio");

  const active = portfolio?.statusBreakdown.find((s) => s.status === "active")?.count ?? 0;
  const completed = portfolio?.statusBreakdown.find((s) => s.status === "completed")?.count ?? 0;
  const onHold = portfolio?.statusBreakdown.find((s) => s.status === "on_hold")?.count ?? 0;

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

        {/* Financial summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Total revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : formatCurrency(portfolio?.financials.totalIncome ?? 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Total expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : formatCurrency(portfolio?.financials.totalExpenses ?? 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-2xl font-bold">—</p>
              ) : (
                <p className={`text-2xl font-bold ${(portfolio?.financials.profit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(portfolio?.financials.profit ?? 0)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project status breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active", value: active, color: "bg-blue-500" },
            { label: "Completed", value: completed, color: "bg-green-500" },
            { label: "On hold", value: onHold, color: "bg-yellow-500" },
            { label: "Overdue", value: portfolio?.overdue ?? 0, color: "bg-red-500" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{loading ? "—" : value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(portfolio?.overdue ?? 0) > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 text-red-700">
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
