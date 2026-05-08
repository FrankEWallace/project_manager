"use client";

import * as React from "react";
import { useApi, useMutation } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Mail, Phone, Building2, User, Pencil, Trash2, Search } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Actor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: "client" | "collaborator" | "vendor" | "advisor" | "investor";
  company: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTOR_TYPES = [
  { value: "client", label: "Client" },
  { value: "collaborator", label: "Collaborator" },
  { value: "vendor", label: "Vendor" },
  { value: "advisor", label: "Advisor" },
  { value: "investor", label: "Investor" },
] as const;

const typeColors: Record<string, string> = {
  client: "bg-blue-500/10 text-blue-700",
  collaborator: "bg-green-500/10 text-green-700",
  vendor: "bg-orange-500/10 text-orange-700",
  advisor: "bg-purple-500/10 text-purple-700",
  investor: "bg-yellow-500/10 text-yellow-700",
};

function typeInitials(type: string): string {
  return type[0]?.toUpperCase() ?? "?";
}

function nameInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Actor Form ───────────────────────────────────────────────────────────────

interface ActorFormState {
  name: string;
  email: string;
  phone: string;
  type: string;
  company: string;
  notes: string;
}

const emptyForm: ActorFormState = {
  name: "", email: "", phone: "", type: "client", company: "", notes: "",
};

function ActorDialog({
  open,
  onClose,
  onSuccess,
  actor,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actor?: Actor | null;
}) {
  const isEdit = !!actor;
  const [form, setForm] = React.useState<ActorFormState>(emptyForm);

  React.useEffect(() => {
    if (actor) {
      setForm({
        name: actor.name,
        email: actor.email ?? "",
        phone: actor.phone ?? "",
        type: actor.type,
        company: actor.company ?? "",
        notes: actor.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [actor, open]);

  const { mutate: create, loading: creating } = useMutation<object, Actor>("/api/actors");
  const { mutate: update, loading: updating } = useMutation<object, Actor>(
    `/api/actors/${actor?.id}`,
    "PATCH"
  );
  const loading = creating || updating;

  function set(field: keyof ActorFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      email: form.email || undefined,
      phone: form.phone || undefined,
      company: form.company || undefined,
      notes: form.notes || undefined,
    };
    const result = isEdit ? await update(payload) : await create(payload);
    if (result) { onSuccess(); onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit actor" : "Add actor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Full name" />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTOR_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Optional" />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Optional" />
            </div>

            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes…" rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add actor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteDialog({
  actor,
  onClose,
  onSuccess,
}: {
  actor: Actor | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { mutate, loading } = useMutation<object, unknown>(
    `/api/actors/${actor?.id}`,
    "DELETE"
  );

  async function handleDelete() {
    const result = await mutate({});
    if (result !== null) { onSuccess(); onClose(); }
  }

  return (
    <Dialog open={!!actor} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove actor?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{actor?.name}</strong> will be removed from your workspace directory. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Removing…" : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Actor Card ───────────────────────────────────────────────────────────────

function ActorCard({
  actor,
  onEdit,
  onDelete,
}: {
  actor: Actor;
  onEdit: (a: Actor) => void;
  onDelete: (a: Actor) => void;
}) {
  return (
    <Card className="group">
      <CardContent className="pt-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {nameInitials(actor.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{actor.name}</p>
                {actor.company && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" /> {actor.company}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge className={`text-xs ${typeColors[actor.type] ?? ""}`}>
                  {actor.type}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit(actor)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => onDelete(actor)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              {actor.email && (
                <a
                  href={`mailto:${actor.email}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-3 w-3 shrink-0" />
                  {actor.email}
                </a>
              )}
              {actor.phone && (
                <a
                  href={`tel:${actor.phone}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-3 w-3 shrink-0" />
                  {actor.phone}
                </a>
              )}
            </div>

            {actor.notes && (
              <p className="mt-3 text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2">
                {actor.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActorsPage() {
  const { data: actors, loading, refetch } = useApi<Actor[]>("/api/actors");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [showAdd, setShowAdd] = React.useState(false);
  const [editActor, setEditActor] = React.useState<Actor | null>(null);
  const [deleteActor, setDeleteActor] = React.useState<Actor | null>(null);

  const filtered = React.useMemo(() => {
    if (!actors) return [];
    return actors.filter((a) => {
      const matchSearch = !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.company?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [actors, search, typeFilter]);

  const countByType = React.useMemo(() => {
    const counts: Record<string, number> = {};
    actors?.forEach((a) => { counts[a.type] = (counts[a.type] ?? 0) + 1; });
    return counts;
  }, [actors]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Actors</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Loading…" : `${actors?.length ?? 0} people in your workspace`}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add actor
        </Button>
      </div>

      {/* Type summary strip */}
      {!loading && actors && actors.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="grid grid-cols-5">
            {ACTOR_TYPES.map((t, i) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(typeFilter === t.value ? "all" : t.value)}
                className={[
                  "p-4 text-left transition-colors hover:bg-muted/50",
                  i < 4 ? "border-r border-foreground/10" : "",
                  typeFilter === t.value ? "bg-muted/50" : "",
                ].join(" ")}
              >
                <p className="text-2xl font-bold text-foreground">{countByType[t.value] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.label}s</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company…"
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ACTOR_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((actor) => (
            <ActorCard
              key={actor.id}
              actor={actor}
              onEdit={setEditActor}
              onDelete={setDeleteActor}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">
            {search || typeFilter !== "all" ? "No actors match your filters" : "No actors yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || typeFilter !== "all"
              ? "Try adjusting your search or filter"
              : "Add clients, collaborators, vendors and advisors to your workspace"}
          </p>
          {!search && typeFilter === "all" && (
            <Button className="mt-4" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add your first actor
            </Button>
          )}
        </div>
      )}

      <ActorDialog
        open={showAdd || !!editActor}
        onClose={() => { setShowAdd(false); setEditActor(null); }}
        onSuccess={refetch}
        actor={editActor}
      />

      <DeleteDialog
        actor={deleteActor}
        onClose={() => setDeleteActor(null)}
        onSuccess={refetch}
      />
    </div>
  );
}
