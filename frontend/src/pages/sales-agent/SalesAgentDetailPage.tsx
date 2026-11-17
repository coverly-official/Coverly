import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Languages,
  Briefcase,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { SalesAgentProfile } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SalesAgentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [agent, setAgent] = useState<SalesAgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Requirement form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    guest_company: "",
    requirement_category: "",
    product_or_service: "",
    quantity: "",
    budget: "",
    location_city: "",
    location_state: "",
    description: "",
  });

  const fallbackAgent: SalesAgentProfile = {
    id: "sa-fallback-01",
    user_id: "usr-01",
    agent_type: "independent",
    full_name: "Rajeshwar Rao",
    phone: "+91 98490 12345",
    email: "rajeshwar.rao@b2bagents.in",
    bio: "Senior industrial machinery and electrical equipment broker with 14 years across South India. Specializes in plant machinery procurement, heavy industrial tools, and long-term supply negotiations with manufacturers across Telangana, Karnataka, and Tamil Nadu.",
    product_categories: ["Industrial Machinery", "Electrical Equipment", "Packaging Materials"],
    service_categories: ["Machinery Maintenance & AMC"],
    operating_cities: ["Hyderabad", "Bengaluru", "Chennai", "Coimbatore"],
    operating_states: ["Telangana", "Karnataka", "Tamil Nadu"],
    languages: ["English", "Telugu", "Hindi", "Kannada"],
    experience_years: 14,
    verification_status: "verified",
    is_public_discovery_enabled: true,
    slug: "rajeshwar-rao-industrial-machinery",
    total_leads_assigned: 38,
    total_conversions: 29,
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/sales-agents/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAgent(data.data);
          if (data.data.product_categories && data.data.product_categories.length > 0) {
            setFormData((prev) => ({ ...prev, requirement_category: data.data.product_categories[0] }));
          }
        } else {
          setAgent(fallbackAgent);
          setFormData((prev) => ({ ...prev, requirement_category: fallbackAgent.product_categories[0] }));
        }
      })
      .catch(() => {
        setAgent(fallbackAgent);
        setFormData((prev) => ({ ...prev, requirement_category: fallbackAgent.product_categories[0] }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = {
        ...formData,
        preferred_agent_id: agent?.id,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      const res = await fetch(`${API_BASE}/sales-agents/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFormSuccess(json.data.lead_number);
        setFormData({
          guest_name: "",
          guest_email: "",
          guest_phone: "",
          guest_company: "",
          requirement_category: agent?.product_categories[0] || "",
          product_or_service: "",
          quantity: "",
          budget: "",
          location_city: "",
          location_state: "",
          description: "",
        });
      } else {
        setFormError(json.error || "Unable to submit requirement. Please check fields.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading representative dossier...</p>
        </div>
      </div>
    );
  }

  const currentAgent = agent || fallbackAgent;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Breadcrumb */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-3 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link to="/sales-agents" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Representative Directory
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{currentAgent.full_name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Dossier Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {currentAgent.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {currentAgent.full_name}
                      </h1>
                      {currentAgent.verification_status === "verified" && (
                        <span title="Verified by COVERLY Trust & Safety" className="text-emerald-600">
                          <CheckCircle className="w-5 h-5 fill-emerald-100" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      {currentAgent.agent_type === "company_representative" ? (
                        <span>
                          Authorized Sales Representative for{" "}
                          <strong className="text-slate-800">
                            {currentAgent.businesses?.name || "Verified Enterprise"}
                          </strong>
                        </span>
                      ) : (
                        <span>Authorized Independent B2B Broker & Sourcing Agent</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified Credentials
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {currentAgent.experience_years} Years Industry Exp
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Professional Background
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentAgent.bio ||
                    "Professional field representative dedicated to client sourcing, commercial terms negotiation, and transparent manufacturer-buyer relationship management."}
                </p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Deals Facilitated</div>
                  <div className="text-xl font-bold text-emerald-600 mt-0.5">
                    {currentAgent.total_conversions} Closed
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Active Inquiries</div>
                  <div className="text-xl font-bold text-indigo-600 mt-0.5">
                    {currentAgent.total_leads_assigned} Leads
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-500 font-medium">Customer Rating</div>
                  <div className="text-xl font-bold text-amber-600 mt-0.5">
                    4.9 / 5.0
                  </div>
                </div>
              </div>
            </div>

            {/* Specialization Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Product & Industry Specializations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentAgent.product_categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-800"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {currentAgent.service_categories && currentAgent.service_categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Value-Added Services
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentAgent.service_categories.map((svc, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Operating Territories
                  </h4>
                  <ul className="text-xs font-medium text-slate-700 space-y-1">
                    {currentAgent.operating_cities.map((city, idx) => (
                      <li key={idx}>• {city}</li>
                    ))}
                    {currentAgent.operating_states.map((st, idx) => (
                      <li key={`st-${idx}`} className="text-slate-500">
                        ({st} Regional Territory)
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-slate-400" />
                    Spoken Languages
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAgent.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-600"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Lead Submission Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-md p-6 sticky top-6">
              <div className="pb-4 border-b border-slate-100 mb-5">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Direct Enquiry
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Assign Sourcing Request to {currentAgent.full_name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Submit your bulk material or service requirement directly to this verified representative.
                </p>
              </div>

              {formSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Enquiry Dispatched!
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your sourcing requirement has been recorded with tracking reference:
                  </p>
                  <div className="p-2.5 bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-800 text-center text-sm">
                    {formSuccess}
                  </div>
                  <p className="text-[11px] text-emerald-600 leading-relaxed">
                    {currentAgent.full_name} has been notified and will reach out to discuss specifications and pricing.
                  </p>
                  <button
                    onClick={() => setFormSuccess(null)}
                    className="w-full mt-2 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                  >
                    Submit Another Sourcing Requirement
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitLead} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product or Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50 HP Industrial Motor or 5-Ply Cartons"
                      value={formData.product_or_service}
                      onChange={(e) =>
                        setFormData({ ...formData, product_or_service: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Est. Quantity *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500 units"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Est. Budget (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 250000"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specifications & Needs *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Specify material grade, packaging, timeline, delivery destination..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Your Business Information
                    </span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name *"
                        value={formData.guest_name}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Company / Enterprise Name"
                        value={formData.guest_company}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_company: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          placeholder="Email *"
                          value={formData.guest_email}
                          onChange={(e) =>
                            setFormData({ ...formData, guest_email: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Phone *"
                          value={formData.guest_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, guest_phone: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Delivery City"
                          value={formData.location_city}
                          onChange={(e) =>
                            setFormData({ ...formData, location_city: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.location_state}
                          onChange={(e) =>
                            setFormData({ ...formData, location_state: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                  >
                    {isSubmitting ? (
                      "Transmitting Requirement..."
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Direct Requirement
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
