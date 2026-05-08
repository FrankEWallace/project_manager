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
import { Building2, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
