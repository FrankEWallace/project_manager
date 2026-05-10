"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { useApi, useMutation } from "@/hooks/use-api";
import { useSession } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";
import { getWorkspaceId } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Send, Ban, CircleDollarSign, Download, Pencil, Trash2, Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceItem { id: string; description: string; details: string | null; quantity: string; rate: string; amount: string; sortOrder: number; }
interface Actor { id: string; name: string; company: string | null; email: string | null; }
interface Project { id: string; name: string; }
interface Invoice {
  id: string; invoiceNumber: string;
  status: "draft" | "sent" | "partially_paid" | "paid" | "void";
  currency: string; subtotal: string; taxRate: string; taxAmount: string;
  total: string; paidAmount: string; normalizedTotal: string;
  issueDate: string; dueDate: string; notes: string | null;
  paymentDetails: string | null;
  actorId: string; projectId: string | null;
  actor: Actor; project: Project | null;
  items: InvoiceItem[];
}
interface InvoiceSettings {
  invoicePrefix: string; companyName: string | null; companyAddress: string | null;
  companyEmail: string | null; companyPhone: string | null; paymentDetails: string | null;
  defaultTaxRate: string; defaultPaymentTermsDays: number;
}
interface FormItem { _key: string; description: string; details: string; quantity: number; rate: number; }

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Draft", sent: "Sent", partially_paid: "Partially paid", paid: "Paid", void: "Void",
};
const STATUS_CLASSES: Record<Invoice["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  partially_paid: "bg-amber-500/10 text-amber-600",
  paid: "bg-green-500/10 text-green-700",
  void: "bg-muted text-muted-foreground",
};

const CURRENCIES = ["USD", "EUR", "GBP", "MYR", "TZS", "NGN", "KES", "GHS", "ZAR", "INR", "AUD", "CAD", "SGD", "AED", "SAR"];

// ─── Record Payment Dialog ────────────────────────────────────────────────────

