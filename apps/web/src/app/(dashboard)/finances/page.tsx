"use client";

import * as React from "react";
import { format } from "date-fns";
import { useApi, useMutation } from "@/hooks/use-api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Plus } from "lucide-react";
import { InvoiceTab } from "@/components/invoices/invoice-tab";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinanceTrends {
  income: { current: number; pct: number | null };
  expenses: { current: number; pct: number | null };
  profit: { current: number; pct: number | null };
  activeProjects: { current: number; pct: number | null };
}

interface RevenueByProject {
  projectId: string;
  projectName: string;
  totalIncome: number;
  share: number;
}

interface UpcomingPayment {
  id: string;
  description: string;
  type: "income" | "expense";
  amount: string;
  date: string;
  projectName: string;
  category: string;
}

interface Transaction {
  id: string;
  description: string;
  type: "income" | "expense";
  category: string;
  amount: string;
  date: string;
  projectId: string;
  projectName: string;
}

interface Project {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />;
}

function TrendBadge({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return null;
  const positive = invert ? pct <= 0 : pct >= 0;
  return (
    <Badge className={positive ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-destructive"}>
      {pct >= 0 ? "+" : ""}{pct}%
    </Badge>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiGrid() {
  const { data: trends, loading } = useApi<FinanceTrends>("/api/analytics/trends");

  const income = trends?.income.current ?? 0;
  const expenses = trends?.expenses.current ?? 0;
  const profit = trends?.profit.current ?? 0;
  const margin = income > 0 ? Math.round((profit / income) * 100) : 0;

  const kpis = [
    { label: "Total revenue", value: formatCurrency(income), pct: trends?.income.pct ?? null, invert: false as boolean },
    { label: "Total expenses", value: formatCurrency(expenses), pct: trends?.expenses.pct ?? null, invert: true as boolean },
    { label: "Net profit", value: formatCurrency(profit), pct: trends?.profit.pct ?? null, invert: false as boolean, colored: true, profit },
    { label: "Profit margin", value: `${margin}%`, pct: null, invert: false as boolean },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => {
          const isLastRow = i >= 2;
          const isRight = i % 2 === 1;
          return (
            <div
              key={kpi.label}
              className={[
                "p-5 flex flex-col gap-3",
                !isLastRow ? "border-b border-foreground/10" : "",
                !isRight ? "border-r border-foreground/10" : "",
              ].join(" ")}
            >
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="flex items-end justify-between gap-2">
                  <span className={[
                    "text-2xl font-bold leading-none",
                    "colored" in kpi && kpi.colored
                      ? (kpi.profit ?? 0) >= 0 ? "text-green-600" : "text-destructive"
                      : "text-foreground",
                  ].join(" ")}>
                    {kpi.value}
                  </span>
                  <TrendBadge pct={kpi.pct} invert={kpi.invert} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RevenueByProjectCard() {
  const { data, loading } = useApi<RevenueByProject[]>("/api/analytics/revenue-by-project");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Revenue by project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : data && data.length > 0 ? (
          data.map((item) => (
            <div key={item.projectId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-foreground truncate">{item.projectName}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{item.share}%</span>
                </div>
                <span className="text-green-600 font-medium shrink-0 ml-4">
                  {formatCurrency(item.totalIncome)}
                </span>
              </div>
              <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${item.share}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No income recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingPaymentsCard() {
  const { data, loading } = useApi<UpcomingPayment[]>("/api/analytics/upcoming-payments");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Upcoming payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className={`shrink-0 rounded-full p-1.5 ${item.type === "income" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {item.type === "income"
                    ? <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                    : <ArrowDownLeft className="h-3.5 w-3.5 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.projectName} · {format(new Date(item.date), "MMM d, yyyy")}
                  </p>
                </div>
                <span className={`text-sm font-medium shrink-0 ${item.type === "income" ? "text-green-600" : "text-destructive"}`}>
                  {item.type === "expense" ? "−" : "+"}{formatCurrency(Number(item.amount))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming payments logged.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Add Transaction Dialog ───────────────────────────────────────────────────

const TRANSACTION_CATEGORIES = [
  { value: "client_payment", label: "Client payment" },
  { value: "grant", label: "Grant" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "investment", label: "Investment" },
  { value: "refund", label: "Refund" },
  { value: "other_income", label: "Other income" },
  { value: "salary", label: "Salary" },
  { value: "contractor", label: "Contractor" },
  { value: "software", label: "Software" },
  { value: "hosting", label: "Hosting" },
  { value: "hardware", label: "Hardware" },
  { value: "transport", label: "Transport" },
  { value: "marketing", label: "Marketing" },
  { value: "legal", label: "Legal" },
  { value: "office", label: "Office" },
  { value: "utilities", label: "Utilities" },
  { value: "other_expense", label: "Other expense" },
];

function AddTransactionDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: projects } = useApi<Project[]>("/api/projects");
  const [projectId, setProjectId] = React.useState("");
  const [type, setType] = React.useState<"income" | "expense">("income");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));

  const { mutate, loading } = useMutation<object, unknown>(
    projectId ? `/api/projects/${projectId}/transactions` : "/api/projects/_/transactions"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    const result = await mutate({
      type,
      category,
      description,
      amount: Number(amount),
      currency: "USD",
      normalizedAmount: Number(amount),
      date: new Date(date).toISOString(),
    });
    if (result) {
      onSuccess();
      onClose();
      setDescription("");
      setAmount("");
      setCategory("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId} required>
              <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
              <SelectContent>
                {(projects ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger><SelectValue placeholder="Category…" /></SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Invoice #42 payment" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || !projectId || !category}>
              {loading ? "Saving…" : "Add transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transactions Table ────────────────────────────────────────────────────────

function TransactionsTable() {
  const [showAdd, setShowAdd] = React.useState(false);
  const { data, loading, refetch } = useApi<Transaction[]>("/api/analytics/transactions");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add transaction
        </Button>
      </div>

      <AddTransactionDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={refetch}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : data && data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Project</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(tx.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                        {tx.projectName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            tx.type === "income"
                              ? "bg-green-500/10 text-green-700"
                              : "bg-red-500/10 text-destructive"
                          }
                        >
                          {tx.type === "income" ? "Income" : "Expense"}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${tx.type === "income" ? "text-green-600" : "text-destructive"}`}>
                        {tx.type === "expense" ? "−" : "+"}{formatCurrency(Number(tx.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No transactions yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finances</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), "EEEE, do MMMM yyyy")}</p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="accounts" disabled>Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <KpiGrid />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueByProjectCard />
            <UpcomingPaymentsCard />
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTable />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceTab />
        </TabsContent>

        <TabsContent value="accounts">
          <div className="flex h-48 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground text-sm">
            Accounts view coming in v2.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
