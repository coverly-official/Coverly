import React from "react";
import { TrendingUp, PackageCheck, ArrowUpRight, FileText } from "lucide-react";

const stats = [
  { label: "RFQs responded", value: "82%", detail: "+12% vs last month" },
  { label: "Accepted quotes", value: "36", detail: "Across 8 buyers" },
  { label: "Active orders", value: "19", detail: "2 shipments pending" },
];

export const SupplierAnalyticsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Business Performance</h1>
      <p className="text-xs text-stone-500 mt-1">Monitor demand, performance, and operational efficiency.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{stat.label}</div>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-bold text-stone-900">{stat.value}</div>
          <div className="mt-2 text-xs text-stone-500">{stat.detail}</div>
        </div>
      ))}
    </div>

    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-900">Recent activity</h2>
        <span className="text-xs text-stone-500">Last 30 days</span>
      </div>
      <div className="space-y-3 text-sm text-stone-600">
        <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
          <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-emerald-600" />Product stock updated</span>
          <span>2 days ago</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
          <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-stone-500" />Quotation submitted</span>
          <span>4 days ago</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
          <span className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-emerald-600" />Order dispatched</span>
          <span>1 week ago</span>
        </div>
      </div>
    </div>
  </div>
);
