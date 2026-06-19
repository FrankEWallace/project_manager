"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { useApi, useMutation } from "@/hooks/use-api";
import { useSession } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";
import { getWorkspaceId } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  InvoicePreview,
  buildInvoicePrintHTML,
  type InvoicePreviewData,
  type PreviewSettings,
} from "@/components/invoices/invoice-preview";
import { ArrowLeft, Plus, Trash2, Download, PackagePlus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Actor { id: string; name: string; company: string | null; email: string | null; }
interface Project { id: string; name: string; }
interface InvoiceSettings {
  invoicePrefix: string;
  companyName: string | null;
  companyAddress: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  paymentDetails: string | null;
  defaultTaxRate: string;
  defaultPaymentTermsDays: number;
}
interface FormItem { _key: string; description: string; details: string; quantity: number; rate: number; }
interface ImportItem { sourceId: string; description: string; details: string | null; }

const CURRENCIES = ["USD", "EUR", "GBP", "MYR", "TZS", "NGN", "KES", "GHS", "ZAR", "INR", "AUD", "CAD", "SGD", "AED", "SAR"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const workspaceId = getWorkspaceId();

  const { data: actors } = useApi<Actor[]>("/api/actors");
  const { data: projects } = useApi<Project[]>("/api/projects");
  const { data: settings } = useApi<InvoiceSettings | null>("/api/invoices/settings");

  const defaultTerms = settings?.defaultPaymentTermsDays ?? 30;

  const [actorId, setActorId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [issueDate, setIssueDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = React.useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [taxRate, setTaxRate] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<FormItem[]>([
    { _key: crypto.randomUUID(), description: "", details: "", quantity: 1, rate: 0 },
  ]);
  const [importLoading, setImportLoading] = React.useState(false);

  // Update defaults when settings load
  React.useEffect(() => {
    if (!settings) return;
    setTaxRate(Number(settings.defaultTaxRate));
    setDueDate(format(addDays(new Date(), settings.defaultPaymentTermsDays), "yyyy-MM-dd"));
  }, [settings]);

  const { mutate, loading } = useMutation<object, { id: string }>("/api/invoices");

  // Computed
  const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const selectedActor = actors?.find((a) => a.id === actorId);

  const previewData: InvoicePreviewData = {
    invoiceNumber: `${settings?.invoicePrefix ?? "INV"}-???`,
    issueDate: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
    dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
    currency,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes: notes || null,
    actor: selectedActor
      ? { name: selectedActor.name, email: selectedActor.email, company: selectedActor.company }
      : { name: "Select a client…" },
    items: items.map((i) => ({
      description: i.description || "Service item",
      details: i.details || null,
      quantity: i.quantity,
      rate: i.rate,
      amount: i.quantity * i.rate,
    })),
  };

  const previewSettings: PreviewSettings = {
    companyName: settings?.companyName,
    companyAddress: settings?.companyAddress,
    companyEmail: settings?.companyEmail,
    companyPhone: settings?.companyPhone,
    paymentDetails: settings?.paymentDetails,
  };

  // Line item helpers
  function addItem() {
    setItems((p) => [...p, { _key: crypto.randomUUID(), description: "", details: "", quantity: 1, rate: 0 }]);
  }
  function removeItem(key: string) {
    setItems((p) => p.filter((i) => i._key !== key));
  }
  function updateItem(key: string, field: keyof Omit<FormItem, "_key">, value: string | number) {
    setItems((p) => p.map((i) => i._key === key ? { ...i, [field]: value } : i));
  }

  // Import done tasks + milestones from selected project
  async function handleImport() {
    if (!projectId || !session?.session?.token) return;
    setImportLoading(true);
    try {
      const res = await apiRequest<{ data: { tasks: ImportItem[]; milestones: ImportItem[] } }>(
        `/api/invoices/import-items/${projectId}`,
        { token: session.session.token, workspaceId: workspaceId ?? undefined }
      );
      const imported: FormItem[] = [
        ...res.data.tasks,
        ...res.data.milestones,
      ].map((item) => ({
        _key: crypto.randomUUID(),
        description: item.description,
        details: item.details ?? "",
        quantity: 1,
        rate: 0,
      }));
      setItems((p) => [...p, ...imported]);
    } catch {}
    setImportLoading(false);
  }

  async function handleSave() {
    if (!actorId || items.length === 0) return;
    const result = await mutate({
      actorId,
      projectId: projectId || undefined,
      currency,
      normalizedTotal: total,
      taxRate,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
      items: items.map((item, idx) => ({
        description: item.description,
        details: item.details || undefined,
        quantity: item.quantity,
        rate: item.rate,
        sortOrder: idx,
      })),
    });
    if (result) router.push(`/finances/invoices/${result.id}`);
  }

  function handleExport() {
    const html = buildInvoicePrintHTML(previewData, previewSettings);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link href="/finances"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">New invoice</h1>
            <p className="text-xs text-muted-foreground">Fill in the details and preview before saving</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || !actorId || items.length === 0}>
            {loading ? "Saving…" : "Save draft"}
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form */}
        <div className="space-y-5">
          {/* Client & project */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Invoice details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Client <span className="text-destructive">*</span></Label>
                <Select value={actorId} onValueChange={setActorId}>
                  <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
                  <SelectContent>
                    {(actors ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.company ? `${a.company} (${a.name})` : a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Project (optional)</Label>
                <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Link to project…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(projects ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Issue date</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tax rate (%)</Label>
                  <Input
                    type="number" min="0" max="100" step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, additional info…"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Line items</CardTitle>
                {projectId && (
                  <Button
                    size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                    onClick={handleImport} disabled={importLoading}
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    {importLoading ? "Importing…" : "Import from project"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
                <span className="col-span-5">Description</span>
                <span className="col-span-2">Details</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-1" />
              </div>

              {items.map((item) => (
                <div key={item._key} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5 h-8 text-sm"
                    placeholder="Service or product"
                    value={item.description}
                    onChange={(e) => updateItem(item._key, "description", e.target.value)}
                  />
                  <Input
                    className="col-span-2 h-8 text-sm"
                    placeholder="Detail"
                    value={item.details}
                    onChange={(e) => updateItem(item._key, "details", e.target.value)}
                  />
                  <Input
                    className="col-span-2 h-8 text-sm text-right"
                    type="number" min="0.01" step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item._key, "quantity", Number(e.target.value))}
                  />
                  <Input
                    className="col-span-2 h-8 text-sm text-right"
                    type="number" min="0" step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(item._key, "rate", Number(e.target.value))}
                  />
                  <Button
                    size="sm" variant="ghost"
                    className="col-span-1 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item._key)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" size="sm" className="w-full mt-1 border-dashed" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add line item
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-white">
            <InvoicePreview invoice={previewData} settings={previewSettings} />
          </div>
        </div>
      </div>
    </div>
  );
}
