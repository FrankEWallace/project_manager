"use client";

import { useApi, useMutation } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FolderKanban, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  status: string;
  health: string;
  priority: string;
  budget: string | null;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  progress: number;
}

type SortKey = "name" | "status" | "health" | "priority" | "budget" | "dueDate" | "progress";
type SortDir = "asc" | "desc";

const statusOrder: Record<string, number> = { active: 0, on_hold: 1, draft: 2, completed: 3, cancelled: 4 };
const healthOrder: Record<string, number> = { blocked: 0, delayed: 1, at_risk: 2, healthy: 3 };
const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const statusStyle: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  completed: "bg-green-500/10 text-green-700 dark:text-green-300",
  on_hold: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300",
};

const healthStyle: Record<string, string> = {
  healthy: "text-green-600",
  at_risk: "text-yellow-600",
  delayed: "text-orange-600",
  blocked: "text-red-600",
};

const healthDot: Record<string, string> = {
  healthy: "bg-green-500",
  at_risk: "bg-yellow-500",
  delayed: "bg-orange-500",
  blocked: "bg-red-500",
};

const priorityStyle: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-blue-600",
  high: "text-orange-600",
  critical: "text-red-600 font-semibold",
};

function SortIcon({ col, active, dir }: { col: string; active: SortKey; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return dir === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
}

function DeleteProjectDialog({
  project,
  onClose,
  onSuccess,
}: {
  project: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { mutate, loading } = useMutation<object, unknown>(
    `/api/projects/${project?.id}`,
    "DELETE"
  );

  async function handleDelete() {
    const result = await mutate({});
    if (result !== null) { onSuccess(); onClose(); }
  }

  return (
    <Dialog open={!!project} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{project?.name}</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const { data: projects, loading, refetch } = useApi<Project[]>("/api/projects");
  const { data: categories } = useApi<Category[]>("/api/categories?archived=false");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const now = new Date();

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!projects) return [];
    let list = projects;
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter((p) =>
      categoryFilter === "none" ? !p.categoryId : p.categoryId === categoryFilter
    );
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "status") cmp = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      else if (sortKey === "health") cmp = (healthOrder[a.health] ?? 9) - (healthOrder[b.health] ?? 9);
      else if (sortKey === "priority") cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      else if (sortKey === "budget") cmp = (Number(a.budget ?? 0)) - (Number(b.budget ?? 0));
      else if (sortKey === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = da - db;
      }
      else if (sortKey === "progress") cmp = a.progress - b.progress;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [projects, sortKey, sortDir, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!projects) return {};
    return projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [projects]);

  const cols: { key: SortKey; label: string; className?: string }[] = [
    { key: "name", label: "Project" },
    { key: "status", label: "Status", className: "hidden sm:table-cell" },
    { key: "health", label: "Health", className: "hidden md:table-cell" },
    { key: "priority", label: "Priority", className: "hidden lg:table-cell" },
    { key: "budget", label: "Budget", className: "hidden lg:table-cell text-right" },
    { key: "dueDate", label: "Due date", className: "hidden xl:table-cell text-right" },
    { key: "progress", label: "Progress", className: "hidden xl:table-cell" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Loading…" : `${projects?.length ?? 0} total`}
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { value: "all", label: "All", count: projects?.length ?? 0 },
          { value: "active", label: "Active", count: statusCounts["active"] ?? 0 },
          { value: "on_hold", label: "On hold", count: statusCounts["on_hold"] ?? 0 },
          { value: "completed", label: "Completed", count: statusCounts["completed"] ?? 0 },
          { value: "draft", label: "Draft", count: statusCounts["draft"] ?? 0 },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {f.label}
            <span className={`text-xs rounded-full px-1.5 py-0 font-normal ${statusFilter === f.value ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Category filter pills — only shown when categories exist */}
      {categories && categories.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Category:</span>
          {[{ id: "all", name: "All", color: "", icon: null }, ...categories].map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                  active
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                ].join(" ")}
                style={active && cat.color ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.id !== "all" && !cat.icon && cat.color && (
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "white" : cat.color }} />
                )}
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl overflow-hidden bg-card shadow-sm ring-1 ring-border/50">
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl bg-card text-center py-20 text-muted-foreground shadow-sm ring-1 ring-border/50">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{statusFilter === "all" ? "No projects yet" : `No ${statusFilter.replace("_", " ")} projects`}</p>
          {statusFilter === "all" && (
            <>
              <p className="text-sm mt-1">Create your first project to get started</p>
              <Button asChild className="mt-4">
                <Link href="/projects/new">Create project</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-card shadow-sm ring-1 ring-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                {cols.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      "px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap",
                      col.className ?? "text-left",
                    ].join(" ")}
                  >
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <SortIcon col={col.key} active={sortKey} dir={sortDir} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((project) => {
                const isOverdue = project.status === "active" && project.dueDate && new Date(project.dueDate) < now;
                return (
                  <tr key={project.id} className="hover:bg-muted/40 transition-colors group border-t border-border/30 first:border-t-0">
                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <Link href={`/projects/${project.id}`} className="flex items-start gap-2.5 min-w-0">
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${healthDot[project.health] ?? "bg-muted"}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                            {project.name}
                          </p>
                          {project.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {project.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0 rounded-full">
                                  {tag}
                                </span>
                              ))}
                              {project.tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{project.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[project.status] ?? "bg-muted text-muted-foreground"}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Health */}
                    <td className={`px-4 py-3.5 hidden md:table-cell ${healthStyle[project.health] ?? ""}`}>
                      <span className="text-xs font-medium capitalize">{project.health.replace("_", " ")}</span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs font-medium capitalize ${priorityStyle[project.priority]}`}>
                        {project.priority}
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3.5 hidden lg:table-cell text-right">
                      <span className="text-sm text-foreground">
                        {project.budget ? formatCurrency(Number(project.budget)) : <span className="text-muted-foreground">—</span>}
                      </span>
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3.5 hidden xl:table-cell text-right">
                      {project.dueDate ? (
                        <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {isOverdue && <span className="mr-1">⚠</span>}
                          {formatDate(project.dueDate)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums w-7 text-right">{project.progress}%</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3.5 text-right">
                      <button
                        onClick={(e) => { e.preventDefault(); setDeleteProject(project); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="px-4 py-3 bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {sorted.length} of {projects?.length ?? 0} projects
            </p>
          </div>
        </div>
      )}

      <DeleteProjectDialog
        project={deleteProject}
        onClose={() => setDeleteProject(null)}
        onSuccess={refetch}
      />
    </div>
  );
}
