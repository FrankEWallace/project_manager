"use client";

import * as React from "react";
import Link from "next/link";
import { useApi, useMutation } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check } from "lucide-react";

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

export default function InvoiceSettingsPage() {
  const { data: settings, loading } = useApi<InvoiceSettings | null>("/api/invoices/settings");
  const { mutate, loading: saving } = useMutation<object, InvoiceSettings>("/api/invoices/settings", "PUT");

  const [prefix, setPrefix] = React.useState("INV");
  const [companyName, setCompanyName] = React.useState("");
  const [companyAddress, setCompanyAddress] = React.useState("");
  const [companyEmail, setCompanyEmail] = React.useState("");
  const [companyPhone, setCompanyPhone] = React.useState("");
  const [paymentDetails, setPaymentDetails] = React.useState("");
  const [defaultTaxRate, setDefaultTaxRate] = React.useState(0);
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = React.useState(30);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (!settings) return;
    setPrefix(settings.invoicePrefix ?? "INV");
    setCompanyName(settings.companyName ?? "");
    setCompanyAddress(settings.companyAddress ?? "");
    setCompanyEmail(settings.companyEmail ?? "");
    setCompanyPhone(settings.companyPhone ?? "");
    setPaymentDetails(settings.paymentDetails ?? "");
    setDefaultTaxRate(Number(settings.defaultTaxRate ?? 0));
    setDefaultPaymentTermsDays(settings.defaultPaymentTermsDays ?? 30);
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = await mutate({
      invoicePrefix: prefix,
      companyName: companyName || undefined,
      companyAddress: companyAddress || undefined,
      companyEmail: companyEmail || undefined,
      companyPhone: companyPhone || undefined,
      paymentDetails: paymentDetails || undefined,
      defaultTaxRate,
      defaultPaymentTermsDays,
    });
    if (result !== null) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" asChild>
          <Link href="/finances"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Invoice settings</h1>
          <p className="text-xs text-muted-foreground">Company details and defaults applied to every invoice</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Company details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Your company</CardTitle>
              <CardDescription>Appears in the sender section of each invoice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Studio"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder={"123 Main St\nCity, State 00000\nCountry"}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="hello@acme.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice defaults */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Invoice defaults</CardTitle>
              <CardDescription>Pre-filled values when creating a new invoice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prefix">Number prefix</Label>
                  <Input
                    id="prefix"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="INV"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">e.g. {prefix || "INV"}-001</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxRate">Tax rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="terms">Payment terms</Label>
                  <div className="relative">
                    <Input
                      id="terms"
                      type="number"
                      min={0}
                      max={365}
                      value={defaultPaymentTermsDays}
                      onChange={(e) => setDefaultPaymentTermsDays(Number(e.target.value))}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Payment instructions</CardTitle>
              <CardDescription>Bank details or payment links printed at the bottom of every invoice.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="paymentDetails" className="sr-only">Payment instructions</Label>
                <Textarea
                  id="paymentDetails"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder={"Bank: First National\nAccount: 0000000\nRouting: 000000000\nRef: invoice number"}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className={saved ? "bg-green-600 hover:bg-green-600 text-white" : ""}
            >
              {saved ? (
                <><Check className="h-4 w-4 mr-1.5" />Saved</>
              ) : saving ? (
                "Saving…"
              ) : (
                "Save settings"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
