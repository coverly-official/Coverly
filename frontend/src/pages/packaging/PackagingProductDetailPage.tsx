import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Package,
  Layers,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Printer,
  Calendar,
  Sparkles,
  CheckCircle,
  Scale,
  Building2,
  FileText,
  AlertCircle,
  Truck,
  ArrowRight,
  Send,
} from "lucide-react";
import { PackagingProduct } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PackagingProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<PackagingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick RFQ Modal state
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqQuantity, setRfqQuantity] = useState("");
  const [rfqCity, setRfqCity] = useState("");
  const [rfqState, setRfqState] = useState("");
  const [rfqPrintingDetails, setRfqPrintingDetails] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isSubmittingRfq, setIsSubmittingRfq] = useState(false);
  const [rfqSuccessMsg, setRfqSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/packaging/products/${slug}`);
        if (!res.ok) {
          throw new Error("Packaging listing not found.");
        }
        const json = await res.json();
        if (json.success && json.data) {
          setProduct(json.data);
          setRfqQuantity(json.data.moq?.toString() || "1000");
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

    setIsSubmittingRfq(true);
    try {
      const payload = {
        category_id: product.category_id,
        product_id: product.id,
        packaging_type: product.packaging_type,
        product_being_packed: `Packaged in ${product.name}`,
        material_preference: product.material_type,
        required_quantity: parseInt(rfqQuantity, 10),
        unit: product.unit_of_measurement,
        printing_required: true,
        printing_details: rfqPrintingDetails || "Custom printing per product specs",
        delivery_city: rfqCity || "Mumbai",
        delivery_state: rfqState || "Maharashtra",
        target_supplier_id: product.supplier_id,
        guest_email: guestEmail || undefined,
        guest_phone: guestPhone || undefined,
        additional_instructions: `Direct enquiry for catalog product: ${product.name} (${product.slug})`,
      };

      const res = await fetch(`${API_BASE}/packaging/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setRfqSuccessMsg(`Enquiry submitted! Your reference is ${json.data.rfq_number}.`);
      } else {
        alert(json.error || "Failed to submit enquiry.");
      }
    } catch (err: any) {
      alert(err.message || "Network error.");
    } finally {
      setIsSubmittingRfq(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent mb-3" />
        <p className="text-xs text-stone-500 font-medium">Loading packaging specifications...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-stone-200 text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-stone-900">Product Not Found</h2>
        <p className="text-xs text-stone-500 mt-1">{error || "The requested packaging item does not exist."}</p>
        <Link
          to="/packaging/products"
          className="mt-4 inline-block px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
        >
          Back to Packaging Catalogues
        </Link>
      </div>
    );
  }

  const supplier = product.packaging_supplier_profiles;
  const business = supplier?.businesses;

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/packaging" className="hover:text-stone-900">Packaging Marketplace</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/packaging/products" className="hover:text-stone-900">Products</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800 line-clamp-1">{product.name}</span>
        </div>

        {/* Product Dossier Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
            {/* Image / Gallery */}
            <div className="lg:col-span-5 space-y-3">
              <div className="h-72 sm:h-80 bg-stone-100 rounded-xl flex items-center justify-center overflow-hidden border border-stone-200 relative">
                {product.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-20 h-20 text-stone-300" />
                )}
                <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded">
                  {product.packaging_type || "Packaging Substrate"}
                </span>
              </div>
            </div>

            {/* Core Commercial Overview */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded">
                    {product.packaging_categories?.name || "Standard Domain"}
                  </span>
                  {product.subcategory && (
                    <span className="text-[11px] font-semibold text-stone-500">
                      • {product.subcategory}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  {product.name}
                </h1>

                <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {product.description || "High-performance packaging solution manufactured according to industry food-grade and commercial standards."}
                </p>

                {/* Key Metric Highlights */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Material</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.material_type}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Thickness</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.thickness || "Customizable"}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Capacity</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.capacity || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Minimum Order</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.moq} {product.unit_of_measurement}s</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Production Lead</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">{product.lead_time_days} Days</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Supply Locations</span>
                    <div className="text-xs font-bold text-stone-800 mt-0.5">Pan-India</div>
                  </div>
                </div>

                {/* Commercial Price Display */}
                <div className="mt-6 flex items-baseline gap-3">
                  <div className="text-2xl sm:text-3xl font-black text-blue-950">
                    ₹{product.base_price.toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs font-semibold text-stone-500">
                    per {product.unit_of_measurement} (ex-factory base)
                  </span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="mt-6 pt-5 border-t border-stone-200 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Request Bulk Quotation
                </button>
                <Link
                  to="/packaging/rfq"
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5"
                >
                  Custom Specifications RFQ <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections: Bulk Pricing Tiers + Technical Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Tiers & Specs (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bulk Quantity Pricing Tiers */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-900" /> Quantity-Based Bulk Pricing Tiers
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Configured manufacturer volume discounts. Larger order batches qualify for lower unit prices.
              </p>

              {product.bulk_pricing_tiers && product.bulk_pricing_tiers.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-600">
                        <th className="p-2.5 font-bold">Quantity Range</th>
                        <th className="p-2.5 font-bold">Unit Price</th>
                        <th className="p-2.5 font-bold">Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {product.bulk_pricing_tiers.map((tier, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/40">
                          <td className="p-2.5 font-semibold text-stone-800">
                            {tier.min_qty.toLocaleString("en-IN")} – {tier.max_qty.toLocaleString("en-IN")} {product.unit_of_measurement}s
                          </td>
                          <td className="p-2.5 font-bold text-blue-950">
                            ₹{tier.price_per_unit.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-emerald-700 font-bold">
                            {tier.discount_pct ? `${tier.discount_pct}% off` : "Base Rate"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-stone-50 rounded-lg text-xs text-stone-600">
                  Standard base unit pricing of ₹{product.base_price.toFixed(2)} / {product.unit_of_measurement} applies. Volume discounts can be requested via formal RFQ.
                </div>
              )}
            </div>

            {/* Technical Specifications Grid */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-900" /> Technical & Material Specifications
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Category-specific engineering parameters and barrier suitability.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Substrate Structure</span>
                  <div className="font-semibold text-stone-800 mt-0.5">{product.material_type}</div>
                </div>

                {product.thickness && (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Material Thickness</span>
                    <div className="font-semibold text-stone-800 mt-0.5">{product.thickness}</div>
                  </div>
                )}

                {product.dimensions && Object.keys(product.dimensions).length > 0 && (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/60 sm:col-span-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Configured Dimensions</span>
                    <div className="font-semibold text-stone-800 mt-0.5">
                      {Object.entries(product.dimensions)
                        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                        .join(" | ")}
                    </div>
                  </div>
                )}

                {/* Dynamic Category Specifications JSON */}
                {product.category_specifications &&
                  Object.entries(product.category_specifications).map(([key, val]) => (
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

              {/* Supported Printing & Branding Capabilities */}
              {product.printing_options && product.printing_options.length > 0 && (
                <div className="mt-6 pt-4 border-t border-stone-100">
                  <span className="text-xs font-bold text-stone-800 block mb-2">
                    Available Printing Methods:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.printing_options.map((opt, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-900 border border-blue-200 font-medium px-2.5 py-1 rounded-lg">
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Supplier Credentials (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                Verified Converter
              </span>

              <h3 className="text-base font-bold text-stone-900 mt-3">
                {business?.name || supplier?.headline || "Packaging Manufacturer"}
              </h3>

              <div className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{business?.city || "Industrial Cluster"}, {business?.state || "India"}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Supplier Type:</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {supplier?.supplier_type?.replace(/_/g, " ") || "Manufacturer"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Production Capacity:</span>
                  <span className="font-semibold text-stone-800">
                    {supplier?.production_capacity || "1.5M units / month"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Rating:</span>
                  <span className="font-bold text-amber-600">★ {supplier?.rating || "4.8"} / 5.0</span>
                </div>
              </div>

              {supplier && supplier.certifications && supplier.certifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <span className="text-[11px] font-bold text-stone-700 block mb-2">
                    Verified Quality Accreditations:
                  </span>
                  <div className="space-y-1">
                    {supplier.certifications.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-stone-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {supplier && (
                <Link
                  to={`/packaging/suppliers/${supplier.id}`}
                  className="mt-5 w-full block text-center py-2 px-3 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 hover:bg-stone-50 transition"
                >
                  View Converter Profile & Catalog
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
              Request Quotation for {product.name}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Submit your desired quantity, printing details and destination for an itemized landed-cost quote.
            </p>

            {rfqSuccessMsg ? (
              <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="font-bold">{rfqSuccessMsg}</p>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setIsRfqModalOpen(false);
                      setRfqSuccessMsg(null);
                    }}
                    className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickRfqSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Required Quantity</label>
                  <div className="flex">
                    <input
                      type="number"
                      required
                      value={rfqQuantity}
                      onChange={(e) => setRfqQuantity(e.target.value)}
                      min={product.moq}
                      className="w-full text-xs border border-stone-300 rounded-l-lg px-3 py-2 bg-stone-50"
                    />
                    <span className="bg-stone-100 border border-l-0 border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 rounded-r-lg">
                      {product.unit_of_measurement}s
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Minimum order requirement: {product.moq} {product.unit_of_measurement}s
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Delivery City</label>
                    <input
                      type="text"
                      required
                      value={rfqCity}
                      onChange={(e) => setRfqCity(e.target.value)}
                      placeholder="e.g. Ahmedabad"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Delivery State</label>
                    <input
                      type="text"
                      required
                      value={rfqState}
                      onChange={(e) => setRfqState(e.target.value)}
                      placeholder="e.g. Gujarat"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Printing & Branding Preferences</label>
                  <textarea
                    rows={2}
                    value={rfqPrintingDetails}
                    onChange={(e) => setRfqPrintingDetails(e.target.value)}
                    placeholder="e.g. 4-colour front print, matte finish, rear barcode & nutrition panel..."
                    className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="procurement@company.com"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsRfqModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRfq}
                    className="px-5 py-2 bg-blue-900 text-white font-bold rounded-lg text-xs hover:bg-blue-800 disabled:opacity-50"
                  >
                    {isSubmittingRfq ? "Submitting..." : "Send Quotation Request"}
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

export default PackagingProductDetailPage;
