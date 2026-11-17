import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Globe,
  Ship,
  Package,
  Layers,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Send,
  AlertCircle,
  FileText,
  DollarSign,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { InternationalProduct } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const InternationalProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<InternationalProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick RFQ Modal
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqQuantity, setRfqQuantity] = useState("");
  const [rfqDestCountry, setRfqDestCountry] = useState("United Arab Emirates");
  const [rfqDestPort, setRfqDestPort] = useState("Jebel Ali Port, Dubai");
  const [rfqIncoterm, setRfqIncoterm] = useState("CIF");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/import-export/products/${slug}`);
        if (!res.ok) throw new Error("International product not found.");
        const json = await res.json();
        if (json.success && json.data) {
          setProduct(json.data);
          setRfqQuantity(json.data.moq?.toString() || "20");
        } else {
          throw new Error(json.error || "Failed to load product.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleQuickRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmitting(true);
    try {
      const payload = {
        direction: "import",
        category_id: product.category_id,
        product_id: product.id,
        product_name: product.name,
        hs_code_preference: product.hs_code,
        destination_country: rfqDestCountry,
        destination_port: rfqDestPort,
        preferred_incoterm: rfqIncoterm,
        required_quantity: parseFloat(rfqQuantity),
        unit: product.unit_of_measurement,
        target_currency: product.currency,
        target_party_id: product.party_id,
        guest_email: guestEmail || undefined,
        guest_phone: guestPhone || undefined,
        additional_instructions: `Direct enquiry for catalogue product: ${product.name} (${product.slug})`,
      };

      const res = await fetch(`${API_BASE}/import-export/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Quotation request sent! Your reference is ${json.data.rfq_number}.`);
      } else {
        alert(json.error || "Failed to submit request.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-900 border-t-transparent mb-3" />
        <p className="text-xs text-stone-500 font-medium">Loading international trade dossier...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-stone-200 text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-stone-900">Trade Listing Not Found</h2>
        <p className="text-xs text-stone-500 mt-1">{error || "Requested commodity is no longer published."}</p>
        <Link
          to="/import-export/products"
          className="mt-4 inline-block px-4 py-2 bg-indigo-900 text-white rounded-lg text-xs font-bold"
        >
          Back to Export Catalogues
        </Link>
      </div>
    );
  }

  const party = product.trade_parties;
  const business = party?.businesses;

  // Indicative INR calculation based on 86.50
  const inrEstimate = Math.round(product.base_price_fob * 86.50);

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/import-export" className="hover:text-stone-900">Global Trade</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/import-export/products" className="hover:text-stone-900">Products</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800 line-clamp-1">{product.name}</span>
        </div>

        {/* Core Product Dossier Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
            {/* Gallery / Image */}
            <div className="lg:col-span-5 space-y-3">
              <div className="h-72 sm:h-80 bg-stone-100 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200 relative">
                {product.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-20 h-20 text-stone-300" />
                )}

                <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded">
                  {product.incoterm_basis} • {product.currency}
                </span>

                {product.hs_code && (
                  <span className="absolute top-3 right-3 bg-indigo-900/90 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded">
                    HS {product.hs_code}
                  </span>
                )}
              </div>
            </div>

            {/* Commercial & Specification Details */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-900 px-2.5 py-0.5 rounded">
                    {product.origin_country} Origin
                  </span>
                  {product.loading_port && (
                    <span className="text-[11px] font-semibold text-stone-500">
                      • Port: {product.loading_port}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  {product.name}
                </h1>

                <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {product.description || "Export grade commodity packed and containerized in compliance with international phytosanitary and packaging standards."}
                </p>

                {/* Key Metrics Grid */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">HS Tariff Code</span>
                    <div className="text-xs font-mono font-bold text-stone-800 mt-0.5">{product.hs_code || "1006.30"}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Incoterm Basis</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.incoterm_basis}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">MOQ (Batch Size)</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.moq} {product.unit_of_measurement}s</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Monthly Capacity</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.max_supply_capacity_monthly || "500 MT/mo"}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Dispatch Lead Time</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.export_lead_time_days} Days</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Origin State</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.origin_state || "India"}</div>
                  </div>
                </div>

                {/* Pricing Block */}
                <div className="mt-6 flex flex-wrap items-baseline gap-3">
                  <div className="text-2xl sm:text-3xl font-black text-indigo-950">
                    ${product.base_price_fob.toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs font-semibold text-stone-500">
                    per {product.unit_of_measurement} ({product.incoterm_basis})
                  </span>
                  <span className="text-xs font-medium text-stone-400">
                    (~₹{inrEstimate.toLocaleString("en-IN")} INR indicative)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-stone-200 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2"
                >
                  <Ship className="w-4 h-4" /> Request CIF / FOB Quotation
                </button>
                <Link
                  to="/import-export/rfq"
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5"
                >
                  Custom Trade RFQ <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections: Specifications & Exporter Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Technical Specifications */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-900" /> Export Quality & Technical Specifications
              </h2>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Packaging Specifications</span>
                  <div className="font-semibold text-stone-800 mt-0.5">{product.packaging_details || "Standard Export Sea-worthy Packing"}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Port of Loading</span>
                  <div className="font-semibold text-stone-800 mt-0.5">{product.loading_port || "Nhava Sheva (JNPT), India"}</div>
                </div>

                {product.specifications &&
                  Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">
                        {key.replace(/_/g, " ")}
                      </span>
                      <div className="font-semibold text-stone-800 mt-0.5">
                        {typeof val === "boolean" ? (val ? "Yes / Compliant" : "No") : String(val)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Exporter Credentials */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                Verified Exporter
              </span>

              <h3 className="text-base font-bold text-stone-900 mt-3">
                {business?.name || party?.headline || "Star Export House"}
              </h3>

              <div className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{party?.country_name || "India"}</span>
                {party?.iec_code && <span className="font-mono text-[10px] ml-1 text-stone-400">IEC: {party.iec_code}</span>}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Party Type:</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {party?.party_type?.replace(/_/g, " ") || "Exporter"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Annual Turnover:</span>
                  <span className="font-semibold text-stone-800">{party?.annual_trade_turnover || "$5M+"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Rating:</span>
                  <span className="font-bold text-amber-600">★ {party?.rating || "4.9"} / 5.0</span>
                </div>
              </div>

              {party?.certifications && party.certifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <span className="text-[11px] font-bold text-stone-700 block mb-2">
                    Accredited Trade Certifications:
                  </span>
                  <div className="space-y-1">
                    {party.certifications.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-stone-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {party && (
                <Link
                  to={`/import-export/parties/${party.id}`}
                  className="mt-5 w-full block text-center py-2 px-3 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 hover:bg-stone-50 transition"
                >
                  View Exporter Dossier & Catalog
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick RFQ Submission Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">
              Request Trade Quotation for {product.name}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Select desired destination port and Incoterm to receive an itemized landed-cost quote.
            </p>

            {successMsg ? (
              <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="font-bold">{successMsg}</p>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setIsRfqModalOpen(false);
                      setSuccessMsg(null);
                    }}
                    className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickRfqSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Required Quantity</label>
                    <input
                      type="number"
                      required
                      value={rfqQuantity}
                      onChange={(e) => setRfqQuantity(e.target.value)}
                      min={product.moq}
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Incoterm Preference</label>
                    <select
                      value={rfqIncoterm}
                      onChange={(e) => setRfqIncoterm(e.target.value)}
                      className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50"
                    >
                      <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                      <option value="FOB">FOB (Free On Board)</option>
                      <option value="CFR">CFR (Cost & Freight)</option>
                      <option value="DDP">DDP (Delivered Duty Paid)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Destination Country</label>
                    <input
                      type="text"
                      required
                      value={rfqDestCountry}
                      onChange={(e) => setRfqDestCountry(e.target.value)}
                      placeholder="e.g. United Arab Emirates"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Destination Port</label>
                    <input
                      type="text"
                      required
                      value={rfqDestPort}
                      onChange={(e) => setRfqDestPort(e.target.value)}
                      placeholder="e.g. Jebel Ali Port, Dubai"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="import@company.com"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsRfqModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-900 text-white font-bold rounded-lg text-xs hover:bg-indigo-800 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Send RFQ to Exporter"}
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

export default InternationalProductDetailPage;
