import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Inbox,
  MessageSquare,
  ArrowRight,
  MapPin,
  Calendar,
  Send,
  Phone,
  Mail,
  Package,
  X,
  CheckCircle2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierIncomingRfqsPage: React.FC = () => {
  const { user, business } = useAuth();
  const [activeTab, setActiveTab] = useState<"enquiries" | "rfqs">("enquiries");

  // Enquiries state
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isEnquiriesLoading, setIsEnquiriesLoading] = useState(true);

  // RFQs state
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isRfqsLoading, setIsRfqsLoading] = useState(true);

  // Quote modal state for guest enquiry
  const [quoteEnquiry, setQuoteEnquiry] = useState<any | null>(null);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("");
  const [quoteQuantity, setQuoteQuantity] = useState("100");
  const [quoteLeadTime, setQuoteLeadTime] = useState("7");
  const [quoteValidDays, setQuoteValidDays] = useState("14");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-id": user?.id || localStorage.getItem("coverly_user_id") || "",
    };
    if (business?.id) headers["x-business-id"] = business.id;
    return headers;
  };

  const fetchEnquiries = () => {
    setIsEnquiriesLoading(true);
    fetch(`${API_BASE}/wholesaler/enquiries`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setEnquiries(data.data.enquiries || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsEnquiriesLoading(false));
  };

  const fetchRfqs = () => {
    if (!business) return;
    setIsRfqsLoading(true);
    fetch(`${API_BASE}/rfqs/supplier/incoming?business_id=${business.id}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRecipients(Array.isArray(data.data) ? data.data : data.data?.items || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsRfqsLoading(false));
  };

  useEffect(() => {
    fetchEnquiries();
    fetchRfqs();
  }, [business, user]);

  const handleOpenQuoteModal = (enq: any) => {
    setQuoteEnquiry(enq);
    setQuoteQuantity(enq.target_quantity ? String(enq.target_quantity) : "100");
    setQuoteUnitPrice(enq.target_price ? String(enq.target_price) : "");
    setQuoteNotes("");
    setQuoteSuccess(false);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteEnquiry || !quoteUnitPrice) return;

    setIsSubmittingQuote(true);
    try {
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + Number(quoteValidDays));

      const payload = {
        valid_until: validUntilDate.toISOString().split("T")[0],
        lead_time_days: Number(quoteLeadTime),
        terms_and_conditions: quoteNotes.trim() || undefined,
        items: [
          {
            item_name: quoteEnquiry.products?.title || "Wholesale Sourcing Item",
            quantity: Number(quoteQuantity),
            unit_price: Number(quoteUnitPrice),
            unit: quoteEnquiry.products?.unit || "units",
          },
        ],
        response_notes: quoteNotes.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/wholesaler/enquiries/${quoteEnquiry.id}/quotation`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setQuoteSuccess(true);
        setTimeout(() => {
          setQuoteEnquiry(null);
          fetchEnquiries();
        }, 1500);
      } else {
        alert(body.error || "Failed to submit quotation.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit quotation.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Inquiries & Buyer Sourcing RFQs
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review customer inquiries for your products, respond with competitive wholesale quotations, and monitor tenders.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("enquiries")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "enquiries"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Direct Guest Enquiries
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700">
            {enquiries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("rfqs")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "rfqs"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          <Inbox className="w-4 h-4" />
          Procurement RFQs
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700">
            {recipients.length}
          </span>
        </button>
      </div>

      {/* TAB 1: GUEST ENQUIRIES */}
      {activeTab === "enquiries" && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          {isEnquiriesLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-800">No guest inquiries yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                When buyers browsing the marketplace send enquiries on your products, they will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                <tr>
                  <th className="py-3.5 px-4">Customer & Company</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Target Product & Requirement</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Received</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">{enq.name}</div>
                      <div className="text-[11px] text-stone-500">{enq.business || "Buyer"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-stone-800 font-medium">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {enq.phone}
                      </div>
                      {enq.email && (
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                          <Mail className="w-3 h-3 text-stone-400" />
                          {enq.email}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {enq.products?.title && (
                        <div className="font-semibold text-stone-900 truncate flex items-center gap-1 mb-0.5">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          {enq.products.title}
                        </div>
                      )}
                      <div className="text-stone-700 line-clamp-2">{enq.requirement}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          enq.status === "contacted"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {enq.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                      {new Date(enq.created_at).toLocaleDateString("en-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenQuoteModal(enq)}
                        className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        {enq.quotation_id ? "View/Update Quote" : "Send Quotation"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: PROCUREMENT RFQs */}
      {activeTab === "rfqs" && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          {isRfqsLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-800">No incoming RFQs right now</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                When buyers post requirements matching your manufacturing categories, they will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
                <tr>
                  <th className="py-3.5 px-4">RFQ Title & Number</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Required By</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recipients.map((rec) => {
                  const rfq = rec.rfqs;
                  if (!rfq) return null;
                  return (
                    <tr key={rec.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{rfq.title}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{rfq.rfq_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-stone-700">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {rfq.delivery_city} ({rfq.delivery_pincode})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {rfq.target_delivery_date || "Flexible"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                            rec.status === "quoted"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/supplier/rfqs/${rfq.id}/quote`}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition inline-flex items-center gap-1"
                        >
                          Submit Quote <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL: SUBMIT QUOTATION FOR GUEST ENQUIRY */}
      {quoteEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-base text-stone-900">Send Wholesale Quotation</h3>
                <p className="text-xs text-stone-500">To: {quoteEnquiry.name} ({quoteEnquiry.business})</p>
              </div>
              <button
                onClick={() => setQuoteEnquiry(null)}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quoteSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-stone-900">Quotation Submitted Successfully!</h4>
                <p className="text-xs text-stone-500">
                  The commercial proposal has been recorded in the database.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="mt-4 space-y-3.5 text-xs">
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-stone-700">
                  <div className="font-semibold text-stone-900 mb-0.5">Customer Requirement:</div>
                  <p className="line-clamp-3">{quoteEnquiry.requirement}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Unit Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="e.g. 450"
                      value={quoteUnitPrice}
                      onChange={(e) => setQuoteUnitPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Offered Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quoteQuantity}
                      onChange={(e) => setQuoteQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quoteLeadTime}
                      onChange={(e) => setQuoteLeadTime(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Validity (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quoteValidDays}
                      onChange={(e) => setQuoteValidDays(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Commercial Terms / Message to Customer
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Include payment terms, GST details, freight estimates..."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setQuoteEnquiry(null)}
                    className="px-4 py-2 border border-stone-200 rounded-lg font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingQuote ? "Submitting..." : "Submit Quotation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
