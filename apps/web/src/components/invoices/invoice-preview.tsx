"use client";

import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

// ─── Shared interfaces (used by both screen and print) ────────────────────────

export interface PreviewActor {
  name: string;
  email?: string | null;
  company?: string | null;
}

export interface PreviewSettings {
  companyName?: string | null;
  companyAddress?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  paymentDetails?: string | null;
}

export interface InvoicePreviewData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  notes?: string | null;
  actor: PreviewActor;
  items: { description: string; details?: string | null; quantity: number; rate: number; amount: number }[];
}

// ─── Screen component (Tailwind-styled) ───────────────────────────────────────

interface Props {
  invoice: InvoicePreviewData;
  settings: PreviewSettings;
  previewRef?: React.Ref<HTMLDivElement>;
}

export function InvoicePreview({ invoice, settings, previewRef }: Props) {
  const { invoiceNumber, issueDate, dueDate, currency, subtotal, taxRate, taxAmount, total, paidAmount = 0, notes, actor, items } = invoice;
  const balance = total - paidAmount;
  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div
      ref={previewRef}
      id="invoice-preview"
      className="bg-white text-gray-900 p-10 w-full"
      style={{ fontFamily: "'Segoe UI', -apple-system, sans-serif", fontSize: "13px" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="text-xl font-light text-gray-700">{settings.companyName ?? "Your Company"}</p>
          {settings.companyAddress && (
            <p className="text-xs text-gray-500 mt-1 whitespace-pre-line leading-relaxed">{settings.companyAddress}</p>
          )}
          {settings.companyEmail && <p className="text-xs text-gray-500">{settings.companyEmail}</p>}
          {settings.companyPhone && <p className="text-xs text-gray-500">{settings.companyPhone}</p>}
        </div>
        <div className="text-right">
          <h1 className="text-5xl font-light text-gray-200 tracking-widest">INVOICE</h1>
          <p className="text-xs text-gray-500 mt-2 font-mono tracking-wide">{invoiceNumber}</p>
          <p className="text-xs text-gray-400 mt-0.5">Issued: {format(new Date(issueDate), "MMMM d, yyyy")}</p>
          <p className="text-xs text-gray-400">Due: {format(new Date(dueDate), "MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* From / Bill To */}
      <div className="grid grid-cols-2 gap-10 mb-10 pb-8 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">From</p>
          <p className="font-medium text-gray-800">{settings.companyName ?? "Your Company"}</p>
          {settings.companyAddress && (
            <p className="text-xs text-gray-500 whitespace-pre-line mt-0.5 leading-relaxed">{settings.companyAddress}</p>
          )}
          {settings.companyEmail && <p className="text-xs text-gray-500">{settings.companyEmail}</p>}
          {settings.companyPhone && <p className="text-xs text-gray-500">{settings.companyPhone}</p>}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
          <p className="font-medium text-gray-800">{actor.company ?? actor.name}</p>
          {actor.company && <p className="text-xs text-gray-600">{actor.name}</p>}
          {actor.email && <p className="text-xs text-gray-500">{actor.email}</p>}
        </div>
      </div>

      {/* Line items */}
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-2.5 rounded">
          <span className="col-span-6">Description</span>
          <span className="col-span-2 text-right">Qty</span>
          <span className="col-span-2 text-right">Rate</span>
          <span className="col-span-2 text-right">Amount</span>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-gray-300 px-3 py-6 text-center">No items added yet</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-gray-50">
              <div className="col-span-6">
                <p className="font-medium text-gray-800">{item.description || "—"}</p>
                {item.details && <p className="text-xs text-gray-400 mt-0.5">{item.details}</p>}
              </div>
              <span className="col-span-2 text-right text-gray-500 font-mono text-xs">{item.quantity}</span>
              <span className="col-span-2 text-right text-gray-500 font-mono text-xs">{fmt(item.rate)}</span>
              <span className="col-span-2 text-right font-medium font-mono text-xs">{fmt(item.amount)}</span>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="w-56 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax ({taxRate}%)</span><span className="font-mono">{fmt(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
            <span>Total</span><span className="font-mono">{fmt(total)}</span>
          </div>
          {paidAmount > 0 && (
            <>
              <div className="flex justify-between text-xs text-green-600">
                <span>Amount paid</span><span className="font-mono">−{fmt(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-amber-600 border-t border-amber-100 pt-2">
                <span>Balance due</span><span className="font-mono">{fmt(balance)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment details + notes */}
      {(settings.paymentDetails || notes) && (
        <div className="grid grid-cols-2 gap-10 pt-8 border-t border-gray-100">
          {settings.paymentDetails && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Payment Details</p>
              <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{settings.paymentDetails}</p>
            </div>
          )}
          {notes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Notes</p>
              <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{notes}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-[10px] text-gray-200">Generated {format(new Date(), "MMMM d, yyyy")}</p>
      </div>
    </div>
  );
}

// ─── Print HTML builder (no Tailwind dependency — pure inline styles) ─────────

export function buildInvoicePrintHTML(invoice: InvoicePreviewData, settings: PreviewSettings): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency }).format(n);
  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(d));

  const paidAmount = invoice.paidAmount ?? 0;
  const balance = invoice.total - paidAmount;

  const itemsHTML = invoice.items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f5f5f5;">
        <div style="font-weight:500;color:#111;">${item.description}</div>
        ${item.details ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;">${item.details}</div>` : ""}
      </td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f5f5f5;font-family:monospace;color:#555;">${item.quantity}</td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f5f5f5;font-family:monospace;color:#555;">${fmt(item.rate)}</td>
      <td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f5f5f5;font-family:monospace;font-weight:500;">${fmt(item.amount)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${invoice.invoiceNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#111;background:white;padding:48px}
  @page{margin:15mm}
  @media print{body{padding:0}}
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
    <div>
      <p style="font-size:20px;font-weight:300;color:#374151">${settings.companyName ?? "Your Company"}</p>
      ${settings.companyAddress ? `<p style="font-size:11px;color:#9ca3af;margin-top:4px;white-space:pre-line;line-height:1.6">${settings.companyAddress}</p>` : ""}
      ${settings.companyEmail ? `<p style="font-size:11px;color:#9ca3af">${settings.companyEmail}</p>` : ""}
      ${settings.companyPhone ? `<p style="font-size:11px;color:#9ca3af">${settings.companyPhone}</p>` : ""}
    </div>
    <div style="text-align:right">
      <h1 style="font-size:42px;font-weight:300;color:#e5e7eb;letter-spacing:8px">INVOICE</h1>
      <p style="font-size:11px;color:#9ca3af;margin-top:6px;font-family:monospace;letter-spacing:1px">${invoice.invoiceNumber}</p>
      <p style="font-size:11px;color:#9ca3af;margin-top:2px">Issued: ${fmtDate(invoice.issueDate)}</p>
      <p style="font-size:11px;color:#9ca3af">Due: ${fmtDate(invoice.dueDate)}</p>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid #f3f4f6">
    <div>
      <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">From</p>
      <p style="font-weight:500">${settings.companyName ?? "Your Company"}</p>
      ${settings.companyAddress ? `<p style="font-size:11px;color:#9ca3af;margin-top:2px;white-space:pre-line;line-height:1.6">${settings.companyAddress}</p>` : ""}
      ${settings.companyEmail ? `<p style="font-size:11px;color:#9ca3af">${settings.companyEmail}</p>` : ""}
    </div>
    <div>
      <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">Bill To</p>
      <p style="font-weight:500">${invoice.actor.company ?? invoice.actor.name}</p>
      ${invoice.actor.company ? `<p style="font-size:11px;color:#6b7280">${invoice.actor.name}</p>` : ""}
      ${invoice.actor.email ? `<p style="font-size:11px;color:#9ca3af">${invoice.actor.email}</p>` : ""}
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr style="background:#f9fafb">
        <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af">Description</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af">Rate</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-bottom:40px">
    <div style="width:220px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#9ca3af;padding:4px 0"><span>Subtotal</span><span style="font-family:monospace">${fmt(invoice.subtotal)}</span></div>
      ${invoice.taxRate > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#9ca3af;padding:4px 0"><span>Tax (${invoice.taxRate}%)</span><span style="font-family:monospace">${fmt(invoice.taxAmount)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;border-top:1px solid #e5e7eb;padding:8px 0 4px"><span>Total</span><span style="font-family:monospace">${fmt(invoice.total)}</span></div>
      ${paidAmount > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#16a34a;padding:4px 0"><span>Amount paid</span><span style="font-family:monospace">−${fmt(paidAmount)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;color:#d97706;border-top:1px solid #fef3c7;padding-top:8px"><span>Balance due</span><span style="font-family:monospace">${fmt(balance)}</span></div>` : ""}
    </div>
  </div>
  ${settings.paymentDetails || invoice.notes ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-top:32px;border-top:1px solid #f3f4f6">
    ${settings.paymentDetails ? `<div><p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">Payment Details</p><p style="font-size:12px;color:#6b7280;white-space:pre-line;line-height:1.6">${settings.paymentDetails}</p></div>` : ""}
    ${invoice.notes ? `<div><p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">Notes</p><p style="font-size:12px;color:#6b7280;white-space:pre-line;line-height:1.6">${invoice.notes}</p></div>` : ""}
  </div>` : ""}
  <div style="margin-top:48px;text-align:center">
    <p style="font-size:10px;color:#e5e7eb">Generated ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date())}</p>
  </div>
</body>
</html>`;
}
