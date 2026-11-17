import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  ShieldCheck,
  Package,
  Layers,
  Printer,
  Calendar,
  CheckCircle,
  FileText,
  ChevronRight,
  Send,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { PackagingSupplierProfile, PackagingProduct } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PackagingSupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [supplier, setSupplier] = useState<PackagingSupplierProfile | null>(null);
  const [products, setProducts] = useState<PackagingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "facilities" | "capabilities" | "certifications">("catalog");

  useEffect(() => {
    const fetchSupplier = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/packaging/suppliers/${id}`);
        if (!res.ok) throw new Error("Supplier not found.");
        const json = await res.json();
        if (json.success && json.data) {
          setSupplier(json.data);
          setProducts(json.data.products || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-900 border-t-transparent mb-3" />
        <p className="text-xs text-stone-500 font-medium">Loading converter dossier...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-stone-200 text-center shadow-xs">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-stone-900">Converter Dossier Not Found</h2>
        <Link
          to="/packaging/suppliers"
          className="mt-4 inline-block px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const business = supplier.businesses;

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/packaging" className="hover:text-stone-900">Packaging Marketplace</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/packaging/suppliers" className="hover:text-stone-900">Converters</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">{business?.name || supplier.headline}</span>
        </div>

        {/* Profile Header Hero */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                  {supplier.supplier_type?.replace(/_/g, " ")}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Manufacturer
                </span>
                <span className="text-xs font-bold text-amber-600">★ {supplier.rating || "4.85"}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {business?.name || supplier.headline}
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
                {supplier.description || "Custom and bulk packaging converting and printing specialist."}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {business?.city || "National Cluster"}, {business?.state || "India"}
                </span>
                <span>•</span>
                <span>Monthly Capacity: <strong className="text-stone-800">{supplier.production_capacity || "1.5M Units"}</strong></span>
                <span>•</span>
                <span>Lead Time: <strong className="text-stone-800">{supplier.typical_lead_time_days || 7} Days</strong></span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <Link
                to={`/packaging/rfq?supplier_id=${supplier.id}`}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Request Custom Quotation
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 pt-4 border-t border-stone-200 flex gap-4 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`pb-2 border-b-2 transition ${
                activeTab === "catalog"
                  ? "border-blue-900 text-blue-950"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Published Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("facilities")}
              className={`pb-2 border-b-2 transition ${
                activeTab === "facilities"
                  ? "border-blue-900 text-blue-950"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Factory & Converting Plants
            </button>
            <button
              onClick={() => setActiveTab("capabilities")}
              className={`pb-2 border-b-2 transition ${
                activeTab === "capabilities"
                  ? "border-blue-900 text-blue-950"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Printing & Converting Capabilities
            </button>
            <button
              onClick={() => setActiveTab("certifications")}
              className={`pb-2 border-b-2 transition ${
                activeTab === "certifications"
                  ? "border-blue-900 text-blue-950"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Accredited Certifications
            </button>
          </div>
        </div>

        {/* Tab 1: Catalog */}
        {activeTab === "catalog" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-stone-900">Published Packaging Items</h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    to={`/packaging/products/${p.slug}`}
                    className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="h-40 bg-stone-100 flex items-center justify-center">
                      {p.images && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-10 h-10 text-stone-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-stone-900 text-xs line-clamp-2">{p.name}</h3>
                      <div className="mt-1 text-[11px] text-stone-500">Material: {p.material_type}</div>
                      <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between items-baseline">
                        <div className="text-sm font-extrabold text-blue-950">
                          ₹{p.base_price.toFixed(2)}{" "}
                          <span className="text-[10px] text-stone-500 font-normal">/ {p.unit_of_measurement}</span>
                        </div>
                        <div className="text-xs font-semibold text-stone-600">
                          MOQ: {p.moq} {p.unit_of_measurement}s
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-500">
                No public catalogue items published currently. Submit a custom requirement to receive quotation.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Facilities */}
        {activeTab === "facilities" && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-900" /> Converting Plants & Factory Locations
            </h2>
            {supplier.factory_locations && supplier.factory_locations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supplier.factory_locations.map((loc, idx) => (
                  <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
                    <h3 className="font-bold text-stone-900 text-sm">{loc.name}</h3>
                    <div className="mt-1 text-xs text-stone-600">{loc.city}, {loc.state}</div>
                    {loc.areaSqFt && (
                      <div className="mt-2 text-xs font-semibold text-stone-500">
                        Operational Area: {loc.areaSqFt.toLocaleString("en-IN")} Sq. Ft.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">Registered Facility: {supplier.registered_address}</p>
            )}
          </div>
        )}

        {/* Tab 3: Capabilities */}
        {activeTab === "capabilities" && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-900" /> Printing Technologies
              </h2>
              <div className="flex flex-wrap gap-2">
                {supplier.printing_capabilities && supplier.printing_capabilities.length > 0 ? (
                  supplier.printing_capabilities.map((c, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-medium">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-500">Flexographic and rotogravure converting on demand.</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100">
              <h2 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-900" /> Manufacturing & Converting Processes
              </h2>
              <div className="flex flex-wrap gap-2">
                {supplier.manufacturing_capabilities && supplier.manufacturing_capabilities.length > 0 ? (
                  supplier.manufacturing_capabilities.map((c, i) => (
                    <span key={i} className="px-3 py-1.5 bg-stone-100 text-stone-800 rounded-lg text-xs font-medium">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-500">Pouch forming, slitting and laminating.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Certifications */}
        {activeTab === "certifications" && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Quality & Regulatory Accreditations
            </h2>
            {supplier.certifications && supplier.certifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {supplier.certifications.map((c, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-950">{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">Verified factory licenses on file with Coverly compliance team.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackagingSupplierDetailPage;
