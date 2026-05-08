"use client";

import { use, useState, useCallback } from "react";
import { useApi, useMutation } from "@/hooks/use-api";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import {
  ArrowLeft, TrendingUp, TrendingDown, Clock, CheckCircle2, Circle,
  Plus, Layers, Pencil, Trash2, User, Building2, Mail, Phone,
  UserPlus, MoreHorizontal,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  notes: string | null;
}

interface Actor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  company: string | null;
}

interface ProjectActor {
  id: string;
  actorId: string;
  role: string | null;
  actor: Actor;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["draft", "active", "on_hold", "completed", "cancelled"] as const;
const HEALTH_OPTIONS = ["healthy", "at_risk", "delayed", "blocked"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

const TX_CATEGORIES_INCOME = [
  "client_payment", "grant", "sponsorship", "investment", "refund", "other_income",
] as const;
const TX_CATEGORIES_EXPENSE = [
  "salary", "contractor", "software", "hosting", "hardware", "transport",
  "marketing", "legal", "office", "utilities", "other_expense",
] as const;

const healthColors: Record<string, string> = {
  healthy: "text-green-600 bg-green-500/10",
  at_risk: "text-yellow-700 bg-yellow-500/10",
  delayed: "text-orange-700 bg-orange-500/10",
  blocked: "text-red-700 bg-red-500/10",
};

const phaseStatusColors: Record<string, string> = {
  pending: "text-muted-foreground bg-muted",
  active: "text-blue-700 bg-blue-500/10",
  completed: "text-green-700 bg-green-500/10",
  skipped: "text-muted-foreground bg-muted",
};

const typeColors: Record<string, string> = {
  client: "bg-blue-500/10 text-blue-700",
  collaborator: "bg-green-500/10 text-green-700",
  vendor: "bg-orange-500/10 text-orange-700",
  advisor: "bg-purple-500/10 text-purple-700",
  investor: "bg-yellow-500/10 text-yellow-700",
};

function nameInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Edit Project Dialog ──────────────────────────────────────────────────────

function EditProjectDialog({
  project,
  onClose,
  onSaved,
}: {
  project: ProjectDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    health: project.health,
    priority: project.priority,
    budget: project.budget ?? "",
    dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
    startDate: project.startDate ? project.startDate.slice(0, 10) : "",
    tags: project.tags.join(", "),
  });

  const { mutate, loading } = useMutation<object, ProjectDetail>(`/api/projects/${project.id}`, "PATCH");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await mutate({
      name: form.name,
      description: form.description || undefined,
      status: form.status,
      health: form.health,
      priority: form.priority,
      budget: form.budget ? Number(form.budget) : undefined,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
    if (result) { onSaved(); onClose(); }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Health</Label>
              <Select value={form.health} onValueChange={(v) => set("health", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h}>{h.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Budget</Label>
            <Input type="number" min="0" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Comma-separated: design, frontend, api" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  project,
  phases,
  phasesLoading,
  projectId,
  onRefresh,
}: {
  project: ProjectDetail;
  phases: Phase[] | null;
  phasesLoading: boolean;
  projectId: string;
  onRefresh: () => void;
}) {
  const { data: session } = useSession();
  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [editPhase, setEditPhase] = useState<Phase | null>(null);
  const [deletePhase, setDeletePhase] = useState<Phase | null>(null);
  const [addMilestonePhaseId, setAddMilestonePhaseId] = useState<string | null>(null);
  const [editMilestone, setEditMilestone] = useState<{ phaseId: string; milestone: Milestone } | null>(null);

  const [phaseName, setPhaseName] = useState("");
  const [phaseDesc, setPhaseDesc] = useState("");
  const [phaseDue, setPhaseDue] = useState("");
  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [saving, setSaving] = useState(false);

  async function withSave(fn: () => Promise<void>) {
    setSaving(true);
    try { await fn(); } finally { setSaving(false); }
  }

  async function apiCall(path: string, method: string, body?: object) {
    if (!token || !workspaceId) return;
    return apiRequest(path, { method, body: JSON.stringify(body ?? {}), token, workspaceId });
  }

  async function handleCreatePhase() {
    if (!phaseName.trim()) return;
    await withSave(async () => {
      await apiCall(`/api/projects/${projectId}/phases`, "POST", {
        name: phaseName.trim(),
        description: phaseDesc.trim() || undefined,
        dueDate: phaseDue ? new Date(phaseDue).toISOString() : undefined,
      });
      setAddPhaseOpen(false); setPhaseName(""); setPhaseDesc(""); setPhaseDue("");
      onRefresh();
    });
  }

  async function handleUpdatePhase() {
    if (!editPhase || !phaseName.trim()) return;
    await withSave(async () => {
      await apiCall(`/api/projects/${projectId}/phases/${editPhase.id}`, "PATCH", {
        name: phaseName.trim(),
        description: phaseDesc.trim() || undefined,
        dueDate: phaseDue ? new Date(phaseDue).toISOString() : undefined,
      });
      setEditPhase(null); setPhaseName(""); setPhaseDesc(""); setPhaseDue("");
      onRefresh();
    });
  }

  async function handleDeletePhase() {
    if (!deletePhase) return;
    await withSave(async () => {
      await apiCall(`/api/projects/${projectId}/phases/${deletePhase.id}`, "DELETE");
      setDeletePhase(null);
      onRefresh();
    });
  }

  async function handleCreateMilestone() {
    if (!milestoneName.trim() || !addMilestonePhaseId) return;
    await withSave(async () => {
      await apiCall(`/api/projects/${projectId}/phases/${addMilestonePhaseId}/milestones`, "POST", {
        name: milestoneName.trim(),
        dueDate: milestoneDue ? new Date(milestoneDue).toISOString() : undefined,
      });
      setAddMilestonePhaseId(null); setMilestoneName(""); setMilestoneDue("");
      onRefresh();
    });
  }

  async function handleUpdateMilestone() {
    if (!editMilestone || !milestoneName.trim()) return;
    await withSave(async () => {
      await apiCall(
        `/api/projects/${projectId}/phases/${editMilestone.phaseId}/milestones/${editMilestone.milestone.id}`,
        "PATCH",
        { name: milestoneName.trim(), dueDate: milestoneDue ? new Date(milestoneDue).toISOString() : undefined }
      );
      setEditMilestone(null); setMilestoneName(""); setMilestoneDue("");
      onRefresh();
    });
  }

  async function handleDeleteMilestone(phaseId: string, milestoneId: string) {
    await apiCall(`/api/projects/${projectId}/phases/${phaseId}/milestones/${milestoneId}`, "DELETE");
    onRefresh();
  }

  async function handleToggleMilestone(phaseId: string, milestoneId: string) {
    await apiCall(`/api/projects/${projectId}/phases/${phaseId}/milestones/${milestoneId}/toggle`, "PATCH");
    onRefresh();
  }

  async function handleCompletePhase(phaseId: string) {
    await apiCall(`/api/projects/${projectId}/phases/${phaseId}/complete`, "PATCH");
    onRefresh();
  }

  async function handleReopenPhase(phaseId: string) {
    await apiCall(`/api/projects/${projectId}/phases/${phaseId}/reopen`, "PATCH");
    onRefresh();
  }

  return (
    <div className="space-y-6 pt-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3 text-green-500" /> Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(project.financials.totalIncome, project.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><TrendingDown className="h-3 w-3 text-red-500" /> Expenses</p>
            <p className="text-xl font-bold">{formatCurrency(project.financials.totalExpenses, project.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Net profit</p>
            <p className={`text-xl font-bold ${project.financials.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(project.financials.profit, project.currency)}
            </p>
          </CardContent>
        </Card>
        {project.financials.budget ? (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Budget used</p>
              <p className="text-xl font-bold">{project.financials.budgetUsed}%</p>
              <Progress value={project.financials.budgetUsed ?? 0} className="h-1 mt-1" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Progress</p>
              <p className="text-xl font-bold">{formatPercent(project.progress)}</p>
              <Progress value={project.progress} className="h-1 mt-1" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Phases */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Phases & milestones</h2>
          <Button size="sm" variant="outline" onClick={() => { setPhaseName(""); setPhaseDesc(""); setPhaseDue(""); setAddPhaseOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add phase
          </Button>
        </div>

        {phasesLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : phases && phases.length > 0 ? (
          <div className="space-y-3">
            {phases.map((phase) => (
              <Card key={phase.id} className="group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{phase.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseStatusColors[phase.status]}`}>{phase.status}</span>
                      </div>
                      {phase.description && <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {phase.status === "completed" ? (
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleReopenPhase(phase.id)}>Reopen</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleCompletePhase(phase.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { setEditPhase(phase); setPhaseName(phase.name); setPhaseDesc(phase.description ?? ""); setPhaseDue(phase.dueDate ? phase.dueDate.slice(0, 10) : ""); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => setDeletePhase(phase)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{phase.completedMilestones} / {phase.milestoneCount} milestones</span>
                      {phase.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(phase.dueDate)}</span>}
                    </div>
                    <Progress value={phase.progress} className="h-1.5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1 space-y-0.5">
                  {phase.milestones.map((m) => (
                    <div key={m.id} className="group/m flex items-center gap-3 py-1.5 px-1 rounded-md hover:bg-muted/50">
                      <button onClick={() => handleToggleMilestone(phase.id, m.id)} className="shrink-0">
                        {m.status === "completed"
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <span className={`flex-1 text-sm ${m.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{m.name}</span>
                      {m.dueDate && <span className="text-xs text-muted-foreground shrink-0">{formatDate(m.dueDate)}</span>}
                      <div className="flex items-center gap-1 opacity-0 group-hover/m:opacity-100">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditMilestone({ phaseId: phase.id, milestone: m }); setMilestoneName(m.name); setMilestoneDue(m.dueDate ? m.dueDate.slice(0, 10) : ""); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteMilestone(phase.id, m.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setAddMilestonePhaseId(phase.id); setMilestoneName(""); setMilestoneDue(""); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 px-1 mt-1">
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Phase Dialog */}
      <Dialog open={addPhaseOpen} onOpenChange={setAddPhaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add phase</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name</Label><Input placeholder="e.g. Discovery, Launch…" value={phaseName} onChange={(e) => setPhaseName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description (optional)</Label><Textarea rows={2} value={phaseDesc} onChange={(e) => setPhaseDesc(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Due date (optional)</Label><Input type="date" value={phaseDue} onChange={(e) => setPhaseDue(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPhaseOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePhase} disabled={saving || !phaseName.trim()}>{saving ? "Adding…" : "Add phase"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phase Dialog */}
      <Dialog open={!!editPhase} onOpenChange={(v) => !v && setEditPhase(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit phase</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name</Label><Input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description (optional)</Label><Textarea rows={2} value={phaseDesc} onChange={(e) => setPhaseDesc(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Due date (optional)</Label><Input type="date" value={phaseDue} onChange={(e) => setPhaseDue(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPhase(null)}>Cancel</Button>
            <Button onClick={handleUpdatePhase} disabled={saving || !phaseName.trim()}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Phase Dialog */}
      <Dialog open={!!deletePhase} onOpenChange={(v) => !v && setDeletePhase(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete phase?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground"><strong className="text-foreground">{deletePhase?.name}</strong> and all its milestones will be permanently deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePhase(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePhase} disabled={saving}>{saving ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={!!addMilestonePhaseId} onOpenChange={(v) => !v && setAddMilestonePhaseId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add milestone</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name</Label><Input placeholder="e.g. Design approved" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Due date (optional)</Label><Input type="date" value={milestoneDue} onChange={(e) => setMilestoneDue(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMilestonePhaseId(null)}>Cancel</Button>
            <Button onClick={handleCreateMilestone} disabled={saving || !milestoneName.trim()}>{saving ? "Adding…" : "Add milestone"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Milestone Dialog */}
      <Dialog open={!!editMilestone} onOpenChange={(v) => !v && setEditMilestone(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit milestone</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name</Label><Input value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Due date (optional)</Label><Input type="date" value={milestoneDue} onChange={(e) => setMilestoneDue(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMilestone(null)}>Cancel</Button>
            <Button onClick={handleUpdateMilestone} disabled={saving || !milestoneName.trim()}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Financials Tab ───────────────────────────────────────────────────────────

function FinancialsTab({ projectId, currency }: { projectId: string; currency: string }) {
  const { data: transactions, loading, refetch } = useApi<Transaction[]>(`/api/projects/${projectId}/transactions`);
  const { data: actors } = useApi<Actor[]>("/api/actors");

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "client_payment",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    actorId: "",
    notes: "",
  });

  const { mutate: createTx, loading: creating } = useMutation<object, Transaction>(
    `/api/projects/${projectId}/transactions`
  );

  function set(field: string, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "type") {
        updated.category = value === "income" ? "client_payment" : "salary";
      }
      return updated;
    });
  }

  async function handleAddTx(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    const result = await createTx({
      type: form.type,
      category: form.category,
      description: form.description,
      amount,
      currency,
      normalizedAmount: amount,
      date: new Date(form.date).toISOString(),
      actorId: form.actorId || undefined,
      notes: form.notes || undefined,
    });
    if (result) { setAddOpen(false); setForm({ type: "income", category: "client_payment", description: "", amount: "", date: new Date().toISOString().slice(0, 10), actorId: "", notes: "" }); refetch(); }
  }

  const { mutate: deleteTx } = useMutation<object, unknown>(`/api/projects/${projectId}/transactions/placeholder`, "DELETE");
  const { data: session } = useSession();
  const workspaceId = getWorkspaceId();

  async function handleDelete(txId: string) {
    if (!session?.session?.token || !workspaceId) return;
    await apiRequest(`/api/projects/${projectId}/transactions/${txId}`, {
      method: "DELETE",
      body: "{}",
      token: session.session.token,
      workspaceId,
    });
    refetch();
  }

  const categories = form.type === "income" ? TX_CATEGORIES_INCOME : TX_CATEGORIES_EXPENSE;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Transactions</h2>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add transaction
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : transactions && transactions.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="group flex items-center gap-4 px-4 py-3">
                  <div className={`w-1.5 h-8 rounded-full shrink-0 ${tx.type === "income" ? "bg-green-500" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.category.replace(/_/g, " ")} · {formatDate(tx.date)}</p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount), tx.currency)}
                  </p>
                  <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(tx.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add transaction</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTx} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input required value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount</Label><Input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
            </div>
            {actors && actors.length > 0 && (
              <div className="space-y-1.5">
                <Label>Actor (optional)</Label>
                <Select value={form.actorId} onValueChange={(v) => set("actorId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select actor…" /></SelectTrigger>
                  <SelectContent>
                    {actors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5"><Label>Notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Adding…" : "Add transaction"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Actors Tab ───────────────────────────────────────────────────────────────

function ActorsTab({ projectId }: { projectId: string }) {
  const { data: projectActorsList, loading, refetch } = useApi<ProjectActor[]>(`/api/projects/${projectId}/actors`);
  const { data: allActors } = useApi<Actor[]>("/api/actors");
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedActorId, setSelectedActorId] = useState("");
  const [role, setRole] = useState("");
  const { mutate: linkActor, loading: linking } = useMutation<object, ProjectActor>(`/api/projects/${projectId}/actors`);

  const { data: session } = useSession();
  const workspaceId = getWorkspaceId();

  const linkedIds = new Set(projectActorsList?.map((pa) => pa.actorId) ?? []);
  const available = allActors?.filter((a) => !linkedIds.has(a.id)) ?? [];

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedActorId) return;
    const result = await linkActor({ actorId: selectedActorId, role: role || undefined });
    if (result) { setLinkOpen(false); setSelectedActorId(""); setRole(""); refetch(); }
  }

  async function handleUnlink(actorId: string) {
    if (!session?.session?.token || !workspaceId) return;
    await apiRequest(`/api/projects/${projectId}/actors/${actorId}`, {
      method: "DELETE",
      body: "{}",
      token: session.session.token,
      workspaceId,
    });
    refetch();
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Linked actors</h2>
        {available.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Link actor
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : projectActorsList && projectActorsList.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {projectActorsList.map((pa) => (
            <Card key={pa.id} className="group">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {nameInitials(pa.actor.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{pa.actor.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge className={`text-xs ${typeColors[pa.actor.type] ?? ""}`}>{pa.actor.type}</Badge>
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => handleUnlink(pa.actorId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {pa.role && <p className="text-xs text-muted-foreground mt-0.5">{pa.role}</p>}
                    {pa.actor.company && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3" />{pa.actor.company}</p>}
                    {pa.actor.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{pa.actor.email}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No actors linked yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Link clients, collaborators, or vendors to this project.</p>
            {available.length > 0 && (
              <Button size="sm" className="mt-4" onClick={() => setLinkOpen(true)}>
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Link actor
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Link actor</DialogTitle></DialogHeader>
          <form onSubmit={handleLink} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Actor</Label>
              <Select value={selectedActorId} onValueChange={setSelectedActorId} required>
                <SelectTrigger><SelectValue placeholder="Select actor…" /></SelectTrigger>
                <SelectContent>
                  {available.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role on this project (optional)</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Lead client, PM, Designer" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setLinkOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={linking || !selectedActorId}>{linking ? "Linking…" : "Link actor"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [editOpen, setEditOpen] = useState(false);

  const { data: project, loading, refetch: refetchProject } = useApi<ProjectDetail>(`/api/projects/${id}`);
  const { data: phases, loading: phasesLoading, refetch: refetchPhases } = useApi<Phase[]>(`/api/projects/${id}/phases`);

  const onRefresh = useCallback(() => {
    refetchPhases();
    refetchProject();
  }, [refetchPhases, refetchProject]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge>{project.status.replace("_", " ")}</Badge>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${healthColors[project.health]}`}>
              {project.health.replace("_", " ")}
            </span>
            <Badge variant="secondary">{project.priority}</Badge>
          </div>
          {project.description && <p className="text-muted-foreground text-sm mt-1">{project.description}</p>}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {project.tags.map((tag) => (
              <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
          {(project.startDate || project.dueDate) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
              <Clock className="h-3.5 w-3.5" />
              {project.startDate && formatDate(project.startDate)}
              {project.startDate && project.dueDate && " → "}
              {project.dueDate && formatDate(project.dueDate)}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
        </Button>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="actors">Actors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            project={project}
            phases={phases}
            phasesLoading={phasesLoading}
            projectId={id}
            onRefresh={onRefresh}
          />
        </TabsContent>

        <TabsContent value="financials">
          <FinancialsTab projectId={id} currency={project.currency} />
        </TabsContent>

        <TabsContent value="actors">
          <ActorsTab projectId={id} />
        </TabsContent>
      </Tabs>

      {editOpen && (
        <EditProjectDialog
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={refetchProject}
        />
      )}
    </div>
  );
}
