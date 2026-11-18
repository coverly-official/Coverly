import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getAuthHeaders(): Record<string, string> {
  const userId = localStorage.getItem("coverly_user_id") || "";
  const token = localStorage.getItem("auth_token") || "";
  return {
    ...(userId ? { "x-user-id": userId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const STATUS_BADGE: Record<string, string> = {
  CREATED: "bg-stone-100 text-stone-700 border-stone-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-800 border-blue-200",
  SUCCESS: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FAILED: "bg-red-50 text-red-800 border-red-200",
  CANCELLED: "bg-stone-100 text-stone-600 border-stone-200",
  EXPIRED: "bg-rose-50 text-rose-800 border-rose-200",
  REFUND_PENDING: "bg-orange-50 text-orange-800 border-orange-200",
  PARTIALLY_REFUNDED: "bg-indigo-50 text-indigo-800 border-indigo-200",
  REFUNDED: "bg-purple-50 text-purple-800 border-purple-200",
};

function formatInrFromPaise(paise: number): string {
  const val = (Number(paise || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${val}`;
}

export const AdminPaymentsDashboardPage: React.FC = () => {
  const [tab, setTab] = useState<"transactions" | "refunds" | "settlements" | "webhooks">("transactions");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Refund modal
  const [refundTarget, setRefundTarget] = useState<any | null>(null);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (providerFilter !== "all") params.set("provider", providerFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${API_BASE}/payments/admin/dashboard?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error || "Unable to load payment dashboard.");
      } else {
        setData(body.data);
      }
    } catch {
      setError("Network error loading payment dashboard.");
    } finally {
      setLoading(false);
    }
  }, [providerFilter, statusFilter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;
    setRefundSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/payments/admin/${refundTarget.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          refund_type: refundType,
          amount: refundType === "partial" ? refundAmount : undefined,
          reason: refundReason,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFeedback({ type: "error", text: body.error || "Gateway rejected refund request." });
      } else {
        setFeedback({
          type: "success",
          text: `Refund submitted (${body.data?.refund_reference}) with provider status: ${body.data?.status}.`,
        });
        setRefundTarget(null);
        setRefundAmount("");
        setRefundReason("");
        await loadDashboard();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error issuing refund." });
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleSyncRefund = async (refundId: string) => {
    setSyncingId(refundId);
    try {
      const res = await fetch(`${API_BASE}/payments/admin/refunds/${refundId}/sync`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFeedback({ type: "error", text: body.error || "Unable to sync refund status." });
      } else {
        setFeedback({ type: "success", text: "Refund status synchronized with payment provider." });
        await loadDashboard();
      }
    } catch {
      setFeedback({ type: "error", text: "Network error syncing refund status." });
    } finally {
      setSyncingId(null);
    }
  };

  const m = data?.metrics || {
    total_transactions: 0,
    total_volume_paise: 0,
    successful_payments: 0,
    pending_payments: 0,
    failed_payments: 0,
    refunded_payments: 0,
    total_refunded_paise: 0,
    total_fees_paise: 0,
    total_commission_paise: 0,
  };

  const kpis = [
    { label: "Total Payment Volume", value: formatInrFromPaise(m.total_volume_paise), cls: "border-emerald-200 text-emerald-900 bg-emerald-50/40" },
    { label: "Successful Payments", value: m.successful_payments, cls: "border-stone-200 text-stone-900" },
    { label: "Pending / Processing", value: m.pending_payments, cls: "border-amber-200 text-amber-800 bg-amber-50/40" },
    { label: "Failed / Expired", value: m.failed_payments, cls: "border-red-200 text-red-800 bg-red-50/40" },
    { label: "Refunded Volume", value: formatInrFromPaise(m.total_refunded_paise), cls: "border-purple-200 text-purple-900 bg-purple-50/40" },
    { label: "Gateway Fees", value: formatInrFromPaise(m.total_fees_paise), cls: "border-stone-200 text-stone-800" },
    { label: "Platform Commission", value: formatInrFromPaise(m.total_commission_paise), cls: "border-indigo-200 text-indigo-900 bg-indigo-50/40" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            Admin Payments &amp; Settlement Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time database ledger of verified payments, refunds, gateway fees, platform commissions, settlements, and webhook audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/payment-gateways"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
          >
            <Settings className="w-3.5 h-3.5" />
            Configure Gateways
          </Link>
          <button
            type="button"
            onClick={loadDashboard}
            className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Real DB Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl border bg-white p-3.5 ${k.cls}`}>
            <div className="text-[11px] font-medium opacity-80 truncate">{k.label}</div>
            <div className="text-lg font-bold mt-1 tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Gateway-wise Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(data?.gateway_breakdown || []).map((g: any) => (
          <div key={g.provider} className="rounded-xl border border-stone-200 bg-white p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wide text-stone-800">{g.provider}</span>
              <span className="text-[11px] text-stone-500">{g.count} txns</span>
            </div>
            <div className="text-lg font-bold text-emerald-800 mt-1 tabular-nums">
              {formatInrFromPaise(g.volume_paise)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">{g.success_count} verified successful</div>
          </div>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-semibold">
          {(
            [
              ["transactions", "Transactions"],
              ["refunds", "Refunds"],
              ["settlements", "Settlement Records"],
              ["webhooks", "Webhook Security Log"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                tab === id ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "transactions" && (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
            >
              <option value="all">All Gateways</option>
              <option value="cashfree">Cashfree</option>
              <option value="razorpay">Razorpay</option>
              <option value="payu">PayU</option>
              <option value="paytm">Paytm</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
            >
              <option value="all">All Statuses</option>
              {Object.keys(STATUS_BADGE).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "transactions" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase">
                  <th className="py-3 px-4">Payment Ref &amp; Order</th>
                  <th className="py-3 px-4">Buyer / Supplier</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Loading payments...
                    </td>
                  </tr>
                ) : (data?.payments || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-stone-500">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  (data?.payments || []).map((p: any) => {
                    const refundablePaise = Number(p.amount_paise) - Number(p.refunded_paise || 0);
                    const canRefund =
                      ["SUCCESS", "PARTIALLY_REFUNDED"].includes(p.status) && refundablePaise > 0;
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-stone-900">{p.payment_reference}</div>
                          <div className="text-[11px] text-stone-500">Order: {p.order_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-stone-900">{p.users?.full_name || "Buyer"}</div>
                          <div className="text-[11px] text-stone-500">{p.businesses?.name || "Supplier"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="uppercase font-semibold text-stone-800">{p.provider}</span>
                          <div className="text-[10px] text-stone-500">{p.environment}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold tabular-nums">
                          {formatInrFromPaise(p.amount_paise)}
                          {Number(p.refunded_paise || 0) > 0 && (
                            <div className="text-[10px] text-purple-700">
                              Refunded: {formatInrFromPaise(p.refunded_paise)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              STATUS_BADGE[p.status] || "bg-stone-100 text-stone-700 border-stone-200"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canRefund ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundTarget(p);
                                setRefundType("full");
                                setRefundAmount((refundablePaise / 100).toFixed(2));
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-semibold cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Refund
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {tab === "refunds" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase">
                  <th className="py-3 px-4">Refund Ref</th>
                  <th className="py-3 px-4">Provider Ref</th>
                  <th className="py-3 px-4">Type &amp; Amount</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(data?.refunds || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-stone-500">
                      No refunds initiated yet.
                    </td>
                  </tr>
                ) : (
                  (data?.refunds || []).map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-3 px-4 font-mono font-semibold">{r.refund_reference}</td>
                      <td className="py-3 px-4 font-mono text-stone-600">{r.provider_refund_id || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{formatInrFromPaise(r.amount_paise)}</span>{" "}
                        <span className="text-[10px] uppercase text-stone-500">({r.refund_type})</span>
                      </td>
                      <td className="py-3 px-4 text-stone-700 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-stone-50">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={syncingId === r.id}
                          onClick={() => handleSyncRefund(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-[11px] font-semibold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Sync
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === "settlements" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase">
                  <th className="py-3 px-4">Settlement Ref</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Gross</th>
                  <th className="py-3 px-4">Fees &amp; Commission</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(data?.settlements || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-stone-500">
                      No settlement records created yet. Settlement ledger entries are generated strictly after verified payment confirmation.
                    </td>
                  </tr>
                ) : (
                  (data?.settlements || []).map((s: any) => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 font-mono font-semibold">{s.settlement_reference}</td>
                      <td className="py-3 px-4 font-medium">{s.businesses?.name || s.supplier_business_id}</td>
                      <td className="py-3 px-4 tabular-nums">{formatInrFromPaise(s.gross_amount_paise)}</td>
                      <td className="py-3 px-4 text-stone-600 tabular-nums">
                        Fee: {formatInrFromPaise(s.gateway_fee_paise)} &middot; Comm:{" "}
                        {formatInrFromPaise(s.platform_commission_paise)}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-800 tabular-nums">
                        {formatInrFromPaise(s.net_supplier_payable_paise)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          {s.settlement_status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === "webhooks" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase">
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Signature</th>
                  <th className="py-3 px-4">Processing</th>
                  <th className="py-3 px-4">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(data?.recent_webhooks || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-stone-500">
                      No webhook events received yet.
                    </td>
                  </tr>
                ) : (
                  (data?.recent_webhooks || []).map((w: any) => (
                    <tr key={w.id}>
                      <td className="py-3 px-4 uppercase font-semibold">{w.provider}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">{w.provider_event_id}</td>
                      <td className="py-3 px-4">{w.event_type}</td>
                      <td className="py-3 px-4">
                        {w.signature_valid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{w.processing_status}</td>
                      <td className="py-3 px-4 text-stone-500">
                        {new Date(w.received_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 backdrop-blur-xs p-4">
          <form
            onSubmit={handleIssueRefund}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Initiate Provider Refund</h3>
                <p className="text-[11px] text-stone-300">{refundTarget.payment_reference}</p>
              </div>
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span>Remaining Refundable:</span>
                <strong className="text-emerald-800">
                  {formatInrFromPaise(Number(refundTarget.amount_paise) - Number(refundTarget.refunded_paise || 0))}
                </strong>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["full", "partial"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRefundType(t)}
                    className={`py-2 rounded-lg border font-semibold capitalize cursor-pointer ${
                      refundType === t
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    {t} Refund
                  </button>
                ))}
              </div>

              {refundType === "partial" && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Partial Refund Amount (INR)</label>
                  <input
                    type="text"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="e.g. 500.00"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Refund Reason *</label>
                <textarea
                  rows={2}
                  required
                  minLength={5}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter verified commercial or quality dispute reason..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-200"
                />
              </div>

              <p className="text-[11px] text-stone-500 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                Executed directly via {refundTarget.provider.toUpperCase()} Refund API. Status will only mark REFUNDED upon provider confirmation.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refundSubmitting}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {refundSubmitting ? "Submitting to Provider..." : "Execute Refund"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
