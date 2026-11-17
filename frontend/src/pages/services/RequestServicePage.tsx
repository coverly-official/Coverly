import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Send, Building2, Briefcase, ArrowRight, CheckCircle, ShieldCheck, Clock, FileCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RequestServicePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillServiceId = searchParams.get("service_id") || "";
  const prefillProviderId = searchParams.get("provider_business_id") || "";
  const prefillTitle = searchParams.get("title") || "";
  const prefillCategory = searchParams.get("category_id") || "";

  const [title, setTitle] = useState(prefillTitle ? `Inquiry for ${prefillTitle}` : "");
  const [requirements, setRequirements] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [targetTimeline, setTargetTimeline] = useState("Within 2 weeks");
  const [budget, setBudget] = useState("");
  const [providerBusinessId, setProviderBusinessId] = useState(prefillProviderId);
  const [providers, setProviders] = useState<any[]>([]);

  // Guest Fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestBusinessName, setGuestBusinessName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedEnquiry, setSubmittedEnquiry] = useState<any | null>(null);

  useEffect(() => {
    // Fetch providers if not prefilled
    fetch(`${API_BASE}/business-services/providers`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProviders(Array.isArray(d.data) ? d.data : (d.data?.items || []));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requirements.trim()) {
      setErrorMsg("Please provide an enquiry title and detailed requirements.");
      return;
    }

    if (!user && (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim())) {
      setErrorMsg("Please provide your name, email, and phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/business-services/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user?.id || null,
          service_id: prefillServiceId || null,
          provider_business_id: providerBusinessId || null,
          category_id: prefillCategory || null,
          title: title.trim(),
          requirements: requirements.trim(),
          delivery_city: deliveryCity.trim() || null,
          target_timeline: targetTimeline.trim() || null,
          budget: budget ? Number.parseFloat(budget) : null,
          guest_name: user ? user.full_name : guestName.trim(),
          guest_email: user ? user.email : guestEmail.trim(),
          guest_phone: user ? user.phone : guestPhone.trim(),
          guest_business_name: guestBusinessName.trim() || null,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to submit request.");
      }

      if (user) {
        navigate(`/services/my-requests/${body.data.id}`);
      } else {
        setSubmittedEnquiry(body.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedEnquiry) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              Enquiry Submitted Successfully
            </span>
            <h2 className="text-2xl font-black text-emerald-950 mt-3">
              Your Professional Requirement is Dispatched!
            </h2>
            <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
              Verified service providers will review your requirements and submit formal quotations.
            </p>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-stone-500 font-medium">Enquiry Reference ID:</span>
              <span className="font-mono font-bold text-blue-700">{submittedEnquiry.request_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500 font-medium">Service Scope:</span>
              <span className="font-semibold text-stone-900">{submittedEnquiry.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500 font-medium">Contact Registered:</span>
              <span className="text-stone-700">{submittedEnquiry.guest_email || submittedEnquiry.guest_phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500 font-medium">Target Timeline:</span>
              <span className="text-stone-700">{submittedEnquiry.target_timeline || "Flexible"}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to={`/auth/register?role=buyer&email=${encodeURIComponent(guestEmail)}&ref=${encodeURIComponent(submittedEnquiry.request_number)}`}
              className="py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition shadow-sm text-center"
            >
              Create Account to Accept Quotations & Track Projects →
            </Link>
            <Link
              to="/services"
              className="py-3 px-6 bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs rounded-xl transition border border-stone-200 text-center"
            >
              Browse More Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
        <Link to="/" className="hover:text-blue-700">Home</Link>
        <span>/</span>
        <Link to="/services" className="hover:text-blue-700">Services</Link>
        <span>/</span>
        <span className="text-stone-800 font-semibold">Request Service</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Request Professional Business Service</h1>
        <p className="text-xs text-stone-500 mt-1">
          Submit your scope of requirements without registration to receive formal quotations and milestone proposals.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Guest Contact Information Section (if unauthenticated) */}
        {!user && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Contact Information (For Quotation Delivery)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Company / Firm Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kumar Industries Pvt Ltd"
                  value={guestBusinessName}
                  onChange={(e) => setGuestBusinessName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Business Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@kumarindustries.in"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Target Provider Option */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Target Service Provider (Optional - Leave blank for multi-provider matching)
          </label>
          <select
            value={providerBusinessId}
            onChange={(e) => setProviderBusinessId(e.target.value)}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white cursor-pointer"
          >
            <option value="">Any Verified Provider in this Category (Recommended)</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city || "All India"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Inquiry / Project Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Company Incorporation, Trademark Registration & GST Filing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Detailed Requirements & Deliverable Expectations *</label>
          <textarea
            required
            rows={4}
            placeholder="Detail your requirements, current stage of business, statutory deadlines, or specific deliverables required..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">City / Region</label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Surat, Delhi"
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Target Timeline</label>
            <select
              value={targetTimeline}
              onChange={(e) => setTargetTimeline(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg bg-white cursor-pointer"
            >
              <option value="Urgent (Within 48 hours)">Urgent (Within 48 hours)</option>
              <option value="Within 1 week">Within 1 week</option>
              <option value="Within 2 weeks">Within 2 weeks</option>
              <option value="Within 1 month">Within 1 month</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Budget Expectation (₹ Optional)</label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-200 rounded-lg"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Link to="/services" className="text-xs text-stone-500 hover:text-stone-800">
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Dispatch Service Requirement"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
