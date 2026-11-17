import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Building2,
  Send,
  Trash2,
} from "lucide-react";
import { PurchaseRequest } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PurchaseRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [buyerProfile, setBuyerProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Requisition Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Procurement");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [justification, setJustification] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [items, setItems] = useState<Array<{ item_name: string; quantity: string; unit: string; estimated_unit_price: string }>>([
    { item_name: "", quantity: "100", unit: "pc", estimated_unit_price: "250" },
  ]);

  // Approve / Reject modal
  const [actionPr, setActionPr] = useState<PurchaseRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(user ? { "x-user-id": user.id } : {}),
  });

  const loadPrs = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [prRes, profRes] = await Promise.all([
        fetch(`${API_BASE}/buyer/purchase-requests`, { headers: getHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/buyer/profile`, { headers: getHeaders() }).then((r) => r.json()),
      ]);

      if (prRes.success) setPrs(prRes.data || []);
      if (profRes.success) setBuyerProfile(profRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrs();
  }, [user]);

  const addItemRow = () => {
    setItems([...items, { item_name: "", quantity: "10", unit: "pc", estimated_unit_price: "100" }]);
  };

  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, val: string) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    setItems(updated);
  };

  const calculatedTotal = items.reduce((sum, it) => {
    const q = parseFloat(it.quantity) || 0;
    const p = parseFloat(it.estimated_unit_price) || 0;
    return sum + q * p;
  }, 0);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || items.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/buyer/purchase-requests`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          department: department.trim(),
          priority,
          justification: justification.trim(),
          target_delivery_date: targetDate || undefined,
          estimated_amount: calculatedTotal,
          items,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setTitle("");
        setJustification("");
        setItems([{ item_name: "", quantity: "100", unit: "pc", estimated_unit_price: "250" }]);
        await loadPrs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPr) return;
    setIsProcessingAction(true);

    try {
      const endpoint = actionType === "approve" ? "approve" : "reject";
      const payloadKey = actionType === "approve" ? "notes" : "reason";

      const res = await fetch(`${API_BASE}/buyer/purchase-requests/${actionPr.id}/${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ [payloadKey]: actionNotes.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "Action failed.");
      } else {
        setActionPr(null);
        setActionNotes("");
        await loadPrs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const canApprove = buyerProfile?.permissions?.includes("approve") || ["owner", "business_manager", "procurement_manager"].includes(buyerProfile?.role_in_business);

  const filteredPrs = prs.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Internal Purchase Requisitions</h1>
          <p className="text-xs text-stone-500 mt-1">
            Review, authorize, and convert internal employee purchasing requirements into marketplace RFQs or POs.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create Purchase Requisition
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto text-xs">
        {["all", "pending_approval", "approved", "rejected"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition ${
              statusFilter === st ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* PR List Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading requisitions...</div>
        ) : filteredPrs.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            No purchase requisitions found under this status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="p-3">PR Number</th>
                  <th className="p-3">Title & Requester</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Est. Amount</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredPrs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-stone-50/50">
                    <td className="p-3 font-mono font-bold text-stone-900">{pr.pr_number}</td>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{pr.title}</div>
                      <div className="text-[11px] text-stone-500">By {pr.users?.full_name || "Employee"}</div>
                    </td>
                    <td className="p-3 text-stone-600">{pr.department || "Operations"}</td>
                    <td className="p-3 font-mono font-bold text-stone-900">
                      ₹{pr.estimated_amount?.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pr.priority === "urgent"
                          ? "bg-rose-100 text-rose-800"
                          : pr.priority === "high"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-700"
                      }`}>
                        {pr.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pr.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : pr.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {pr.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {pr.status === "pending_approval" && canApprove ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActionPr(pr);
                              setActionType("approve");
                              setActionNotes("");
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setActionPr(pr);
                              setActionType("reject");
                              setActionNotes("");
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-600 text-white hover:bg-rose-500"
                          >
                            Reject
                          </button>
                        </div>
                      ) : pr.status === "approved" ? (
                        <Link
                          to={`/buyer/rfq/new?title=${encodeURIComponent(pr.title)}`}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-stone-900 text-white hover:bg-stone-800 inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Launch RFQ
                        </Link>
                      ) : (
                        <span className="text-[11px] text-stone-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create PR */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">New Purchase Requisition</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Requisition Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50,000 Stand-Up Pouches for Season Launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-600 block mb-1 font-medium">Needed By</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              {/* Line items table */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 uppercase">Item Breakdown</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Line
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Item description"
                          value={it.item_name}
                          onChange={(e) => updateItemRow(idx, "item_name", e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-stone-200 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => updateItemRow(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-stone-200 font-mono bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Unit"
                          value={it.unit}
                          onChange={(e) => updateItemRow(idx, "unit", e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-stone-200 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Unit Price"
                          value={it.estimated_unit_price}
                          onChange={(e) => updateItemRow(idx, "estimated_unit_price", e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-stone-200 font-mono bg-white"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right text-xs font-bold text-stone-800 pt-1">
                  Estimated Total: <span className="font-mono text-sm text-stone-900">₹{calculatedTotal.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">Business Justification</label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain why this procurement is required for business operations..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Approve or Reject */}
      {actionPr && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                {actionType === "approve" ? "Authorize Purchase Requisition" : "Reject Purchase Requisition"}
              </h3>
              <button
                onClick={() => setActionPr(null)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
              <div>PR: <strong className="font-mono">{actionPr.pr_number}</strong></div>
              <div>Title: <span>{actionPr.title}</span></div>
              <div>Amount: <span className="font-mono font-bold">₹{actionPr.estimated_amount?.toLocaleString()}</span></div>
            </div>

            <form onSubmit={handleApproveRejectSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-stone-600 block mb-1 font-medium">
                  {actionType === "approve" ? "Approval Remarks" : "Rejection Reason *"}
                </label>
                <textarea
                  rows={2}
                  required={actionType === "reject"}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === "approve" ? "Approved per budget quota." : "Specify why this request was declined..."}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionPr(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className={`px-5 py-2 text-xs font-bold rounded-lg text-white ${
                    actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {isProcessingAction ? "Processing..." : actionType === "approve" ? "Authorize" : "Decline Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
