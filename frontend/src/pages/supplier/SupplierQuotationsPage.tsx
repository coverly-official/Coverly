import React from "react";
import { FileText, CheckCircle2, Clock3, ArrowUpRight } from "lucide-react";

const quotes = [
  { id: "Q-1042", client: "Apex Retail Ventures", amount: "₹1,26,500", status: "Pending", updated: "3 hours ago" },
  { id: "Q-1038", client: "Metro Pack Systems", amount: "₹92,400", status: "Accepted", updated: "Yesterday" },
  { id: "Q-1025", client: "Prime Construction Materials", amount: "₹2,08,000", status: "Reviewed", updated: "2 days ago" },
];

export const SupplierQuotationsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Submitted Quotations</h1>
      <p className="text-xs text-stone-500 mt-1">Track every quotation and respond to RFQs efficiently.</p>
    </div>

    <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-stone-200 p-4 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
        <span>Quotation</span>
        <span>Buyer</span>
        <span>Value</span>
        <span>Status</span>
      </div>
      {quotes.map((quote) => (
        <div key={quote.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-stone-100 last:border-b-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <FileText className="h-4 w-4 text-stone-500" /> {quote.id}
          </div>
          <div className="text-sm text-stone-700">{quote.client}</div>
          <div className="text-sm font-medium text-stone-900">{quote.amount}</div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
              quote.status === "Accepted" ? "bg-emerald-50 text-emerald-800" : quote.status === "Pending" ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-700"
            }`}>
              {quote.status}
            </span>
            <ArrowUpRight className="h-4 w-4 text-stone-400" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
