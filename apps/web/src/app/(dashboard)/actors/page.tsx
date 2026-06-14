"use client";

import * as React from "react";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Mail, Phone, Building2, User, Pencil, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortKey = "name" | "type" | "company";
type SortDir = "asc" | "desc";

function SortIcon({ col, active, dir }: { col: string; active: SortKey; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return dir === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActorsPage() {
  const { data: actors, loading, refetch } = useApi<Actor[]>("/api/actors");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [showAdd, setShowAdd] = React.useState(false);
  const [editActor, setEditActor] = React.useState<Actor | null>(null);
  const [deleteActor, setDeleteActor] = React.useState<Actor | null>(null);
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = React.useMemo(() => {
    if (!actors) return [];
    const list = actors.filter((a) => {
      const matchSearch = !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.company?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || a.type === typeFilter;
      return matchSearch && matchType;
    });
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "type") cmp = a.type.localeCompare(b.type);
      else if (sortKey === "company") cmp = (a.company ?? "").localeCompare(b.company ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [actors, search, typeFilter, sortKey, sortDir]);

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
        <div className="grid grid-cols-5 gap-3">
            {ACTOR_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(typeFilter === t.value ? "all" : t.value)}
                className={[
                  "p-4 text-left transition-colors rounded-2xl",
                  typeFilter === t.value ? "bg-primary/10 ring-1 ring-primary/20" : "bg-muted/40 hover:bg-muted/60",
                ].join(" ")}
              >
                <p className="text-2xl font-bold text-foreground">{countByType[t.value] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.label}s</p>
              </button>
            ))}
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

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl overflow-hidden bg-card shadow-sm ring-1 ring-border/50">
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border/50 flex flex-col items-center justify-center py-20 text-center">
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
      ) : (
        <div className="rounded-2xl overflow-hidden bg-card shadow-sm ring-1 ring-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                {(["name", "type", "company"] as SortKey[]).map((key) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-xs font-medium text-muted-foreground text-left whitespace-nowrap"
                  >
                    <button
                      onClick={() => handleSort(key)}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors capitalize"
                    >
                      {key}
                      <SortIcon col={key} active={sortKey} dir={sortDir} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-left hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-left hidden lg:table-cell">Notes</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((actor) => (
                <tr key={actor.id} className="hover:bg-muted/40 transition-colors group border-t border-border/30 first:border-t-0">
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {nameInitials(actor.name)}
                      </div>
                      <span className="font-medium text-foreground truncate max-w-[160px]">{actor.name}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5">
                    <Badge className={`text-xs ${typeColors[actor.type] ?? ""}`}>
                      {actor.type}
                    </Badge>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3.5">
                    {actor.company ? (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        {actor.company}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      {actor.email && (
                        <a href={`mailto:${actor.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Mail className="h-3 w-3 shrink-0" />
                          {actor.email}
                        </a>
                      )}
                      {actor.phone && (
                        <a href={`tel:${actor.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Phone className="h-3 w-3 shrink-0" />
                          {actor.phone}
                        </a>
                      )}
                      {!actor.email && !actor.phone && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3.5 hidden lg:table-cell max-w-[200px]">
                    {actor.notes ? (
                      <span className="text-xs text-muted-foreground line-clamp-1">{actor.notes}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditActor(actor)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteActor(actor)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {actors?.length ?? 0} actors
            </p>
          </div>
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
