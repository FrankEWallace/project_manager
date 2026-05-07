"use client";

import { useApi } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  health: string;
  priority: string;
  budget: string | null;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "secondary",
  active: "default",
  on_hold: "outline",
  completed: "default",
  cancelled: "destructive",
};

const healthColors: Record<string, string> = {
  healthy: "text-green-600",
  at_risk: "text-yellow-600",
  delayed: "text-orange-600",
  blocked: "text-red-600",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-blue-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

export default function ProjectsPage() {
  const { data: projects, loading } = useApi<Project[]>("/api/projects");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Loading…" : `${projects?.length ?? 0} projects`}
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !projects?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">Create project</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <Badge variant={statusColors[project.status] as any}>
                        {project.status.replace("_", " ")}
                      </Badge>
                      <span className={`text-xs font-medium ${healthColors[project.health]}`}>
                        {project.health.replace("_", " ")}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">{project.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {project.budget && (
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(Number(project.budget))}
                      </p>
                    )}
                    {project.dueDate && (
                      <p className="text-xs text-muted-foreground">Due {formatDate(project.dueDate)}</p>
                    )}
                    <p className={`text-xs font-medium ${priorityColors[project.priority]}`}>
                      {project.priority}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
