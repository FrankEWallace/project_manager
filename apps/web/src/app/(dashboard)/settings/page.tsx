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
import { Building2, Check, UserPlus, X, Mail, Users } from "lucide-react";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: workspace, loading, refetch } = useApi<Workspace>("/api/workspaces/current");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
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
