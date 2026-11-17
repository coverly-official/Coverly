import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Factory,
  Search,
  MapPin,
  Layers,
  ShieldCheck,
  Wheat,
  HardHat,
  Cpu,
  Package,
  Scissors,
  TreePine,
  Utensils,
  ArrowRight,
  TrendingUp,
  Building2,
  FileText,
  CheckCircle,
  Truck,
  Filter,
} from "lucide-react";
import { RawMaterialProduct, RawMaterialSupplierProfile } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RawMaterialsHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchMaterial, setSearchMaterial] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [requiredQty, setRequiredQty] = useState("");
  const [unit, setUnit] = useState("metric_ton");

  const [featuredProducts, setFeaturedProducts] = useState<RawMaterialProduct[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<RawMaterialSupplierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const rawMaterialCategories = [
    {
      id: "rm-cat-agri",
      name: "Agricultural Raw Materials",
      slug: "agricultural-raw-materials",
      description: "Paddy, wheat, maize, soybean, rice, pulses, cotton, oilseeds, and spices.",
      icon: Wheat,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "rm-cat-food",
      name: "Food Processing Raw Materials",
      slug: "food-processing-raw-materials",
      description: "Flour, starch, edible oils, food additives, dehydrated ingredients, and sugar.",
      icon: Utensils,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "rm-cat-industrial",
      name: "Industrial Raw Materials",
      slug: "industrial-raw-materials",
      description: "Iron, steel, aluminium, copper, industrial minerals, rubber, and chemicals.",
      icon: Factory,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "rm-cat-polymers",
      name: "Plastic and Polymer Materials",
      slug: "plastic-and-polymer-materials",
      description: "Plastic granules, PET resin, PVC, HDPE, LDPE, PP, and engineering polymers.",
      icon: Layers,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      id: "rm-cat-textiles",
      name: "Textile Raw Materials",
      slug: "textile-raw-materials",
      description: "Cotton yarn, polyester yarn, spun fibres, greige fabrics, and industrial dyes.",
      icon: Scissors,
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      id: "rm-cat-construction",
      name: "Construction Raw Materials",
      slug: "construction-raw-materials",
      description: "Cement, sand, aggregates, TMT steel rods, bricks, tiles, and structural inputs.",
      icon: HardHat,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      id: "rm-cat-packaging",
      name: "Paper and Packaging Materials",
      slug: "paper-and-packaging-raw-materials",
      description: "Kraft paper rolls, corrugated fluting sheets, cardboard, and barrier films.",
      icon: Package,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      id: "rm-cat-wood",
      name: "Wood and Furniture Materials",
      slug: "wood-and-furniture-materials",
      description: "Hardwood timber, commercial plywood, MDF boards, veneer, and lumber.",
      icon: TreePine,
      color: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      id: "rm-cat-electronics",
      name: "Electronics and Electrical Materials",
      slug: "electronics-and-electrical-materials",
      description: "Copper winding wires, cables, semiconductor inputs, and industrial connectors.",
      icon: Cpu,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

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
      supply_locations: ["Pan-India", "Western Corridor"],
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
        businesses: { id: "b1", name: "Bharat Alloys & Steel Mills Ltd", city: "Jamshedpur", state: "Jharkhand", verification_level: "registration_checked" },
      },
    },
    {
      id: "rm-p2",
      supplier_id: "sup-02",
      business_id: "biz-02",
      category_id: "rm-cat-agri",
      name: "Basmati Paddy Pusa 1121 Grade A Export Quality",
      slug: "basmati-paddy-pusa-1121",
      description: "Direct farm-gate procurement from Haryana & Punjab. Moisture < 12.5%, average grain length 8.35mm.",
      material_grade: "Pusa 1121 Grade A",
      origin: "Karnal Mandi",
      quality_standards: ["AGMARK Special", "FSSAI"],
      specifications: { moisture_max: "12.5%", grain_length: "8.35mm", crop_year: "2026 Kharif" },
      unit_of_measurement: "metric_ton",
      moq: 20,
      base_price: 43500,
      bulk_pricing_tiers: [
        { min_qty: 20, max_qty: 99, price_per_unit: 43500 },
        { min_qty: 100, max_qty: 500, price_per_unit: 42200 },
      ],
      maintains_inventory: true,
      stock_quantity: 280,
      available_quantity: 280,
      reserved_quantity: 0,
      lead_time_days: 4,
      supply_locations: ["North India", "Delhi NCR"],
      delivery_available: true,
      images: [],
      moderation_status: "approved",
      is_active: true,
      created_at: new Date().toISOString(),
      raw_material_supplier_profiles: {
        id: "sup-02",
        supplier_type: "agricultural_commodity_supplier",
        verification_status: "verified",
        rating: 4.85,
        businesses: { id: "b2", name: "Karnal Agro Commodities Syndicate", city: "Karnal", state: "Haryana", verification_level: "document_verified" },
      },
    },
    {
      id: "rm-p3",
      supplier_id: "sup-03",
      business_id: "biz-03",
      category_id: "rm-cat-polymers",
      name: "Virgin HDPE Injection Moulding Granules MFI 20",
      slug: "virgin-hdpe-granules-mfi-20",
      description: "Prime virgin high-density polyethylene polymer granules for industrial crates and rigid packaging.",
      material_grade: "HDPE Blow & Injection Grade",
      origin: "Dahej Petrochemical Complex",
      quality_standards: ["ASTM D1238", "IS 7328"],
      specifications: { melt_flow_index: "20 g/10min", density: "0.954 g/cm3" },
      unit_of_measurement: "kg",
      moq: 1000,
      base_price: 108,
      bulk_pricing_tiers: [
        { min_qty: 1000, max_qty: 4999, price_per_unit: 108 },
        { min_qty: 5000, max_qty: 20000, price_per_unit: 103 },
      ],
      maintains_inventory: true,
      stock_quantity: 18000,
      available_quantity: 18000,
      reserved_quantity: 0,
      lead_time_days: 2,
      supply_locations: ["Gujarat", "Maharashtra"],
      delivery_available: true,
      images: [],
      moderation_status: "approved",
      is_active: true,
      created_at: new Date().toISOString(),
      raw_material_supplier_profiles: {
        id: "sup-03",
        supplier_type: "distributor",
        verification_status: "verified",
        rating: 4.88,
        businesses: { id: "b3", name: "Gujarat Petro Polymers Corp", city: "Vadodara", state: "Gujarat", verification_level: "registration_checked" },
      },
    },
    {
      id: "rm-p4",
      supplier_id: "sup-04",
      business_id: "biz-04",
      category_id: "rm-cat-packaging",
      name: "High Burst Virgin Kraft Paper Reels 180 GSM",
      slug: "virgin-kraft-paper-reels-180-gsm",
      description: "Recycled and virgin semi-chemical fluting kraft reels for high-strength corrugated carton production.",
      material_grade: "180 GSM Virgin Top",
      origin: "Vapi Paper Mills Cluster",
      quality_standards: ["TAPPI T403", "BIS Certified"],
      specifications: { gsm: 180, burst_factor: 24, moisture: "7.5%" },
      unit_of_measurement: "metric_ton",
      moq: 10,
      base_price: 38500,
      bulk_pricing_tiers: [
        { min_qty: 10, max_qty: 30, price_per_unit: 38500 },
        { min_qty: 31, max_qty: 100, price_per_unit: 37200 },
      ],
      maintains_inventory: true,
      stock_quantity: 120,
      available_quantity: 120,
      reserved_quantity: 0,
      lead_time_days: 3,
      supply_locations: ["Western India", "South India"],
      delivery_available: true,
      images: [],
      moderation_status: "approved",
      is_active: true,
      created_at: new Date().toISOString(),
      raw_material_supplier_profiles: {
        id: "sup-04",
        supplier_type: "manufacturer",
        verification_status: "verified",
        rating: 4.92,
        businesses: { id: "b4", name: "Surat Paper & Pulp Mills Ltd", city: "Surat", state: "Gujarat", verification_level: "document_verified" },
      },
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE}/raw-materials/products?limit=6`).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/raw-materials/suppliers`).then((r) => r.json()).catch(() => null),
    ])
      .then(([prodData, supData]) => {
        if (prodData?.success && Array.isArray(prodData.data) && prodData.data.length > 0) {
          setFeaturedProducts(prodData.data);
        } else {
          setFeaturedProducts(fallbackProducts);
        }
        if (supData?.success && Array.isArray(supData.data) && supData.data.length > 0) {
          setTopSuppliers(supData.data);
        }
      })
      .catch(() => {
        setFeaturedProducts(fallbackProducts);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchMaterial) params.set("search", searchMaterial);
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (deliveryLocation) params.set("location", deliveryLocation);
    if (unit) params.set("unit", unit);
    navigate(`/raw-materials/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/60">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Raw Material Sourcing Desk
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Industrial, Agro & Polymer Raw Material Marketplace
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Connect directly with primary steel mills, agro-commodity syndicates, chemical refiners, and polymer importers across India. Discover transparent tiered pricing, verifiable MOQs, and reliable freight fulfillment.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Link
                to="/raw-materials/rfq"
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors text-center flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Broadcast Bulk RFQ
              </Link>
              <Link
                to="/raw-materials/supplier-register"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Register as Raw Material Supplier
              </Link>
            </div>
          </div>

          {/* Search Box Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 text-slate-800 border border-slate-200 mt-6">
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Material name (e.g. TMT Steel, HDPE Granules, Cotton Yarn)..."
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="all">All Material Categories</option>
                  {rawMaterialCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Delivery City / State..."
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full h-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Find Raw Materials
                </button>
              </div>
            </form>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs">
            <div>
              <div className="text-xl font-bold text-white">450+ Verified Suppliers</div>
              <div className="text-slate-400 mt-0.5">Primary Mills & Stockists</div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-400">9 Core Domains</div>
              <div className="text-slate-400 mt-0.5">Metals, Polymers, Agro & Paper</div>
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400">Zero Brokerage</div>
              <div className="text-slate-400 mt-0.5">Direct Factory-Gate Invoicing</div>
            </div>
            <div>
              <div className="text-xl font-bold text-indigo-400">BIS & ASTM Standards</div>
              <div className="text-slate-400 mt-0.5">Verified Test Certificate Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Structured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Browse by Raw Material Category
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an industry domain to explore specific grades, physical properties, and bulk quotes.
            </p>
          </div>
          <Link
            to="/raw-materials/products"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rawMaterialCategories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/raw-materials/products?category=${cat.id}`}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md p-5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color} border`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {cat.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>Explore Raw Materials</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Featured Raw Material Listings
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Active bulk offers with verified specifications, indicative unit pricing, and manufacturer MOQs.
            </p>
          </div>
          <Link
            to="/raw-materials/products"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View Full Catalogue ({featuredProducts.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                    {prod.material_grade || "Industrial Grade"}
                  </span>
                  {prod.maintains_inventory && prod.stock_quantity > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      In Stock ({prod.stock_quantity} {prod.unit_of_measurement})
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 hover:text-indigo-600">
                    <Link to={`/raw-materials/products/${prod.slug || prod.id}`}>
                      {prod.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {prod.description}
                  </p>
                </div>

                {/* Price & MOQ Box */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Indicative Price
                    </div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      ₹{prod.base_price.toLocaleString("en-IN")}
                      <span className="text-xs font-normal text-slate-500">
                        {" "}
                        / {prod.unit_of_measurement}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Min Order (MOQ)
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">
                      {prod.moq} {prod.unit_of_measurement}
                    </div>
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold truncate">
                    {prod.raw_material_supplier_profiles?.businesses?.name || "Verified Enterprise Supplier"}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 shrink-0">
                    {prod.raw_material_supplier_profiles?.businesses?.city || "India"}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/raw-materials/products/${prod.slug || prod.id}`}
                  className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  View Specifications
                </Link>
                <Link
                  to={`/raw-materials/rfq?product=${prod.slug || prod.id}&material=${encodeURIComponent(prod.name)}`}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Broadcast RFQ Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
              Bulk Procurement Desk
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cannot find your exact chemical grade or agricultural specification?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Broadcast your custom procurement requirement. Our system matches and dispatches your RFQ directly to vetted manufacturers and primary stockists across India. Compare formal landed-cost quotations and choose the best terms.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/raw-materials/rfq"
                className="px-6 py-3 rounded-lg font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-md"
              >
                Post Custom Raw Material RFQ
              </Link>
              <Link
                to="/raw-materials/suppliers"
                className="px-6 py-3 rounded-lg font-semibold text-xs border border-indigo-400/40 text-indigo-200 hover:bg-white/10 transition-colors"
              >
                Browse Supplier Directory
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
