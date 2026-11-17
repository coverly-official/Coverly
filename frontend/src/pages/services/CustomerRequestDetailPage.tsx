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
  MessageSquare,
  ArrowUpDown,
  Send,
  Star,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const CustomerRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Negotiation Drawer / Thread State
  const [activeNegotiateQuoteId, setActiveNegotiateQuoteId] = useState<string | null>(null);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedTurnaround, setProposedTurnaround] = useState("");
  const [isSendingNegotiation, setIsSendingNegotiation] = useState(false);

  // Review Form State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const loadNegotiations = (quoteId: string) => {
    if (activeNegotiateQuoteId === quoteId) {
      setActiveNegotiateQuoteId(null);
      return;
    }
    setActiveNegotiateQuoteId(quoteId);
    fetch(`${API_BASE}/business-services/quotations/${quoteId}/negotiations`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNegotiations(data.data || []);
      })
      .catch(() => {});
  };

  const handleSendNegotiation = async (e: React.FormEvent, quoteId: string) => {
    e.preventDefault();
    if (!user || !negotiationMessage.trim()) return;
    setIsSendingNegotiation(true);

    try {
      const res = await fetch(`${API_BASE}/business-services/quotations/${quoteId}/negotiations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,
          sender_role: "customer",
          message: negotiationMessage.trim(),
          proposed_price: proposedPrice ? Number.parseFloat(proposedPrice) : null,
          proposed_turnaround_days: proposedTurnaround ? Number.parseInt(proposedTurnaround, 10) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNegotiations((prev) => [...prev, data.data]);
        setNegotiationMessage("");
        setProposedPrice("");
        setProposedTurnaround("");
      } else {
        alert(data.error || "Failed to send negotiation.");
      }
    } catch {
      alert("Network error sending negotiation message.");
    } finally {
      setIsSendingNegotiation(false);
    }
  };

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !request || !reviewText.trim()) return;
    setIsSubmittingReview(true);

    try {
      // Find linked project or pass request.id as reference
      const res = await fetch(`${API_BASE}/business-services/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: request.id,
          customer_id: user.id,
          rating: reviewRating,
          review_text: reviewText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Thank you! Your verified review has been published.");
        setShowReviewModal(false);
        setReviewText("");
        fetchRequest();
      } else {
        alert(data.error || "Failed to submit review.");
      }
    } catch {
      alert("Network error submitting review.");
    } finally {
      setIsSubmittingReview(false);
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
            Target Firm: {request.businesses?.name || "Multiple Providers"} • Created: {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          {request.status === "completed" && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition flex items-center gap-2 self-start shadow-xs"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Write Verified Review
            </button>
          )}
        </div>
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

      {/* Quotation Comparison Matrix (when 2+ quotations) */}
      {quotations.length > 1 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-stone-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
              Quotation Comparison Matrix
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-[11px] font-bold">
                  <th className="py-2.5 px-3">Quotation #</th>
                  <th className="py-2.5 px-3">Provider Firm</th>
                  <th className="py-2.5 px-3">Quoted Price</th>
                  <th className="py-2.5 px-3">Turnaround</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {quotations.map((q) => (
                  <tr key={q.id} className={q.status === "accepted" ? "bg-emerald-50/50" : ""}>
                    <td className="py-2.5 px-3 font-mono font-medium">{q.quotation_number}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{q.businesses?.name || "Professional Firm"}</td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">₹{Number(q.quoted_price).toLocaleString("en-IN")}</td>
                    <td className="py-2.5 px-3 text-stone-600">{q.turnaround_days} Days</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        q.status === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      {q.status === "submitted" && (
                        <button
                          onClick={() => handleRespondQuotation(q.id, "accept")}
                          className="px-2.5 py-1 bg-stone-900 text-white rounded text-[11px] font-semibold hover:bg-stone-800"
                        >
                          Accept
                        </button>
                      )}
                      <button
                        onClick={() => loadNegotiations(q.id)}
                        className="px-2.5 py-1 border border-stone-300 rounded text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Negotiate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provider Quotations Cards */}
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadNegotiations(q.id)}
                    className="px-3 py-1.5 border border-stone-300 bg-white rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                    {activeNegotiateQuoteId === q.id ? "Close Chat" : "Negotiate"}
                  </button>

                  {q.status === "submitted" ? (
                    <>
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
                    </>
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

              {/* Inline Negotiation / Counter-Offer Thread */}
              {activeNegotiateQuoteId === q.id && (
                <div className="mt-4 pt-4 border-t border-stone-200 space-y-3 bg-white p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-stone-700" />
                      Negotiation Thread & Counter-Offers
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">Direct communication with provider</span>
                  </div>

                  {/* Previous messages */}
                  <div className="max-h-48 overflow-y-auto space-y-2 text-xs pr-1">
                    {negotiations.length === 0 ? (
                      <div className="text-stone-400 text-center py-2 text-[11px]">
                        No negotiation messages yet. Propose a counter-price or timeline below.
                      </div>
                    ) : (
                      negotiations.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-lg text-xs ${
                            msg.sender_role === "customer"
                              ? "bg-stone-100 text-stone-800 ml-6"
                              : "bg-blue-50 text-blue-950 mr-6"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                            <span className="font-semibold capitalize">{msg.sender_role}</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div>{msg.message}</div>
                          {(msg.proposed_price || msg.proposed_turnaround_days) && (
                            <div className="mt-1 pt-1 border-t border-stone-200/50 flex gap-3 font-semibold text-[11px] text-stone-900">
                              {msg.proposed_price && <span>Offered: ₹{Number(msg.proposed_price).toLocaleString("en-IN")}</span>}
                              {msg.proposed_turnaround_days && <span>Days: {msg.proposed_turnaround_days}d</span>}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Send counter-offer form */}
                  <form onSubmit={(e) => handleSendNegotiation(e, q.id)} className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-stone-500 block mb-0.5">Counter Price (₹ optional)</label>
                        <input
                          type="number"
                          placeholder="e.g. 18000"
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs focus:ring-1 focus:ring-stone-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-stone-500 block mb-0.5">Target Days (optional)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5"
                          value={proposedTurnaround}
                          onChange={(e) => setProposedTurnaround(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs focus:ring-1 focus:ring-stone-800"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type counter-offer message or specific condition..."
                        value={negotiationMessage}
                        onChange={(e) => setNegotiationMessage(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-stone-200 rounded text-xs focus:ring-1 focus:ring-stone-800"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSendingNegotiation || !negotiationMessage.trim()}
                        className="px-3.5 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              )}
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900">Write Verified Review</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? "text-amber-400 fill-amber-400" : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-700 ml-2">{reviewRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Your Feedback & Experience</label>
                <textarea
                  rows={4}
                  placeholder="Detail the quality of deliverables, turnaround speed, and professional communication..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full p-3 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-800"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewText.trim()}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 disabled:opacity-50"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Verified Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
