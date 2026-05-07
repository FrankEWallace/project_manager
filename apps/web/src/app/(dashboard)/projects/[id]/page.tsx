"use client";

import { use } from "react";
import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { ArrowLeft, TrendingUp, TrendingDown, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  health: string;
  priority: string;
  budget: string | null;
  currency: string;
  tags: string[];
  dueDate: string | null;
  startDate: string | null;
  createdAt: string;
  progress: number;
  financials: {
    totalIncome: number;
    totalExpenses: number;
    profit: number;
    budget: number | null;
    budgetUsed: number | null;
  };
}

const healthColors: Record<string, string> = {
  healthy: "text-green-600 bg-green-50",
  at_risk: "text-yellow-700 bg-yellow-50",
  delayed: "text-orange-700 bg-orange-50",
  blocked: "text-red-700 bg-red-50",
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, loading } = useApi<ProjectDetail>(`/api/projects/${id}`);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge>{project.status.replace("_", " ")}</Badge>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${healthColors[project.health]}`}>
              {project.health.replace("_", " ")}
            </span>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
          <div className="flex gap-2 mt-2 flex-wrap">
            {project.tags.map((tag) => (
              <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm">Edit</Button>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Overall progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">{formatPercent(project.progress)}</span>
            {project.dueDate && (
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Due {formatDate(project.dueDate)}
              </span>
            )}
          </div>
          <Progress value={project.progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Financials */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(project.financials.totalIncome, project.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(project.financials.totalExpenses, project.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${project.financials.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(project.financials.profit, project.currency)}
            </p>
          </CardContent>
        </Card>

        {project.financials.budget && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Budget used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-xl font-bold text-foreground">
                {project.financials.budgetUsed}%
              </p>
              <Progress value={project.financials.budgetUsed ?? 0} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(project.financials.budget, project.currency)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty phases state */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Phases & milestones</CardTitle>
            <Button size="sm">Add phase</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No phases yet. Add a phase to start tracking progress.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
