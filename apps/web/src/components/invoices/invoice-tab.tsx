"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useApi, useMutation } from "@/hooks/use-api";
import { useSession } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";
import { getWorkspaceId } from "@/lib/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Plus, Send, Ban, CircleDollarSign, Eye } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "partially_paid" | "paid" | "void";
  currency: string;
  total: string;
  paidAmount: string;
  dueDate: string;
  actor: { id: string; name: string; company: string | null };
  project: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<InvoiceSummary["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  partially_paid: "Partial",
  paid: "Paid",
  void: "Void",
};

const STATUS_CLASSES: Record<InvoiceSummary["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600",
  partially_paid: "bg-amber-500/10 text-amber-600",
  paid: "bg-green-500/10 text-green-700",
  void: "bg-muted text-muted-foreground",
};

// ─── Record Payment Dialog ────────────────────────────────────────────────────

function RecordPaymentDialog({
  invoice, open, onClose, onSuccess,
}: {
  invoice: InvoiceSummary;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const remaining = Number(invoice.total) - Number(invoice.paidAmount);
  const [amount, setAmount] = React.useState(remaining.toFixed(2));
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = React.useState("");
  const { mutate, loading } = useMutation<object, unknown>(`/api/invoices/${invoice.id}/payment`);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await mutate({
      amount: Number(amount),
      currency: invoice.currency,
      normalizedAmount: Number(amount),
      date: new Date(date).toISOString(),
      notes: notes || undefined,
    });
    if (result !== null) { onSuccess(); onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment — {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Amount ({invoice.currency})</Label>
            <Input
              type="number" min="0.01" max={remaining.toFixed(2)} step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)} required
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatCurrency(remaining, invoice.currency)}
            </p>
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

// ─── Invoice List ─────────────────────────────────────────────────────────────

export function InvoiceTab() {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [paymentTarget, setPaymentTarget] = React.useState<InvoiceSummary | null>(null);
  const { data: session } = useSession();
  const workspaceId = getWorkspaceId();

  const path = statusFilter === "all" ? "/api/invoices" : `/api/invoices?status=${statusFilter}`;
  const { data: invoices, loading, refetch } = useApi<InvoiceSummary[]>(path, [statusFilter]);

  async function callAction(url: string) {
    await apiRequest(url, {
      method: "POST",
      token: session?.session?.token,
      workspaceId: workspaceId ?? undefined,
    });
    refetch();
  }

  const filters = ["all", "draft", "sent", "partially_paid", "paid", "void"] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                "text-xs px-3 py-1 rounded-full border transition-colors",
                statusFilter === s
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <Button size="sm" asChild>
          <Link href="/finances/invoices/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New invoice
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium">Client</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Project</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Due</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[130px]">{inv.actor.company ?? inv.actor.name}</p>
                        {inv.actor.company && <p className="text-xs text-muted-foreground">{inv.actor.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[120px] truncate">
                        {inv.project?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_CLASSES[inv.status]}>{STATUS_LABELS[inv.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                        {format(new Date(inv.dueDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(Number(inv.total), inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                            <Link href={`/finances/invoices/${inv.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                          {inv.status === "draft" && (
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600"
                              title="Mark as sent"
                              onClick={() => {
                                if (confirm("Mark this invoice as sent?")) callAction(`/api/invoices/${inv.id}/send`);
                              }}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(inv.status === "sent" || inv.status === "partially_paid") && (
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600"
                              title="Record payment"
                              onClick={() => setPaymentTarget(inv)}
                            >
                              <CircleDollarSign className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {inv.status !== "paid" && inv.status !== "void" && (
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              title="Void invoice"
                              onClick={() => {
                                if (confirm("Void this invoice? This cannot be undone.")) callAction(`/api/invoices/${inv.id}/void`);
                              }}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/finances/invoices/new">Create your first invoice</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {paymentTarget && (
        <RecordPaymentDialog
          invoice={paymentTarget}
          open
          onClose={() => setPaymentTarget(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