function RecordPaymentDialog({ invoice, open, onClose, onSuccess }: {
  invoice: Invoice; open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const remaining = Number(invoice.total) - Number(invoice.paidAmount);
  const [amount, setAmount] = React.useState(remaining.toFixed(2));
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = React.useState("");
  const { mutate, loading } = useMutation<object, unknown>(`/api/invoices/${invoice.id}/payment`);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await mutate({
      amount: Number(amount), currency: invoice.currency,
      normalizedAmount: Number(amount),
      date: new Date(date).toISOString(), notes: notes || undefined,
    });
    if (result !== null) { onSuccess(); onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Record payment — {invoice.invoiceNumber}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Amount ({invoice.currency})</Label>
            <Input type="number" min="0.01" max={remaining.toFixed(2)} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Balance: {formatCurrency(remaining, invoice.currency)}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Bank transfer ref #123" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Record payment"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const workspaceId = getWorkspaceId();

  const { data: invoice, loading, refetch } = useApi<Invoice>(`/api/invoices/${id}`);
  const { data: settings } = useApi<InvoiceSettings | null>("/api/invoices/settings");
  const { data: actors } = useApi<Actor[]>("/api/actors");
  const { data: projects } = useApi<Project[]>("/api/projects");

  const [isEditing, setIsEditing] = React.useState(false);
  const [showPayment, setShowPayment] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Edit form state (initialised from invoice when edit mode opens)
  const [actorId, setActorId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [issueDate, setIssueDate] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [taxRate, setTaxRate] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<FormItem[]>([]);

  const { mutate: saveEdit, loading: saveLoading } = useMutation<object, Invoice>(`/api/invoices/${id}`, "PATCH");

  function openEdit() {
    if (!invoice) return;
    setActorId(invoice.actorId);
    setProjectId(invoice.projectId ?? "");
    setCurrency(invoice.currency);
    setIssueDate(format(new Date(invoice.issueDate), "yyyy-MM-dd"));
    setDueDate(format(new Date(invoice.dueDate), "yyyy-MM-dd"));
    setTaxRate(Number(invoice.taxRate));
    setNotes(invoice.notes ?? "");
    setItems(invoice.items.map((it) => ({
      _key: it.id,
      description: it.description,
      details: it.details ?? "",
      quantity: Number(it.quantity),
      rate: Number(it.rate),
    })));
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const taxAmt = subtotal * taxRate / 100;
    const total = subtotal + taxAmt;
    const result = await saveEdit({
      actorId, projectId: projectId || null, currency,
      taxRate, normalizedTotal: total,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
      items: items.map((item, idx) => ({
        description: item.description, details: item.details || undefined,
        quantity: item.quantity, rate: item.rate, sortOrder: idx,
      })),
    });
    if (result) { setIsEditing(false); refetch(); }
  }

  async function callAction(path: string) {
    setActionLoading(true);
    try {
      await apiRequest(path, {
        method: "POST",
        token: session?.session?.token,
        workspaceId: workspaceId ?? undefined,
      });
      refetch();
    } finally { setActionLoading(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    await apiRequest(`/api/invoices/${id}`, {
      method: "DELETE",
      token: session?.session?.token,
      workspaceId: workspaceId ?? undefined,
    });
    router.push("/finances");
  }

  function handleExport() {
    if (!invoice || !settings) return;
    const previewData: InvoicePreviewData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate, dueDate: invoice.dueDate,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      paidAmount: Number(invoice.paidAmount),
      notes: invoice.notes,
      actor: { name: invoice.actor.name, email: invoice.actor.email, company: invoice.actor.company },
      items: invoice.items.map((it) => ({
        description: it.description, details: it.details,
        quantity: Number(it.quantity), rate: Number(it.rate), amount: Number(it.amount),
      })),
    };
    const previewSettings: PreviewSettings = {
      companyName: settings.companyName, companyAddress: settings.companyAddress,
      companyEmail: settings.companyEmail, companyPhone: settings.companyPhone,
      paymentDetails: invoice.paymentDetails ?? settings.paymentDetails,
    };
    const html = buildInvoicePrintHTML(previewData, previewSettings);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  }

  // Computed edit totals
  const editSubtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const editTaxAmount = editSubtotal * taxRate / 100;
  const editTotal = editSubtotal + editTaxAmount;
  const selectedActor = actors?.find((a) => a.id === actorId);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/finances">Back to Finances</Link>
        </Button>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    const editPreviewData: InvoicePreviewData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: issueDate ? new Date(issueDate).toISOString() : invoice.issueDate,
      dueDate: dueDate ? new Date(dueDate).toISOString() : invoice.dueDate,
      currency,
      subtotal: editSubtotal, taxRate, taxAmount: editTaxAmount, total: editTotal,
      notes: notes || null,
      actor: selectedActor
        ? { name: selectedActor.name, email: selectedActor.email, company: selectedActor.company }
        : { name: invoice.actor.name, email: invoice.actor.email, company: invoice.actor.company },
      items: items.map((i) => ({
        description: i.description || "Service item", details: i.details || null,
        quantity: i.quantity, rate: i.rate, amount: i.quantity * i.rate,
      })),
    };
    const editSettings: PreviewSettings = {
      companyName: settings?.companyName, companyAddress: settings?.companyAddress,
      companyEmail: settings?.companyEmail, companyPhone: settings?.companyPhone,
      paymentDetails: settings?.paymentDetails,
    };

    function addItem() { setItems((p) => [...p, { _key: crypto.randomUUID(), description: "", details: "", quantity: 1, rate: 0 }]); }
    function removeItem(key: string) { setItems((p) => p.filter((i) => i._key !== key)); }
    function updateItem(key: string, field: keyof Omit<FormItem, "_key">, value: string | number) {
      setItems((p) => p.map((i) => i._key === key ? { ...i, [field]: value } : i));
    }

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
              <p className="text-xs text-muted-foreground">Editing draft</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={saveLoading}>
              {saveLoading ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Invoice details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select value={actorId} onValueChange={setActorId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(actors ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.company ? `${a.company} (${a.name})` : a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Project (optional)</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(projects ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
                <div className="space-y-1.5">
                  <Label>Tax rate (%)</Label>
                  <Input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-32" />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Line items</CardTitle></CardHeader>
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
                    <Input className="col-span-5 h-8 text-sm" value={item.description} onChange={(e) => updateItem(item._key, "description", e.target.value)} />
                    <Input className="col-span-2 h-8 text-sm" value={item.details} onChange={(e) => updateItem(item._key, "details", e.target.value)} />
                    <Input className="col-span-2 h-8 text-sm text-right" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item._key, "quantity", Number(e.target.value))} />
                    <Input className="col-span-2 h-8 text-sm text-right" type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateItem(item._key, "rate", Number(e.target.value))} />
                    <Button size="sm" variant="ghost" className="col-span-1 h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item._key)} disabled={items.length === 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1 border-dashed" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1.5" />Add line item
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-6">
            <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-white">
              <InvoicePreview invoice={editPreviewData} settings={editSettings} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View mode
  const previewData: InvoicePreviewData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate, dueDate: invoice.dueDate,
    currency: invoice.currency,
    subtotal: Number(invoice.subtotal), taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount), total: Number(invoice.total),
    paidAmount: Number(invoice.paidAmount),
    notes: invoice.notes,
    actor: { name: invoice.actor.name, email: invoice.actor.email, company: invoice.actor.company },
    items: invoice.items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((it) => ({
        description: it.description, details: it.details,
        quantity: Number(it.quantity), rate: Number(it.rate), amount: Number(it.amount),
      })),
  };
  const previewSettings: PreviewSettings = {
    companyName: settings?.companyName, companyAddress: settings?.companyAddress,
    companyEmail: settings?.companyEmail, companyPhone: settings?.companyPhone,
    paymentDetails: invoice.paymentDetails ?? settings?.paymentDetails,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
            <Link href="/finances"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
              <Badge className={STATUS_CLASSES[invoice.status]}>{STATUS_LABELS[invoice.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {invoice.actor.company ?? invoice.actor.name}
              {invoice.project && ` · ${invoice.project.name}`}
              {" · "}Due {format(new Date(invoice.dueDate), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />Export PDF
          </Button>

          {invoice.status === "draft" && (
            <>
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="h-4 w-4 mr-1.5" />Edit
              </Button>
              <Button size="sm" onClick={() => {
                if (confirm("Mark this invoice as sent?")) callAction(`/api/invoices/${id}/send`);
              }} disabled={actionLoading}>
                <Send className="h-4 w-4 mr-1.5" />Mark as sent
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1.5" />Delete
              </Button>
            </>
          )}

          {(invoice.status === "sent" || invoice.status === "partially_paid") && (
            <>
              <Button size="sm" onClick={() => setShowPayment(true)}>
                <CircleDollarSign className="h-4 w-4 mr-1.5" />Record payment
              </Button>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => {
                if (confirm("Void this invoice? This cannot be undone.")) callAction(`/api/invoices/${id}/void`);
              }} disabled={actionLoading}>
                <Ban className="h-4 w-4 mr-1.5" />Void
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Partial payment progress */}
      {invoice.status === "partially_paid" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-amber-800">Partial payment received</span>
            <span className="text-amber-700">
              {formatCurrency(Number(invoice.paidAmount), invoice.currency)} of {formatCurrency(Number(invoice.total), invoice.currency)}
            </span>
          </div>
          <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${Math.min(100, (Number(invoice.paidAmount) / Number(invoice.total)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Invoice document */}
      <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-white">
        <InvoicePreview invoice={previewData} settings={previewSettings} />
      </div>

      {showPayment && (
        <RecordPaymentDialog
          invoice={invoice} open onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); refetch(); }}
        />
      )}
    </div>
  );
}
