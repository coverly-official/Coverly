import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  Package,
  Layers,
  Printer,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { PackagingSupplierProfile } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PackagingSuppliersDirectoryPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<PackagingSupplierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [supplierType, setSupplierType] = useState("all");
  const [category, setCategory] = useState("all");

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (supplierType !== "all") params.append("supplier_type", supplierType);
      if (category !== "all") params.append("category", category);

      const res = await fetch(`${API_BASE}/packaging/suppliers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSuppliers(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [supplierType, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSuppliers();
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-4">
          <Link to="/" className="hover:text-stone-900">Home</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/packaging" className="hover:text-stone-900">Packaging Marketplace</Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="font-semibold text-stone-800">Converters & Suppliers Directory</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Verified Packaging Manufacturers & Converters
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Connect directly with verified packaging manufacturers, printing specialists and material stockists across India.
            </p>
          </div>

          <Link
            to="/packaging/rfq"
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-xs transition inline-flex items-center gap-1.5 shrink-0"
          >
            <Package className="w-3.5 h-3.5" /> Post Custom Sourcing RFQ
          </Link>
        </div>

        {/* Filter Strip */}
        <div className="mt-6 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search converter by name or location..."
                className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 pl-9 bg-stone-50 focus:outline-none focus:border-blue-900"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
            </div>

            <div>
              <select
                value={supplierType}
                onChange={(e) => setSupplierType(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-blue-900"
              >
                <option value="all">All Supplier Typologies</option>
                <option value="packaging_manufacturer">Packaging Manufacturers</option>
                <option value="custom_packaging_manufacturer">Custom Packaging Specialists</option>
                <option value="printing_company">Printing & Labeling Companies</option>
                <option value="packaging_material_supplier">Material Substrate Suppliers</option>
                <option value="packaging_wholesaler">Packaging Wholesalers</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2 px-4 rounded-lg transition"
            >
              Search Directory
            </button>
          </form>
        </div>

        {/* Suppliers List */}
        <div className="mt-8 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-stone-200/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : suppliers.length > 0 ? (
            suppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-white rounded-xl border border-stone-200 p-6 hover:border-blue-300 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {sup.supplier_type?.replace(/_/g, " ")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Facility
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      ★ {sup.rating || "4.8"}
                    </span>
                  </div>

                  <Link to={`/packaging/suppliers/${sup.id}`}>
                    <h2 className="text-base font-bold text-stone-900 hover:text-blue-950 transition">
                      {sup.businesses?.name || sup.headline}
                    </h2>
                  </Link>

                  <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                    {sup.description || "Comprehensive packaging converting, custom die-cutting and high-definition flexo/rotogravure printing facility."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {sup.businesses?.city || "Hub"}, {sup.businesses?.state || "India"}
                    </span>
                    <span>•</span>
                    <span>Monthly Capacity: <strong className="text-stone-800">{sup.production_capacity || "500k units"}</strong></span>
                    <span>•</span>
                    <span>Typical Lead Time: <strong className="text-stone-800">{sup.typical_lead_time_days || 7} Days</strong></span>
                  </div>

                  {/* Printing / Converting Capabilities */}
                  {sup.printing_capabilities && sup.printing_capabilities.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {sup.printing_capabilities.slice(0, 4).map((cap, i) => (
                        <span key={i} className="text-[11px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col gap-2">
                  <Link
                    to={`/packaging/suppliers/${sup.id}`}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg text-center shadow-xs transition"
                  >
                    View Catalog & Profile
                  </Link>
                  <Link
                    to={`/packaging/rfq?supplier_id=${sup.id}`}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg text-center transition"
                  >
                    Send Direct RFQ
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-bold text-stone-800 text-sm">No Converters Match Your Filter</h3>
              <p className="text-xs text-stone-500 mt-1">Try resetting the filter criteria or post a custom sourcing RFQ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackagingSuppliersDirectoryPage;
