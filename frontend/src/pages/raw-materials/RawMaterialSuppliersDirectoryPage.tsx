import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Factory,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Package,
  Award,
} from "lucide-react";
import { RawMaterialSupplierProfile } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RawMaterialSuppliersDirectoryPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<RawMaterialSupplierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierType, setSupplierType] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  const fallbackSuppliers: RawMaterialSupplierProfile[] = [
    {
      id: "sup-01",
      business_id: "biz-01",
      user_id: "usr-01",
      supplier_type: "manufacturer",
      headline: "Primary Steel Mills & Billets Manufacturer",
      description: "Direct manufacturing of high-ductility TMT rebars, MS wire rods, and structural beams for infrastructure builders.",
      operating_states: ["Jharkhand", "Odisha", "West Bengal", "Maharashtra"],
      operating_cities: ["Jamshedpur", "Ranchi", "Kolkata", "Mumbai"],
      material_categories: ["Industrial Raw Materials", "Construction Raw Materials"],
      warehouses: [
        { name: "Central Mill Depot", city: "Jamshedpur", state: "Jharkhand", capacity: "50,000 MT" },
        { name: "Western Buffer Depot", city: "Navi Mumbai", state: "Maharashtra", capacity: "15,000 MT" },
      ],
      supply_capacity_monthly: "65,000 MT / Month",
      certifications: ["ISO 9001:2015", "BIS IS 1786:2008", "GreenPro"],
      moq_policy: "15 MT minimum for direct mill consignments.",
      verification_status: "verified",
      rating: 4.9,
      total_deals_completed: 184,
      created_at: new Date().toISOString(),
      businesses: {
        id: "biz-01",
        name: "Bharat Alloys & Steel Mills Ltd",
        legal_name: "Bharat Alloys & Steel Mills Limited",
        slug: "bharat-alloys-steel-mills",
        business_type: "manufacturer",
        city: "Jamshedpur",
        state: "Jharkhand",
        pincode: "831001",
        verification_level: "registration_checked",
        is_active: true,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "sup-02",
      business_id: "biz-02",
      user_id: "usr-02",
      supplier_type: "agricultural_commodity_supplier",
      headline: "Direct Farm Syndicate & Grain Processor",
      description: "Aggregated farm-gate sourcing and processing of Basmati paddy, non-basmati rice, wheat, and oilseeds across Haryana and Punjab.",
      operating_states: ["Haryana", "Punjab", "Delhi NCR"],
      operating_cities: ["Karnal", "Kurukshetra", "Amritsar", "Delhi"],
      material_categories: ["Agricultural Raw Materials", "Food Processing Raw Materials"],
      warehouses: [
        { name: "Karnal Silo Complex", city: "Karnal", state: "Haryana", capacity: "30,000 MT" },
      ],
      supply_capacity_monthly: "25,000 MT / Month",
      certifications: ["FSSAI Central License", "AGMARK Grade 1", "APEDA Registered"],
      moq_policy: "20 MT minimum dispatch.",
      verification_status: "verified",
      rating: 4.85,
      total_deals_completed: 142,
      created_at: new Date().toISOString(),
      businesses: {
        id: "biz-02",
        name: "Karnal Agro Commodities Syndicate",
        legal_name: "Karnal Agro Commodities Syndicate LLP",
        slug: "karnal-agro-commodities",
        business_type: "manufacturer",
        city: "Karnal",
        state: "Haryana",
        pincode: "132001",
        verification_level: "document_verified",
        is_active: true,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "sup-03",
      business_id: "biz-03",
      user_id: "usr-03",
      supplier_type: "distributor",
      headline: "Authorized Polymer Resins & Chemical Stockist",
      description: "Prime virgin polymer granules, PP, HDPE, LDPE, and PVC resins directly sourced from petrochemical complexes.",
      operating_states: ["Gujarat", "Maharashtra", "Rajasthan"],
      operating_cities: ["Vadodara", "Surat", "Ahmedabad", "Mumbai"],
      material_categories: ["Plastic and Polymer Materials", "Industrial Raw Materials"],
      warehouses: [
        { name: "Dahej Logistics Depot", city: "Bharuch", state: "Gujarat", capacity: "10,000 MT" },
        { name: "Bhiwandi Hub", city: "Bhiwandi", state: "Maharashtra", capacity: "8,000 MT" },
      ],
      supply_capacity_monthly: "18,000 MT / Month",
      certifications: ["ISO 14001", "ASTM Compliance"],
      moq_policy: "1 MT minimum order for polymer granules.",
      verification_status: "verified",
      rating: 4.88,
      total_deals_completed: 215,
      created_at: new Date().toISOString(),
      businesses: {
        id: "biz-03",
        name: "Gujarat Petro Polymers Corp",
        legal_name: "Gujarat Petro Polymers Corporation",
        slug: "gujarat-petro-polymers",
        business_type: "distributor",
        city: "Vadodara",
        state: "Gujarat",
        pincode: "390001",
        verification_level: "registration_checked",
        is_active: true,
        created_at: new Date().toISOString(),
      },
    },
  ];

  const fetchSuppliers = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (supplierType !== "all") params.set("supplier_type", supplierType);
    if (stateFilter !== "all") params.set("state", stateFilter);

    fetch(`${API_BASE}/raw-materials/suppliers?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setSuppliers(data.data);
        } else {
          setSuppliers(fallbackSuppliers);
        }
      })
      .catch(() => {
        setSuppliers(fallbackSuppliers);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchSuppliers();
  }, [supplierType, stateFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Banner */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Verified Industrial Suppliers & Mills
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Raw Material Supplier & Mill Directory
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-3xl">
            Discover verified primary manufacturers, agricultural syndicates, chemical refiners, and polymer distributors across India. Connect directly with factory sales teams with zero intermediaries.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by mill or supplier name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <select
                value={supplierType}
                onChange={(e) => setSupplierType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="all">All Supplier Classifications</option>
                <option value="manufacturer">Primary Manufacturer / Mill</option>
                <option value="agricultural_commodity_supplier">Agro Commodity Syndicate</option>
                <option value="distributor">Regional Distributor</option>
                <option value="raw_material_trader">Raw Material Trader</option>
                <option value="importer">Importer / Indentor</option>
                <option value="wholesaler">Wholesaler / Stockist</option>
              </select>
            </div>

            <div>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="all">All States</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Haryana">Haryana</option>
                <option value="Punjab">Punjab</option>
                <option value="Odisha">Odisha</option>
              </select>
            </div>

            <div>
              <button
                onClick={fetchSuppliers}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Filter Suppliers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Factory className="w-5 h-5 text-indigo-600" />
            Verified Suppliers ({suppliers.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Active Pan-India Mills & Stockists
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse space-y-3">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                <div className="h-16 bg-slate-50 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-base">
                        {sup.businesses?.name
                          ? sup.businesses.name.substring(0, 2).toUpperCase()
                          : "RM"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600">
                            <Link to={`/raw-materials/suppliers/${sup.id}`}>
                              {sup.businesses?.name || "Verified Supplier"}
                            </Link>
                          </h3>
                          {sup.verification_status === "verified" && (
                            <span title="Verified by COVERLY" className="text-emerald-600">
                              <CheckCircle className="w-4 h-4 fill-emerald-100" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 capitalize mt-0.5">
                          {sup.supplier_type.replace(/_/g, " ")} • {sup.businesses?.city}, {sup.businesses?.state}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Rating: {sup.rating} ★
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {sup.description || sup.headline}
                  </p>

                  {/* Warehouses & Supply Capacity */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Monthly Capacity
                      </span>
                      <span className="font-bold text-slate-800">
                        {sup.supply_capacity_monthly || "50,000 MT / Month"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Warehouses
                      </span>
                      <span className="font-medium text-slate-700">
                        {sup.warehouses?.length || 1} Primary Depot Locations
                      </span>
                    </div>
                  </div>

                  {/* Certifications */}
                  {sup.certifications && sup.certifications.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Quality Accreditations
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sup.certifications.map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {sup.total_deals_completed} Deals Closed
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/raw-materials/suppliers/${sup.id}`}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-indigo-600 rounded text-xs font-semibold"
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/raw-materials/rfq?supplier=${sup.id}&supplier_name=${encodeURIComponent(sup.businesses?.name || "")}`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold"
                    >
                      Request Direct Quote
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
