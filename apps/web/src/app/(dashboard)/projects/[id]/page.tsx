"use client";

import { use, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { getWorkspaceId } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import {
  ArrowLeft, TrendingUp, TrendingDown, Clock,
  CheckCircle2, Circle, Plus, Layers,
} from "lucide-react";
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

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  status: "open" | "completed";
  dueDate: string | null;
  assignedTo: string | null;
}

interface Phase {
  id: string;
  name: string;
  description: string | null;
  status: "pending" | "active" | "completed" | "skipped";
  order: number;
  dueDate: string | null;
  progress: number;
  milestoneCount: number;
  completedMilestones: number;
  milestones: Milestone[];
}

const healthColors: Record<string, string> = {
  healthy: "text-green-600 bg-green-50",
  at_risk: "text-yellow-700 bg-yellow-50",
  delayed: "text-orange-700 bg-orange-50",
  blocked: "text-red-700 bg-red-50",
};

const phaseStatusColors: Record<string, string> = {
  pending: "text-gray-600 bg-gray-100",
  active: "text-blue-700 bg-blue-50",
  completed: "text-green-700 bg-green-50",
  skipped: "text-gray-400 bg-gray-50",
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();

  const { data: project, loading, refetch: refetchProject } = useApi<ProjectDetail>(`/api/projects/${id}`);
  const { data: phases, loading: phasesLoading, refetch: refetchPhases } = useApi<Phase[]>(`/api/projects/${id}/phases`);

  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [phaseName, setPhaseName] = useState("");
  const [phaseDesc, setPhaseDesc] = useState("");
  const [phaseDue, setPhaseDue] = useState("");

  const [addMilestonePhaseId, setAddMilestonePhaseId] = useState<string | null>(null);
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");

  const [saving, setSaving] = useState(false);

  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  async function withSave(fn: () => Promise<void>) {
    setSaving(true);
    try { await fn(); } finally { setSaving(false); }
  }

  async function handleCreatePhase() {
    if (!phaseName.trim() || !token || !workspaceId) return;
    await withSave(async () => {
      await apiRequest(`/api/projects/${id}/phases`, {
        method: "POST",
        body: JSON.stringify({
          name: phaseName.trim(),
          description: phaseDesc.trim() || undefined,
          dueDate: phaseDue ? new Date(phaseDue).toISOString() : undefined,
        }),
        token,
        workspaceId,
      });
      setAddPhaseOpen(false);
      setPhaseName("");
      setPhaseDesc("");
      setPhaseDue("");
      refetchPhases();
      refetchProject();
    });
  }

  async function handleCreateMilestone() {
    if (!milestoneName.trim() || !addMilestonePhaseId || !token || !workspaceId) return;
    await withSave(async () => {
      await apiRequest(`/api/projects/${id}/phases/${addMilestonePhaseId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          name: milestoneName.trim(),
          dueDate: milestoneDue ? new Date(milestoneDue).toISOString() : undefined,
        }),
        token,
        workspaceId,
      });
      setAddMilestonePhaseId(null);
      setMilestoneName("");
      setMilestoneDue("");
      refetchPhases();
      refetchProject();
    });
  }

  async function handleToggleMilestone(phaseId: string, milestoneId: string) {
    if (!token || !workspaceId) return;
    await apiRequest(`/api/projects/${id}/phases/${phaseId}/milestones/${milestoneId}/toggle`, {
      method: "PATCH",
      body: "{}",
      token,
      workspaceId,
    });
    refetchPhases();
    refetchProject();
  }

  async function handleCompletePhase(phaseId: string) {
    if (!token || !workspaceId) return;
    await apiRequest(`/api/projects/${id}/phases/${phaseId}/complete`, {
      method: "PATCH",
      body: "{}",
      token,
      workspaceId,
    });
    refetchPhases();
    refetchProject();
  }

  async function handleReopenPhase(phaseId: string) {
    if (!token || !workspaceId) return;
    await apiRequest(`/api/projects/${id}/phases/${phaseId}/reopen`, {
      method: "PATCH",
      body: "{}",
      token,
      workspaceId,
    });
    refetchPhases();
    refetchProject();
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/projects"
          className="text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
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
              <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {tag}
              </span>
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

      {/* Phases & Milestones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Phases & milestones</h2>
          <Button size="sm" onClick={() => setAddPhaseOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add phase
          </Button>
        </div>

        {phasesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : phases && phases.length > 0 ? (
          <div className="space-y-4">
            {phases.map((phase) => (
              <Card key={phase.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{phase.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${phaseStatusColors[phase.status]}`}>
                          {phase.status}
                        </span>
                      </div>
                      {phase.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {phase.status === "completed" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => handleReopenPhase(phase.id)}
                        >
                          Reopen
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => handleCompletePhase(phase.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{phase.completedMilestones} / {phase.milestoneCount} milestones</span>
                      {phase.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(phase.dueDate)}
                        </span>
                      )}
                    </div>
                    <Progress value={phase.progress} className="h-1.5" />
                  </div>
                </CardHeader>

                <CardContent className="pt-1 space-y-0.5">
                  {phase.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleMilestone(phase.id, milestone.id)}
                        className="shrink-0 transition-colors"
                        aria-label={milestone.status === "completed" ? "Mark open" : "Mark complete"}
                      >
                        {milestone.status === "completed"
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <span className={`flex-1 text-sm ${milestone.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {milestone.name}
                      </span>
                      {milestone.dueDate && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(milestone.dueDate)}
                        </span>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setAddMilestonePhaseId(phase.id);
                      setMilestoneName("");
                      setMilestoneDue("");
                    }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 px-1 transition-colors mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add milestone
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">No phases yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add a phase to start tracking progress.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Phase Dialog */}
      <Dialog open={addPhaseOpen} onOpenChange={setAddPhaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="phase-name">Name</Label>
              <Input
                id="phase-name"
                placeholder="e.g. Discovery, Development, Launch"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePhase()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phase-desc">Description (optional)</Label>
              <Textarea
                id="phase-desc"
                placeholder="What happens in this phase?"
                value={phaseDesc}
                onChange={(e) => setPhaseDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phase-due">Due date (optional)</Label>
              <Input
                id="phase-due"
                type="date"
                value={phaseDue}
                onChange={(e) => setPhaseDue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPhaseOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePhase} disabled={saving || !phaseName.trim()}>
              {saving ? "Adding…" : "Add phase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog
        open={addMilestonePhaseId !== null}
        onOpenChange={(open) => { if (!open) setAddMilestonePhaseId(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="milestone-name">Name</Label>
              <Input
                id="milestone-name"
                placeholder="e.g. Design approved, API complete"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateMilestone()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="milestone-due">Due date (optional)</Label>
              <Input
                id="milestone-due"
                type="date"
                value={milestoneDue}
                onChange={(e) => setMilestoneDue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMilestonePhaseId(null)}>Cancel</Button>
            <Button onClick={handleCreateMilestone} disabled={saving || !milestoneName.trim()}>
              {saving ? "Adding…" : "Add milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
