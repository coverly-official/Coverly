import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Building2,
  Send,
  MapPin,
  Clock,
  ArrowRight,
  Copy,
  Users,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SubmitBusinessRequirementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedAgent = searchParams.get("agent");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadNumber, setLeadNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    guest_company: "",
    requirement_category: "Industrial Machinery",
    product_or_service: "",
    quantity: "",
    budget: "",
    location_city: "",
    location_state: "",
    description: "",
    priority: "medium",
    preferred_agent_id: preselectedAgent || "",
  });

  const categories = [
    "Industrial Machinery",
    "Electrical Equipment",
    "Packaging Materials",
    "Raw Materials",
    "Construction Materials",
    "Agriculture Products",
    "Food & Beverages",
    "Chemicals & Solvents",
    "Textiles & Garments",
    "Electronics & Components",
    "Healthcare Supplies",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      const res = await fetch(`${API_BASE}/sales-agents/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLeadNumber(json.data.lead_number);
      } else {
        setErrorMessage(json.error || "Failed to submit requirement. Please check required fields.");
      }
    } catch {
      setErrorMessage("Network error connecting to COVERLY server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (leadNumber) {
      navigator.clipboard.writeText(leadNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            COVERLY Enterprise Sourcing Desk
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Submit Your Business Sourcing Requirement
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Broadcast your product or material needs to our nationwide network of verified sales agents, authorized factory representatives, and primary manufacturers.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {leadNumber ? (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 p-8 sm:p-10 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Sourcing Requirement Registered!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your requirement has been securely submitted to the COVERLY Representative Network. A verified agent will reach out within 2 to 4 business hours.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Your Tracking Reference Number
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-xl font-extrabold text-indigo-700">
                  {leadNumber}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                  title="Copy reference number"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <span className="text-[11px] text-emerald-600 font-semibold">Copied to clipboard!</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
              <div>
                <div className="font-semibold text-slate-800">1. Agent Matching</div>
                <div className="text-slate-500 mt-0.5">Matched by industry category and city territory.</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">2. Commercial Quote</div>
                <div className="text-slate-500 mt-0.5">Agent negotiates directly with vetted manufacturers.</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">3. Safe Fulfillment</div>
                <div className="text-slate-500 mt-0.5">COVERLY escrow & milestone tracking guarantee.</div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/sales-agents"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                Browse Sales Agents
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => {
                  setLeadNumber(null);
                  setFormData({
                    guest_name: "",
                    guest_email: "",
                    guest_phone: "",
                    guest_company: "",
                    requirement_category: "Industrial Machinery",
                    product_or_service: "",
                    quantity: "",
                    budget: "",
                    location_city: "",
                    location_state: "",
                    description: "",
                    priority: "medium",
                    preferred_agent_id: "",
                  });
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* Requirement Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  1. Sourcing Specifications
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Industry Category *
                      </label>
                      <select
                        value={formData.requirement_category}
                        onChange={(e) =>
                          setFormData({ ...formData, requirement_category: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Product / Material / Service Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mild Steel Billets 100mm or Food Grade BOPP Film"
                        value={formData.product_or_service}
                        onChange={(e) =>
                          setFormData({ ...formData, product_or_service: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Required Quantity *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 50 MT or 25,000 units"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Estimated Budget (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 850000"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Urgency / Timeline
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        <option value="low">Standard (15-30 days)</option>
                        <option value="medium">Normal (7-14 days)</option>
                        <option value="high">Urgent (Within 7 days)</option>
                        <option value="urgent">Immediate (Within 48 hrs)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Detailed Technical Specifications & Sourcing Notes *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Specify material grade, certifications (ISO, BIS), packaging parameters, payment terms, or recurring schedule requirements..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Business Location & Destination */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  2. Destination & Delivery Logistics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Destination City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune, Surat, Faridabad, Coimbatore"
                      value={formData.location_city}
                      onChange={(e) =>
                        setFormData({ ...formData, location_city: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra, Gujarat, Haryana"
                      value={formData.location_state}
                      onChange={(e) =>
                        setFormData({ ...formData, location_state: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  3. Contact & Enterprise Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Malhotra"
                        value={formData.guest_name}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enterprise / Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Malhotra Textiles Pvt Ltd"
                        value={formData.guest_company}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_company: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Work Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. vikram@malhotratex.com"
                        value={formData.guest_email}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_email: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98201 12345"
                        value={formData.guest_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_phone: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Free Service • Direct Factory Pricing • Verified Representatives
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "Registering Requirement..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post Sourcing Requirement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
