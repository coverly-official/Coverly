import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Copy,
  Send,
  Building2,
  ArrowRight,
  Factory,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BulkRfqPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedProduct = searchParams.get("product") || "";
  const preselectedMaterial = searchParams.get("material") || "";
  const preselectedSupplier = searchParams.get("supplier") || "";
  const preselectedSupplierName = searchParams.get("supplier_name") || "";

  const [rfqNumber, setRfqNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    material_name: preselectedMaterial || "",
    category_id: "rm-cat-industrial",
    required_quantity: "",
    unit: "metric_ton",
    material_grade: "",
    packaging_requirements: "Standard Commercial Packaging",
    delivery_city: "",
    delivery_state: "",
    delivery_pincode: "",
    target_delivery_date: "",
    budget: "",
    target_supplier_id: preselectedSupplier,
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    guest_company: "",
    notes: "",
  });

  const categories = [
    { id: "rm-cat-industrial", name: "Industrial Raw Materials (Iron, Steel, Copper, Chemicals)" },
    { id: "rm-cat-agri", name: "Agricultural Raw Materials (Paddy, Wheat, Cotton, Grains)" },
    { id: "rm-cat-food", name: "Food Processing Raw Materials (Flour, Edible Oils, Starch)" },
    { id: "rm-cat-polymers", name: "Plastic and Polymer Materials (HDPE, PVC, Granules)" },
    { id: "rm-cat-textiles", name: "Textile Raw Materials (Cotton Yarn, Polyester, Fibres)" },
    { id: "rm-cat-construction", name: "Construction Raw Materials (Cement, Rebars, Aggregates)" },
    { id: "rm-cat-packaging", name: "Paper and Packaging Raw Materials (Kraft Paper, Fluting)" },
    { id: "rm-cat-wood", name: "Wood and Furniture Materials (Timber, Commercial Plywood)" },
    { id: "rm-cat-electronics", name: "Electronics & Electrical Materials (Wires, Cables)" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData,
        required_quantity: parseFloat(formData.required_quantity),
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        target_supplier_id: formData.target_supplier_id || undefined,
      };

      const res = await fetch(`${API_BASE}/raw-materials/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setRfqNumber(json.data.rfq_number);
      } else {
        setErrorMessage(json.error || "Failed to submit bulk RFQ. Please verify details.");
      }
    } catch {
      setErrorMessage("Network error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (rfqNumber) {
      navigator.clipboard.writeText(rfqNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Factory className="w-4 h-4 text-amber-400" />
            COVERLY Bulk Raw Material Sourcing Desk
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Broadcast Bulk Raw Material RFQ
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Submit your material specifications, grade, and volume needs. Dispatched directly to verified primary manufacturers and commodity syndicates across India.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {rfqNumber ? (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 p-8 sm:p-10 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Raw Material RFQ Dispatched!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your bulk RFQ has been broadcast to verified suppliers and primary mills. You will receive itemized quotations with landed cost breakdowns within 24 hours.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Your RFQ Reference Number
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-xl font-extrabold text-indigo-700">
                  {rfqNumber}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                  title="Copy RFQ number"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <span className="text-[11px] text-emerald-600 font-semibold">Copied to clipboard!</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
              <div>
                <div className="font-semibold text-slate-800">1. Mill Matching</div>
                <div className="text-slate-500 mt-0.5">Dispatched to verified suppliers matching grade and location.</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">2. Itemized Quotes</div>
                <div className="text-slate-500 mt-0.5">Suppliers provide landed freight, loading, and GST quotes.</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">3. Single Acceptance</div>
                <div className="text-slate-500 mt-0.5">Accept one quote to generate a binding purchase order.</div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/raw-materials"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                Back to Raw Material Hub
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => {
                  setRfqNumber(null);
                  setFormData({
                    material_name: "",
                    category_id: "rm-cat-industrial",
                    required_quantity: "",
                    unit: "metric_ton",
                    material_grade: "",
                    packaging_requirements: "Standard Commercial Packaging",
                    delivery_city: "",
                    delivery_state: "",
                    delivery_pincode: "",
                    target_delivery_date: "",
                    budget: "",
                    target_supplier_id: "",
                    guest_name: "",
                    guest_email: "",
                    guest_phone: "",
                    guest_company: "",
                    notes: "",
                  });
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Post Another RFQ
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10">
            {preselectedSupplierName && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Direct RFQ specifically targeted to{" "}
                  <strong>{decodeURIComponent(preselectedSupplierName)}</strong>.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* Sourcing Specifications */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  1. Raw Material Specifications
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Material Domain *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) =>
                          setFormData({ ...formData, category_id: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Material / Commodity Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TMT Steel Rebar Fe 550D or Basmati Paddy Pusa 1121"
                        value={formData.material_name}
                        onChange={(e) =>
                          setFormData({ ...formData, material_name: e.target.value })
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
                        type="number"
                        required
                        placeholder="e.g. 50"
                        value={formData.required_quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, required_quantity: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Unit of Measurement *
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      >
                        <option value="metric_ton">Metric Ton (MT)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="piece">Piece (pc)</option>
                        <option value="litre">Litre (L)</option>
                        <option value="metre">Metre (m)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Material Grade / Standard
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fe 550D, Virgin MFI 20, AGMARK 1"
                        value={formData.material_grade}
                        onChange={(e) =>
                          setFormData({ ...formData, material_grade: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Packaging & Quality Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Specify packaging (e.g. 50kg HDPE bags, strapped 2MT bundles), test certificate requirements, or allowable moisture levels..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Destination & Logistics */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  2. Delivery & Timeline
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Destination City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune or Faridabad"
                      value={formData.delivery_city}
                      onChange={(e) =>
                        setFormData({ ...formData, delivery_city: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={formData.delivery_state}
                      onChange={(e) =>
                        setFormData({ ...formData, delivery_state: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.target_delivery_date}
                      onChange={(e) =>
                        setFormData({ ...formData, target_delivery_date: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  3. Buyer & Enterprise Details
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
                        placeholder="e.g. Gaurav Aggarwal"
                        value={formData.guest_name}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enterprise Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Aggarwal Infra Projects LLP"
                        value={formData.guest_company}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_company: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                        placeholder="e.g. gaurav@aggarwalinfra.in"
                        value={formData.guest_email}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_email: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98100 44556"
                        value={formData.guest_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, guest_phone: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Free Service • Direct Factory Pricing • Verified Mills Only
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "Transmitting RFQ..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Broadcast Bulk RFQ
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
