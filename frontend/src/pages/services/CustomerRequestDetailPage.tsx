import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ServiceRequest, ServiceRequestQuotation } from "@/types";
import {
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const CustomerRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequest = () => {
    setIsLoading(true);
    fetch(`${API_BASE}/business-services/requests/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRequest(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleRespondQuotation = async (quoteId: string, action: "accept" | "reject") => {
    if (!user) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/business-services/quotations/${quoteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          action,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to update quotation.");
      }

      fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to respond to quotation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!user || !request) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/business-services/requests/${request.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_status: "completed",
          changed_by: user.id,
          note: "Customer confirmed satisfaction and signed off on completed deliverables.",
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to confirm completion.");
      }

      fetchRequest();
    } catch (err: any) {
      alert(err.message || "Failed to confirm completion.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center animate-pulse">Loading request details...</div>;
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Request Not Found</h2>
        <Link to="/services/my-requests" className="text-xs text-stone-900 underline">
          Back to My Requests
        </Link>
      </div>
    );
  }

  const quotations: ServiceRequestQuotation[] = request.quotations || [];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              {request.request_number}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                request.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : request.status === "quoted"
                  ? "bg-purple-100 text-purple-800"
                  : request.status === "in_progress"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {request.status.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">{request.title}</h1>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            Target Firm: {request.businesses?.name} • Created: {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>

        {request.status === "in_progress" && (
          <button
            onClick={handleConfirmCompletion}
            disabled={isProcessing}
            className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition disabled:opacity-50 flex items-center gap-2 self-start shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isProcessing ? "Signing Off..." : "Confirm Completion Sign-Off"}
          </button>
        )}
      </div>

      {/* Scope Requirements */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Inquiry Scope & Details
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
          {request.requirements}
        </p>

        <div className="pt-3 border-t border-stone-100 flex flex-wrap gap-4 text-xs text-stone-500">
          {request.delivery_city && <span>Location: <strong>{request.delivery_city}</strong></span>}
          {request.target_timeline && <span>Timeline: <strong>{request.target_timeline}</strong></span>}
          {request.budget && <span>Estimated Budget: <strong>₹{Number(request.budget).toLocaleString("en-IN")}</strong></span>}
        </div>
      </div>

      {/* Provider Quotations */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Received Quotations ({quotations.length})
        </h3>

        {quotations.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500">
            The service provider is reviewing your inquiry. Their commercial quotation will appear here.
          </div>
        ) : (
          quotations.map((q) => (
            <div
              key={q.id}
              className={`p-5 rounded-xl border transition ${
                q.status === "accepted"
                  ? "border-emerald-600 bg-emerald-50/30"
                  : "border-stone-200 bg-stone-50/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <div className="text-[10px] text-stone-400 font-mono">{q.quotation_number}</div>
                  <div className="text-2xl font-extrabold text-stone-900 mt-1">
                    ₹{Number(q.quoted_price).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Turnaround: <strong>{q.turnaround_days} Days</strong> • Valid until: {q.valid_until}
                  </div>
                </div>

                {q.status === "submitted" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondQuotation(q.id, "accept")}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accept Quote
                    </button>
                    <button
                      onClick={() => handleRespondQuotation(q.id, "reject")}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-100 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      q.status === "accepted"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {q.status}
                  </span>
                )}
              </div>

              <div className="pt-3 text-xs space-y-2 text-stone-600">
                <div>
                  <strong className="text-stone-900">Scope of Work:</strong> {q.scope_of_work}
                </div>
                {q.terms && (
                  <div>
                    <strong className="text-stone-900">Commercial Terms:</strong> {q.terms}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* History Timeline */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-4">
          Lifecycle Audit Trail
        </h3>
        <div className="space-y-4 text-xs">
          {request.history?.map((h: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-stone-900 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold uppercase tracking-wider text-stone-800 text-[11px]">
                  {h.new_status.replace("_", " ")}
                </div>
                {h.note && <div className="text-stone-600 mt-0.5">{h.note}</div>}
                <div className="text-[10px] text-stone-400 mt-0.5">
                  {new Date(h.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
