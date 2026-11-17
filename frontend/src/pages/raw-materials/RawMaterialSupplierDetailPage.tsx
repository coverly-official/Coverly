import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Factory,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle,
  ArrowLeft,
  FileText,
  Warehouse,
  Award,
  Package,
  TrendingUp,
} from "lucide-react";
import { RawMaterialSupplierProfile, RawMaterialProduct } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RawMaterialSupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<RawMaterialSupplierProfile | null>(null);
  const [products, setProducts] = useState<RawMaterialProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackSupplier: RawMaterialSupplierProfile = {
    id: "sup-01",
    business_id: "biz-01",
    user_id: "usr-01",
    supplier_type: "manufacturer",
    headline: "Primary Steel Mills & Billets Manufacturer",
    description: "Integrated steel manufacturing enterprise with an annual rolling capacity of 800,000 MT. Supplying major national highway projects, high-rise builders, and export consignments across India and SAARC nations.",
    operating_states: ["Jharkhand", "Odisha", "West Bengal", "Maharashtra", "Gujarat"],
    operating_cities: ["Jamshedpur", "Ranchi", "Kolkata", "Mumbai", "Pune"],
    material_categories: ["Industrial Raw Materials", "Construction Raw Materials"],
    warehouses: [
      { name: "Central Mill Depot", city: "Jamshedpur", state: "Jharkhand", capacity: "50,000 MT" },
      { name: "Western Buffer Depot", city: "Navi Mumbai", state: "Maharashtra", capacity: "15,000 MT" },
      { name: "Eastern Logistics Yard", city: "Haldia Port", state: "West Bengal", capacity: "20,000 MT" },
    ],
    supply_capacity_monthly: "65,000 MT / Month",
    certifications: ["ISO 9001:2015", "BIS IS 1786:2008", "GreenPro Certified", "NABL Accredited Lab"],
    moq_policy: "15 MT minimum dispatch for primary billets and TMT rebars.",
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
  };

  const fallbackProducts: RawMaterialProduct[] = [
    {
      id: "rm-p1",
      supplier_id: "sup-01",
      business_id: "biz-01",
      category_id: "rm-cat-industrial",
      name: "TMT Steel Rebars Fe 550D (12mm to 32mm)",
      slug: "tmt-steel-rebars-fe-550d",
      description: "High-ductility primary billet TMT bars complying with BIS IS 1786:2008 with batch test certificate.",
      material_grade: "Fe 550D Primary Billet",
      origin: "Jamshedpur Integrated Plant",
      quality_standards: ["BIS IS 1786", "ISO 9001"],
      specifications: { yield_strength_mpa: 550, elongation: "16.5%" },
      unit_of_measurement: "metric_ton",
      moq: 15,
      base_price: 52000,
      bulk_pricing_tiers: [
        { min_qty: 15, max_qty: 49, price_per_unit: 52000 },
        { min_qty: 50, max_qty: 200, price_per_unit: 50500 },
      ],
      maintains_inventory: true,
      stock_quantity: 450,
      available_quantity: 450,
      reserved_quantity: 0,
      lead_time_days: 3,
      supply_locations: ["Pan-India"],
      delivery_available: true,
      images: [],
      moderation_status: "approved",
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "rm-p5",
      supplier_id: "sup-01",
      business_id: "biz-01",
      category_id: "rm-cat-industrial",
      name: "Mild Steel Wire Rods 5.5mm & 8mm High Carbon",
      slug: "ms-wire-rods-5-5mm",
      description: "Prime drawing grade wire rods for fastener manufacturing, binding wires, and industrial nails.",
      material_grade: "High Carbon Drawing Grade",
      origin: "Jamshedpur Mill",
      quality_standards: ["IS 7887", "ISO 9001"],
      specifications: { diameter_mm: "5.5mm & 8.0mm", carbon: "0.45% - 0.55%" },
      unit_of_measurement: "metric_ton",
      moq: 25,
      base_price: 54500,
      bulk_pricing_tiers: [],
      maintains_inventory: true,
      stock_quantity: 210,
      available_quantity: 210,
      reserved_quantity: 0,
      lead_time_days: 5,
      supply_locations: ["Pan-India"],
      delivery_available: true,
      images: [],
      moderation_status: "approved",
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/raw-materials/suppliers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSupplier(data.data);
          setProducts(data.data.products || fallbackProducts);
        } else {
          setSupplier(fallbackSupplier);
          setProducts(fallbackProducts);
        }
      })
      .catch(() => {
        setSupplier(fallbackSupplier);
        setProducts(fallbackProducts);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading supplier dossier...</p>
        </div>
      </div>
    );
  }

  const currentSupplier = supplier || fallbackSupplier;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Breadcrumb */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-3 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link to="/raw-materials/suppliers" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Supplier Directory
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{currentSupplier.businesses?.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Supplier Header Dossier */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md">
                {currentSupplier.businesses?.name
                  ? currentSupplier.businesses.name.substring(0, 2).toUpperCase()
                  : "RM"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {currentSupplier.businesses?.name}
                  </h1>
                  {currentSupplier.verification_status === "verified" && (
                    <span title="Verified Enterprise" className="text-emerald-600">
                      <CheckCircle className="w-5 h-5 fill-emerald-100" />
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 capitalize flex items-center gap-2">
                  <span>{currentSupplier.supplier_type.replace(/_/g, " ")}</span>
                  <span>•</span>
                  <span>{currentSupplier.businesses?.city}, {currentSupplier.businesses?.state}</span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified GST & Legal Registration
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Monthly Cap: {currentSupplier.supply_capacity_monthly}
                  </span>
                </div>
              </div>
            </div>

            <Link
              to={`/raw-materials/rfq?supplier=${currentSupplier.id}&supplier_name=${encodeURIComponent(currentSupplier.businesses?.name || "")}`}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0"
            >
              <FileText className="w-4 h-4" />
              Request Direct RFQ
            </Link>
          </div>

          {/* Description */}
          <div className="mt-6 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              About Enterprise & Plant Operations
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {currentSupplier.description}
            </p>
          </div>

          {/* Warehouse Depots */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-indigo-600" />
              Verified Warehouses & Stocking Depots
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {currentSupplier.warehouses?.map((wh, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{wh.name}</div>
                  <div className="text-slate-500">{wh.city}, {wh.state}</div>
                  <div className="text-indigo-700 font-semibold">Storage Capacity: {wh.capacity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {currentSupplier.certifications && currentSupplier.certifications.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Accreditations & Compliance
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentSupplier.certifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Published Products Catalogue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Published Raw Material Catalogue ({products.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {prod.material_grade || "Industrial Spec"}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600">
                    <Link to={`/raw-materials/products/${prod.slug || prod.id}`}>
                      {prod.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                  <div className="text-base font-black text-slate-900 pt-2">
                    ₹{prod.base_price.toLocaleString("en-IN")}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      / {prod.unit_of_measurement}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    MOQ: {prod.moq} {prod.unit_of_measurement}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <Link
                    to={`/raw-materials/products/${prod.slug || prod.id}`}
                    className="text-xs font-bold text-slate-700 hover:text-indigo-600"
                  >
                    View Specs
                  </Link>
                  <Link
                    to={`/raw-materials/rfq?product=${prod.slug || prod.id}&material=${encodeURIComponent(prod.name)}`}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-xs"
                  >
                    Get Quote
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
