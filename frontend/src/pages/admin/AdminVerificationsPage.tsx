import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, XCircle, FileText, ExternalLink, ShieldCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const AdminVerificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);

  const fetchVerifications = () => {
    setIsLoading(true);
    fetch(`${API_BASE}/admin/verifications?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVerifications(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    if (!user) return;
    const notes = prompt(`Enter compliance review notes for ${status}:`) || "";

    try {
      const res = await fetch(`${API_BASE}/admin/verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewer_id: user.id,
          review_notes: notes,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to submit decision.");
      }

      fetchVerifications();
    } catch (err: any) {
      alert(err.message || "Failed to process decision.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Supplier Verification Review Queue
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Verification Admin Console • Inspect uploaded GSTIN, PAN, and factory licenses to assign distinct verification tiers
        </p>
      </div>

      <div className="flex gap-2 border-b border-stone-200 pb-2 text-xs">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            statusFilter === "pending"
              ? "bg-stone-900 text-white font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            statusFilter === "approved"
              ? "bg-stone-900 text-white font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Approved Tiers
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            statusFilter === "rejected"
              ? "bg-stone-900 text-white font-semibold"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Rejected
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white border border-stone-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded-xl text-xs text-stone-500">
            No verification submissions in this queue.
          </div>
        ) : (
          verifications.map((ver) => (
            <div
              key={ver.id}
              className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-stone-900">
                    {ver.businesses?.name || "Supplier Business"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                    Tier: {ver.verification_tier.replace("_", " ")}
                  </span>
                </div>

                <div className="text-xs text-stone-500 flex items-center gap-3">
                  <span>Location: {ver.businesses?.city}</span>
                  {ver.businesses?.gstin && <span>GSTIN: {ver.businesses.gstin}</span>}
                  {ver.businesses?.pan && <span>PAN: {ver.businesses.pan}</span>}
                  <span>Submitted: {new Date(ver.submitted_at).toLocaleDateString()}</span>
                </div>

                {ver.verification_documents && ver.verification_documents.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    {ver.verification_documents.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded transition"
                      >
                        <FileText className="w-3 h-3 text-stone-500" />
                        {doc.doc_type}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {ver.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDecision(ver.id, "approved")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Tier
                  </button>
                  <button
                    onClick={() => handleDecision(ver.id, "rejected")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
