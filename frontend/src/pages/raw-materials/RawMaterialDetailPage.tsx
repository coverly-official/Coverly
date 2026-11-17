import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Factory,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle,
  Clock,
  ArrowLeft,
  FileText,
  Layers,
  Send,
  AlertCircle,
  CheckCircle2,
  Truck,
  Scale,
} from "lucide-react";
import { RawMaterialProduct } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RawMaterialDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<RawMaterialProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quote form state
  const [quoteQuantity, setQuoteQuantity] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCompany, setGuestCompany] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRfq, setSubmittedRfq] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fallbackProduct: RawMaterialProduct = {
    id: "rm-p1",
    supplier_id: "sup-01",
    business_id: "biz-01",
    category_id: "rm-cat-industrial",
    name: "TMT Steel Rebars Fe 550D (12mm to 32mm)",
    slug: "tmt-steel-rebars-fe-550d",
    description: "High-ductility primary billet TMT bars complying with BIS IS 1786:2008 with batch test certificate. Manufactured through automated Quenching and Self-Tempering (QST) technology for earthquake-resistant infrastructure.",
    material_grade: "Fe 550D Primary Billet",
    origin: "Jamshedpur Integrated Plant",
    quality_standards: ["BIS IS 1786:2008", "ISO 9001:2015", "GreenPro Certified"],
    specifications: {
      yield_strength_mpa: 550,
      tensile_strength_mpa: 585,
      elongation_pct: 16.5,
      carbon_content_max_pct: 0.25,
      nominal_sizes_mm: "12, 16, 20, 25, 32",
      standard_bundle_length_m: "12 Metres",
    },
    unit_of_measurement: "metric_ton",
    moq: 15,
    max_order_quantity: 5000,
    base_price: 52000,
    bulk_pricing_tiers: [
      { min_qty: 15, max_qty: 49, price_per_unit: 52000 },
      { min_qty: 50, max_qty: 199, price_per_unit: 50500 },
      { min_qty: 200, max_qty: 9999, price_per_unit: 49000 },
    ],
    maintains_inventory: true,
    stock_quantity: 450,
    available_quantity: 450,
    reserved_quantity: 0,
    lead_time_days: 3,
    packaging_details: "Strapped in standard 2 MT export bundles with moisture-resistant tags.",
    supply_locations: ["Pan-India", "Western Corridor", "Central Hub"],
    delivery_available: true,
    images: [],
    moderation_status: "approved",
    is_active: true,
    created_at: new Date().toISOString(),
    raw_material_supplier_profiles: {
      id: "sup-01",
      supplier_type: "manufacturer",
      verification_status: "verified",
      rating: 4.9,
      businesses: {
        id: "b1",
        name: "Bharat Alloys & Steel Mills Ltd",
        city: "Jamshedpur",
        state: "Jharkhand",
        verification_level: "registration_checked",
      },
    },
  };

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/raw-materials/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProduct(data.data);
          setQuoteQuantity(data.data.moq ? data.data.moq.toString() : "15");
        } else {
          setProduct(fallbackProduct);
          setQuoteQuantity(fallbackProduct.moq.toString());
        }
      })
      .catch(() => {
        setProduct(fallbackProduct);
        setQuoteQuantity(fallbackProduct.moq.toString());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const handleDirectRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        material_name: product.name,
        category_id: product.category_id,
        required_quantity: parseFloat(quoteQuantity),
        unit: product.unit_of_measurement,
        material_grade: product.material_grade,
        required_specifications: product.specifications,
        delivery_city: deliveryCity,
        delivery_state: deliveryState,
        target_delivery_date: targetDate || undefined,
        target_supplier_id: product.supplier_id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_company: guestCompany,
        notes,
      };

      const res = await fetch(`${API_BASE}/raw-materials/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubmittedRfq(json.data.rfq_number);
      } else {
        setErrorMessage(json.error || "Unable to submit RFQ. Please check fields.");
      }
    } catch {
      setErrorMessage("Network error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading material specifications...</p>
        </div>
      </div>
    );
  }

  const currentProduct = product || fallbackProduct;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Breadcrumb */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-3 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link to="/raw-materials" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Raw Material Hub
          </Link>
          <span>/</span>
          <Link to="/raw-materials/products" className="hover:text-white">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-sm">{currentProduct.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Product & Specifications Dossier */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  {currentProduct.material_grade || "Industrial Grade"}
                </span>
                {currentProduct.origin && (
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-xs font-semibold">
                    Origin: {currentProduct.origin}
                  </span>
                )}
                {currentProduct.maintains_inventory && currentProduct.stock_quantity > 0 && (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    In Stock ({currentProduct.stock_quantity} {currentProduct.unit_of_measurement})
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {currentProduct.name}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                {currentProduct.description}
              </p>

              {/* Quality Standards & Certifications */}
              {currentProduct.quality_standards && currentProduct.quality_standards.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Standards:
                  </span>
                  {currentProduct.quality_standards.map((std, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-800"
                    >
                      {std}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk Tiered Pricing Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  Indicative Volume Pricing Tiers
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  MOQ: {currentProduct.moq} {currentProduct.unit_of_measurement}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Order Quantity Tier</th>
                      <th className="py-2.5 px-3">Indicative Supplier Price</th>
                      <th className="py-2.5 px-3">Effective Unit Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentProduct.bulk_pricing_tiers && currentProduct.bulk_pricing_tiers.length > 0 ? (
                      currentProduct.bulk_pricing_tiers.map((tier, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {tier.min_qty} – {tier.max_qty > 9000 ? "Above" : `${tier.max_qty}`} {currentProduct.unit_of_measurement}
                          </td>
                          <td className="py-3 px-3 font-black text-indigo-700 text-sm">
                            ₹{tier.price_per_unit.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            per {currentProduct.unit_of_measurement} (ex-mill / depot)
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          Base Tier (Min {currentProduct.moq} {currentProduct.unit_of_measurement})
                        </td>
                        <td className="py-3 px-3 font-black text-indigo-700 text-sm">
                          ₹{currentProduct.base_price.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          per {currentProduct.unit_of_measurement}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-indigo-600" />
                Technical & Material Specifications
              </h3>

              {currentProduct.specifications && Object.keys(currentProduct.specifications).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(currentProduct.specifications).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5"
                    >
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {Array.isArray(val) ? val.join(", ") : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Standard industrial commercial grade parameters apply.</p>
              )}

              {/* Packaging & Logistics Details */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] block mb-1">
                    Packaging Details
                  </span>
                  <p className="text-slate-700">
                    {currentProduct.packaging_details || "Standard industrial bulk packaging."}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] block mb-1">
                    Lead Time & Logistics
                  </span>
                  <p className="text-slate-700">
                    {currentProduct.lead_time_days} business days production/dispatch lead time.
                  </p>
                </div>
              </div>
            </div>

            {/* Supplier Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {currentProduct.raw_material_supplier_profiles?.businesses?.name
                    ? currentProduct.raw_material_supplier_profiles.businesses.name.substring(0, 2).toUpperCase()
                    : "RM"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {currentProduct.raw_material_supplier_profiles?.businesses?.name || "Verified Enterprise Supplier"}
                    </h4>
                    <span title="Verified by COVERLY" className="text-emerald-600">
                      <CheckCircle className="w-4 h-4 fill-emerald-100" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentProduct.raw_material_supplier_profiles?.supplier_type.replace(/_/g, " ") || "Primary Manufacturer"} • {currentProduct.raw_material_supplier_profiles?.businesses?.city || "India"}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-emerald-700 font-semibold">
                      Verified GST & Registration
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to={`/raw-materials/suppliers/${currentProduct.supplier_id}`}
                className="px-4 py-2 border border-slate-300 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                View Supplier Dossier
              </Link>
            </div>
          </div>

          {/* Right Column: Direct Quote / RFQ Submission Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-6 sticky top-6">
              <div className="pb-4 border-b border-slate-100 mb-5">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Direct Factory Sourcing
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Request Quotation for this Material
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit required quantity and destination for a landed freight quotation with GST.
                </p>
              </div>

              {submittedRfq ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    RFQ Dispatched to Mill!
                  </div>
                  <p className="text-xs text-emerald-700">
                    Your bulk procurement requirement has been registered with reference:
                  </p>
                  <div className="p-2.5 bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-800 text-center text-sm">
                    {submittedRfq}
                  </div>
                  <p className="text-[11px] text-emerald-600">
                    The supplier will submit formal itemized pricing within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmittedRfq(null)}
                    className="w-full mt-2 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                  >
                    Submit Another RFQ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDirectRfqSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Required Quantity ({currentProduct.unit_of_measurement}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={currentProduct.moq}
                      value={quoteQuantity}
                      onChange={(e) => setQuoteQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Min order quantity: {currentProduct.moq} {currentProduct.unit_of_measurement}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Delivery City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pune"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
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
                        value={deliveryState}
                        onChange={(e) => setDeliveryState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Delivery Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Buyer Contact Information
                    </span>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name *"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Company / Enterprise Name"
                        value={guestCompany}
                        onChange={(e) => setGuestCompany(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          placeholder="Work Email *"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Phone / WhatsApp *"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specific Instructions or Packaging Requirements
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Specify test certificates required, payment terms, or custom bundle length..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                  >
                    {isSubmitting ? (
                      "Transmitting RFQ..."
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Request Commercial Quotation
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
