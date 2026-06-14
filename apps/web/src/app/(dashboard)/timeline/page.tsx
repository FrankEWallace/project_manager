"use client";

import * as React from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, GanttChartSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  status: string;
  health: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const healthBar: Record<string, string> = {
  healthy: "bg-green-500",
  at_risk: "bg-yellow-500",
  delayed: "bg-orange-500",
  blocked: "bg-red-500",
};

const healthText: Record<string, string> = {
  healthy: "text-green-700 bg-green-500/10",
  at_risk: "text-yellow-700 bg-yellow-500/10",
  delayed: "text-orange-700 bg-orange-500/10",
  blocked: "text-red-700 bg-red-500/10",
};

const statusText: Record<string, string> = {
  draft: "text-muted-foreground",
  active: "text-foreground",
  on_hold: "text-yellow-700",
  completed: "text-green-700",
  cancelled: "text-muted-foreground line-through",
};

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Roadmap (Gantt) View ─────────────────────────────────────────────────────

function RoadmapView({ projects }: { projects: Project[] }) {
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Window: 3 months back → 9 months forward = 13 months
  const [windowStart, setWindowStart] = React.useState(() => addMonths(today, -3));
  const MONTHS_SHOWN = 13;

  const months = React.useMemo(() => {
    return Array.from({ length: MONTHS_SHOWN }, (_, i) => addMonths(windowStart, i));
  }, [windowStart]);

  const windowEnd = React.useMemo(() => {
    const last = months[months.length - 1]!;
    return new Date(last.getFullYear(), last.getMonth() + 1, 0, 23, 59, 59);
  }, [months]);

  // Total days in the visible window
  const totalDays = React.useMemo(
    () => (windowEnd.getTime() - windowStart.getTime()) / 86_400_000,
    [windowStart, windowEnd]
  );

  function pct(date: Date) {
    const clamped = Math.max(windowStart.getTime(), Math.min(windowEnd.getTime(), date.getTime()));
    return ((clamped - windowStart.getTime()) / (windowEnd.getTime() - windowStart.getTime())) * 100;
  }

  const todayPct = pct(today);

  const projectsWithDates = projects.filter((p) => p.startDate || p.dueDate);
  const projectsWithout = projects.filter((p) => !p.startDate && !p.dueDate);

  return (
    <div className="space-y-4">
      {/* Nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setWindowStart((w) => addMonths(w, -3))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[160px] text-center">
          {MONTH_NAMES[windowStart.getMonth()]} {windowStart.getFullYear()} –{" "}
          {MONTH_NAMES[windowEnd.getMonth()]} {windowEnd.getFullYear()}
        </span>
        <Button variant="outline" size="sm" onClick={() => setWindowStart((w) => addMonths(w, 3))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="ml-2 text-xs" onClick={() => setWindowStart(addMonths(today, -3))}>
          Today
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-border/50 bg-card shadow-sm">
        <div style={{ minWidth: 900 }}>
          {/* Month header */}
          <div className="flex border-b">
            <div className="w-52 shrink-0 border-r px-3 py-2 text-xs font-medium text-muted-foreground">Project</div>
            <div className="relative flex-1 flex">
              {months.map((m) => {
                const days = daysInMonth(m.getFullYear(), m.getMonth());
                const widthPct = (days / totalDays) * 100;
                return (
                  <div
                    key={m.toISOString()}
                    className="border-r px-2 py-2 text-xs font-medium text-muted-foreground shrink-0 text-center"
                    style={{ width: `${widthPct}%` }}
                  >
                    {MONTH_NAMES[m.getMonth()]} {m.getFullYear()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {projectsWithDates.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              No projects with dates to display.
            </div>
          ) : (
            projectsWithDates.map((project) => {
              const start = project.startDate ? new Date(project.startDate) : today;
              const end = project.dueDate ? new Date(project.dueDate) : start;
              const left = pct(start);
              const right = pct(end);
              const width = Math.max(right - left, 0.5);
              const barColor = healthBar[project.health] ?? "bg-primary";

              return (
                <div key={project.id} className="flex border-b last:border-b-0 group hover:bg-muted/30 transition-colors">
                  <div className="w-52 shrink-0 border-r px-3 py-3 flex flex-col justify-center">
                    <Link href={`/projects/${project.id}`} className="text-sm font-medium hover:underline truncate">
                      {project.name}
                    </Link>
                    <span className={cn("text-xs mt-0.5", statusText[project.status])}>
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  {/* Bar area */}
                  <div className="relative flex-1 py-3 px-1">
                    {/* Today line */}
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                        style={{ left: `${todayPct}%` }}
                      />
                    )}
                    {/* Month grid lines */}
                    {months.map((m) => {
                      const days = daysInMonth(m.getFullYear(), m.getMonth());
                      const lineLeft = pct(m);
                      return (
                        <div
                          key={m.toISOString()}
                          className="absolute top-0 bottom-0 w-px bg-border/50"
                          style={{ left: `${lineLeft}%` }}
                        />
                      );
                    })}
                    {/* Project bar */}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-6 rounded-full flex items-center px-2 z-20 cursor-pointer",
                        barColor,
                        "opacity-90 hover:opacity-100"
                      )}
                      style={{ left: `${left}%`, width: `${width}%`, minWidth: 8 }}
                      title={`${project.name} · ${project.progress}% complete`}
                    >
                      {width > 4 && (
                        <span className="text-white text-xs font-medium truncate leading-none">
                          {project.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Projects without dates */}
      {projectsWithout.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">No dates set</p>
          <div className="flex flex-wrap gap-2">
            {projectsWithout.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  {p.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        {Object.entries(healthBar).map(([key, cls]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-full", cls)} />
            {key.replace("_", " ")}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-px bg-primary/40" />
          Today
        </span>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date());

  // Build a map of date-string → projects active/due on that day
  const projectsByDate = React.useMemo(() => {
    const map: Record<string, Project[]> = {};
    for (const p of projects) {
      if (!p.dueDate && !p.startDate) continue;
      const start = p.startDate ? new Date(p.startDate) : null;
      const end = p.dueDate ? new Date(p.dueDate) : start;
      if (!start && !end) continue;

      // Mark every day from start to end (capped at 90 days to avoid perf issues)
      const from = start ?? end!;
      const to = end ?? start!;
      const diffDays = Math.min(90, Math.round((to.getTime() - from.getTime()) / 86_400_000));

      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key]!.push(p);
      }
    }
    return map;
  }, [projects]);

  const selectedKey = selected?.toISOString().slice(0, 10) ?? "";
  const selectedProjects = projectsByDate[selectedKey] ?? [];

  // Dates that have projects (for dot indicators)
  const activeDates = React.useMemo(() => new Set(Object.keys(projectsByDate)), [projectsByDate]);

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      {/* Calendar */}
      <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border/50 p-4 w-full lg:w-auto shrink-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          className="w-full"
          modifiers={{ hasProject: (date) => activeDates.has(date.toISOString().slice(0, 10)) }}
          modifiersClassNames={{ hasProject: "font-bold underline decoration-primary decoration-2 underline-offset-2" }}
          classNames={{
            day_button: "!ring-0 !ring-offset-0 focus:!ring-0 focus-visible:!ring-0",
          }}
        />
      </div>

      {/* Event list */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {selected?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <Badge variant="secondary">{selectedProjects.length} project{selectedProjects.length !== 1 ? "s" : ""}</Badge>
        </div>
        {selectedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No projects on this date.</p>
            <p className="text-xs text-muted-foreground mt-1">Dates with projects are underlined on the calendar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className={cn("w-1 self-stretch rounded-full shrink-0", healthBar[p.health] ?? "bg-muted")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{p.status.replace("_", " ")}</span>
                      {p.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          · due {new Date(p.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">{p.progress}%</p>
                    <div className="w-12 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", healthBar[p.health] ?? "bg-primary")}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = "roadmap" | "calendar";

export default function TimelinePage() {
  const { data: projects, loading } = useApi<Project[]>("/api/projects");
  const [view, setView] = React.useState<View>("roadmap");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Loading…" : `${projects?.length ?? 0} projects`}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/30">
          <button
            onClick={() => setView("roadmap")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              view === "roadmap" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GanttChartSquare className="h-4 w-4" /> Roadmap
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              view === "calendar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4" /> Calendar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : view === "roadmap" ? (
        <RoadmapView projects={projects ?? []} />
      ) : (
        <CalendarView projects={projects ?? []} />
      )}
    </div>
  );
}
