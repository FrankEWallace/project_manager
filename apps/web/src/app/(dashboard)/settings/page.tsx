"use client";

import * as React from "react";
import { useApi, useMutation } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Check, UserPlus, X, Mail, Users, Tags, Plus, Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { getWorkspaceId } from "@/lib/workspace";
import { AvatarGroup, AvatarGroupTooltip } from "@/components/ui/avatar-group";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  name: string | null;
  email: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  expiresAt: string;
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
  archived: boolean;
  projectCount: number;
  createdAt: string;
}

// ─── Currency options ─────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "MYR", label: "MYR — Malaysian Ringgit" },
  { value: "TZS", label: "TZS — Tanzanian Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CNY", label: "CNY — Chinese Yuan" },
  { value: "BRL", label: "BRL — Brazilian Real" },
  { value: "MXN", label: "MXN — Mexican Peso" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
] as const;

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard() {
  const { data: session } = useSession();
  const { data: members, loading: membersLoading, refetch: refetchMembers } = useApi<Member[]>("/api/invitations/members");
  const { data: invites, loading: invitesLoading, refetch: refetchInvites } = useApi<Invitation[]>("/api/invitations");
  const { mutate: sendInvite, loading: inviting, error: inviteError } = useMutation<{ email: string; role: string }, Invitation>("/api/invitations");

  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "member">("member");
  const [sent, setSent] = React.useState(false);
  const [revoking, setRevoking] = React.useState<string | null>(null);

  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const result = await sendInvite({ email, role });
    if (result) {
      setEmail("");
      setSent(true);
      refetchInvites();
      setTimeout(() => setSent(false), 3000);
    }
  }

  async function handleRevoke(id: string) {
    if (!token || !workspaceId) return;
    setRevoking(id);
    try {
      await apiRequest(`/api/invitations/${id}`, { method: "DELETE", token, workspaceId });
      refetchInvites();
    } finally {
      setRevoking(null);
    }
  }

  const roleBadge = (r: string) => {
    if (r === "owner") return <Badge variant="default">{r}</Badge>;
    if (r === "admin") return <Badge variant="secondary">{r}</Badge>;
    return <Badge variant="outline">{r}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team
        </CardTitle>
        <CardDescription>Manage members and send invitations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Members</p>
            {!membersLoading && (members ?? []).length > 0 && (
              <AvatarGroup className="-space-x-2 h-7">
                {(members ?? []).map((m) => {
                  const initials = (m.name ?? m.email ?? "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <div
                      key={m.id}
                      className="w-7 h-7 rounded-full bg-primary/10 text-primary border-2 border-background flex items-center justify-center text-[10px] font-semibold"
                    >
                      <AvatarGroupTooltip>{m.name ?? m.email ?? "Unknown"} · {m.role}</AvatarGroupTooltip>
                      {initials}
                    </div>
                  );
                })}
              </AvatarGroup>
            )}
          </div>
          {membersLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border">
              {(members ?? []).map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {(m.name ?? m.email ?? "?")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email ?? "—"}</p>
                  </div>
                  {roleBadge(m.role)}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Invite form */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invite someone
          </p>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={inviting || sent}>
              {sent ? <><Check className="h-4 w-4" /> Sent</> : inviting ? "Sending…" : <><UserPlus className="h-4 w-4" /> Invite</>}
            </Button>
          </form>
          {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
        </div>

        {/* Pending invites */}
        {!invitesLoading && (invites ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Pending invitations</p>
            <div className="divide-y divide-border rounded-lg border">
              {(invites ?? []).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revoking === inv.id}
                    onClick={() => handleRevoke(inv.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Workspace Settings Form ──────────────────────────────────────────────────

function WorkspaceSettingsCard({ workspace, onSaved }: { workspace: Workspace; onSaved: () => void }) {
  const [name, setName] = React.useState(workspace.name);
  const [currency, setCurrency] = React.useState(workspace.baseCurrency);
  const [saved, setSaved] = React.useState(false);

  const { mutate, loading } = useMutation<object, Workspace>("/api/workspaces/current", "PATCH");

  const isDirty = name !== workspace.name || currency !== workspace.baseCurrency;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = await mutate({
      name: name !== workspace.name ? name : undefined,
      baseCurrency: currency !== workspace.baseCurrency ? currency : undefined,
    });
    if (result) {
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workspace</CardTitle>
        <CardDescription>Name and default currency for this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Workspace name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Workspace"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Slug</Label>
            <div className="flex items-center gap-2">
              <Input value={workspace.slug} readOnly className="bg-muted text-muted-foreground cursor-default" />
              <Badge variant="secondary" className="shrink-0 text-xs">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Used in URLs. Contact support to change.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Base currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">All financial reports use this currency.</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !isDirty || saved}>
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : loading ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#64748b",
];

interface CategoryFormState {
  name: string;
  color: string;
  icon: string;
  description: string;
}

function CategoryDialog({
  open,
  onClose,
  onSuccess,
  category,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
}) {
  const isEdit = !!category;
  const [form, setForm] = React.useState<CategoryFormState>({
    name: "", color: CATEGORY_COLORS[0]!, icon: "", description: "",
  });

  React.useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        color: category.color,
        icon: category.icon ?? "",
        description: category.description ?? "",
      });
    } else {
      setForm({ name: "", color: CATEGORY_COLORS[0]!, icon: "", description: "" });
    }
  }, [category, open]);

  const { mutate: create, loading: creating } = useMutation<object, Category>("/api/categories");
  const { mutate: update, loading: updating } = useMutation<object, Category>(
    `/api/categories/${category?.id}`,
    "PATCH"
  );
  const loading = creating || updating;

  function set(field: keyof CategoryFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      color: form.color,
      icon: form.icon || undefined,
      description: form.description || undefined,
    };
    const result = isEdit ? await update(payload) : await create(payload);
    if (result) { onSuccess(); onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex gap-3">
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <Input
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="🚀"
                maxLength={2}
                className="w-16 text-center text-lg"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Client Work" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  style={{ backgroundColor: c }}
                  className={[
                    "h-7 w-7 rounded-full transition-transform",
                    form.color.toLowerCase() === c.toLowerCase()
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                      : "hover:scale-110",
                  ].join(" ")}
                  aria-label={`Color ${c}`}
                />
              ))}
              <label className="relative h-7 w-7 rounded-full ring-1 ring-foreground/20 overflow-hidden cursor-pointer" title="Custom color">
                <span
                  className="absolute inset-0"
                  style={{ background: "conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)" }}
                />
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional — what belongs in this category" rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({
  category,
  onClose,
  onSuccess,
}: {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { mutate, loading } = useMutation<object, unknown>(
    `/api/categories/${category?.id}`,
    "DELETE"
  );

  async function handleDelete() {
    const result = await mutate({});
    if (result !== null) { onSuccess(); onClose(); }
  }

  return (
    <Dialog open={!!category} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete category?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{category?.name}</strong> will be deleted.
          {category && category.projectCount > 0
            ? ` ${category.projectCount} project${category.projectCount === 1 ? "" : "s"} will keep their data but become uncategorized.`
            : " This cannot be undone."}
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

function CategoriesCard() {
  const { data: categories, loading, refetch } = useApi<Category[]>("/api/categories");
  const [showAdd, setShowAdd] = React.useState(false);
  const [editCategory, setEditCategory] = React.useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = React.useState<Category | null>(null);
  const [archivingId, setArchivingId] = React.useState<string | null>(null);

  const active = (categories ?? []).filter((c) => !c.archived);
  const archived = (categories ?? []).filter((c) => c.archived);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Categories
          </CardTitle>
          <CardDescription>Organize projects into analytical groups.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : (categories ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Tags className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No categories yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create categories to group and analyze projects.</p>
            <Button size="sm" className="mt-4" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create your first category
            </Button>
          </div>
        ) : (
          <>
            <CategoryList
              items={active}
              onEdit={setEditCategory}
              onDelete={setDeleteCategory}
              onArchiveChange={refetch}
              archivingId={archivingId}
              setArchivingId={setArchivingId}
            />
            {archived.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground pt-1">Archived</p>
                <CategoryList
                  items={archived}
                  onEdit={setEditCategory}
                  onDelete={setDeleteCategory}
                  onArchiveChange={refetch}
                  archivingId={archivingId}
                  setArchivingId={setArchivingId}
                />
              </div>
            )}
          </>
        )}
      </CardContent>

      <CategoryDialog
        open={showAdd || !!editCategory}
        onClose={() => { setShowAdd(false); setEditCategory(null); }}
        onSuccess={refetch}
        category={editCategory}
      />
      <DeleteCategoryDialog
        category={deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onSuccess={refetch}
      />
    </Card>
  );
}

function CategoryList({
  items,
  onEdit,
  onDelete,
  onArchiveChange,
  archivingId,
  setArchivingId,
}: {
  items: Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onArchiveChange: () => void;
  archivingId: string | null;
  setArchivingId: (id: string | null) => void;
}) {
  const { data: session } = useSession();
  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  async function toggleArchive(cat: Category) {
    if (!token || !workspaceId) return;
    setArchivingId(cat.id);
    try {
      await apiRequest(`/api/categories/${cat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: !cat.archived }),
        token,
        workspaceId,
      });
      onArchiveChange();
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="divide-y divide-border rounded-lg border">
      {items.map((cat) => (
        <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 group">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0"
            style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
          >
            {cat.icon || <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium truncate ${cat.archived ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {cat.name}
            </p>
            {cat.description && (
              <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {cat.projectCount} {cat.projectCount === 1 ? "project" : "projects"}
          </Badge>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => toggleArchive(cat)}
              disabled={archivingId === cat.id}
              title={cat.archived ? "Unarchive" : "Archive"}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
            >
              {cat.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onEdit(cat)}
              title="Edit"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(cat)}
              title="Delete"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: workspace, loading, refetch } = useApi<Workspace>("/api/workspaces/current");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your workspace preferences.</p>
      </div>

      <Separator />

      {loading ? (
        <div className="space-y-4">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
        </div>
      ) : workspace ? (
        <div className="space-y-6">
          <WorkspaceSettingsCard workspace={workspace} onSaved={refetch} />

          <CategoriesCard />

          <TeamCard />

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
              <CardDescription>Irreversible actions for this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete workspace</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently remove this workspace and all its data.
                  </p>
                </div>
                <Button variant="destructive" disabled>
                  Delete workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Workspace not found</p>
          <p className="text-sm text-muted-foreground mt-1">Unable to load workspace settings.</p>
        </div>
      )}
    </div>
  );
}
