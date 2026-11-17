import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Factory,
  Search,
  Filter,
  MapPin,
  Building2,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  X,
  Scale,
  FileText,
} from "lucide-react";
import { RawMaterialProduct } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const RawMaterialsProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<RawMaterialProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [gradeFilter, setGradeFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");

  // Comparison State
  const [compareList, setCompareList] = useState<RawMaterialProduct[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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
      specifications: { yield_strength_mpa: 550, elongation: "16.5%", carbon_content_pct: "0.22%" },
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
      description: "Semi-chemical fluting kraft reels for high-strength corrugated carton production.",
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

  const fetchProducts = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (gradeFilter) params.set("grade", gradeFilter);
    if (unitFilter !== "all") params.set("unit", unitFilter);
    if (sortOption !== "default") params.set("sort", sortOption);

    fetch(`${API_BASE}/raw-materials/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
        } else {
          setProducts(fallbackProducts);
        }
      })
      .catch(() => {
        setProducts(fallbackProducts);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, unitFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const toggleCompare = (prod: RawMaterialProduct) => {
    if (compareList.some((p) => p.id === prod.id)) {
      setCompareList((prev) => prev.filter((p) => p.id !== prod.id));
    } else {
      if (compareList.length >= 4) {
        alert("You can compare up to 4 raw materials at a time.");
        return;
      }
      setCompareList((prev) => [...prev, prod]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header */}
      <section className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Factory className="w-3.5 h-3.5 text-indigo-400" />
              Raw Material Catalogue
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Industrial, Agro & Chemical Raw Materials
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Browse wholesale catalogue with verified material specifications, factory MOQs, and volume price tiers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/raw-materials/rfq"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Post Bulk RFQ
            </Link>
          </div>
        </div>
      </section>

      {/* Main Filter & Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 h-fit shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Refine Catalogue
              </h3>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setGradeFilter("");
                  setUnitFilter("all");
                  setSortOption("default");
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Reset
              </button>
            </div>

            {/* Keyword Search */}
            <form onSubmit={handleSearchSubmit} className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Keyword Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Fe 550D, Kraft Paper, HDPE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </form>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Industry Domain
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="all">All Domains</option>
                <option value="rm-cat-agri">Agricultural Raw Materials</option>
                <option value="rm-cat-food">Food Processing Inputs</option>
                <option value="rm-cat-industrial">Industrial Metals & Minerals</option>
                <option value="rm-cat-polymers">Plastic & Polymer Granules</option>
                <option value="rm-cat-textiles">Textile Yarns & Fibres</option>
                <option value="rm-cat-construction">Construction Materials</option>
                <option value="rm-cat-packaging">Paper & Packaging Inputs</option>
                <option value="rm-cat-wood">Wood & Furniture Materials</option>
                <option value="rm-cat-electronics">Electrical & Electronics</option>
              </select>
            </div>

            {/* Unit of Measurement Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Unit of Measurement
              </label>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="all">All Units</option>
                <option value="metric_ton">Metric Ton (MT)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="piece">Piece (pc)</option>
                <option value="litre">Litre (L)</option>
                <option value="metre">Metre (m)</option>
              </select>
            </div>

            {/* Grade Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Material Grade Filter
              </label>
              <input
                type="text"
                placeholder="e.g. Fe 500D, Pusa 1121, MFI 20..."
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <button
              onClick={fetchProducts}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Apply Filters
            </button>
          </div>

          {/* Right Column: Products List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Top Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-xs text-slate-600 font-semibold">
                Showing <span className="text-slate-900 font-bold">{products.length}</span> Verified Raw Material Listings
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="default">Most Relevant</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="moq_asc">MOQ: Smallest First</option>
                </select>
              </div>
            </div>

            {/* Compare Bar if Items Selected */}
            {compareList.length > 0 && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-700" />
                  <span className="font-bold text-indigo-900">
                    {compareList.length} Material{compareList.length > 1 ? "s" : ""} Selected for Comparison
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs shadow-xs"
                  >
                    Compare Side-by-Side
                  </button>
                  <button
                    onClick={() => setCompareList([])}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Product Cards */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                    <div className="h-10 bg-slate-50 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                <Factory className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900">No raw materials matched your search</h3>
                <p className="text-xs text-slate-500 mt-1">Try broadening your keyword or clearing filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((prod) => {
                  const isCompared = compareList.some((p) => p.id === prod.id);
                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {prod.material_grade || "Industrial Spec"}
                          </span>
                          {prod.origin && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Origin: {prod.origin}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600">
                          <Link to={`/raw-materials/products/${prod.slug || prod.id}`}>
                            {prod.name}
                          </Link>
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2">
                          {prod.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {prod.raw_material_supplier_profiles?.businesses?.name || "Verified Supplier"}
                          </span>
                          <span>•</span>
                          <span>{prod.raw_material_supplier_profiles?.businesses?.city || "India"}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            Lead time: {prod.lead_time_days} days
                          </span>
                        </div>
                      </div>

                      {/* Pricing & CTA Column */}
                      <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 sm:border-l sm:border-slate-100 sm:pl-6 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">
                            Indicative Price
                          </div>
                          <div className="text-lg font-black text-slate-900 mt-0.5">
                            ₹{prod.base_price.toLocaleString("en-IN")}
                            <span className="text-xs font-normal text-slate-500">
                              {" "}
                              / {prod.unit_of_measurement}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            MOQ: <strong>{prod.moq} {prod.unit_of_measurement}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => toggleCompare(prod)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              isCompared
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                            }`}
                          >
                            {isCompared ? "✓ Compared" : "+ Compare"}
                          </button>
                          <Link
                            to={`/raw-materials/rfq?product=${prod.slug || prod.id}&material=${encodeURIComponent(prod.name)}`}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                          >
                            Get Quote
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                Raw Material Side-by-Side Comparison
              </h3>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {compareList.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="font-bold text-sm text-slate-900">{item.name}</div>
                  <div className="text-[11px] font-bold text-indigo-700 uppercase">
                    Grade: {item.material_grade || "N/A"}
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 text-slate-600">
                    <div>
                      <strong>Indicative Price:</strong> ₹{item.base_price} / {item.unit_of_measurement}
                    </div>
                    <div>
                      <strong>MOQ:</strong> {item.moq} {item.unit_of_measurement}
                    </div>
                    <div>
                      <strong>Origin:</strong> {item.origin || "Industrial Cluster"}
                    </div>
                    <div>
                      <strong>Lead Time:</strong> {item.lead_time_days} days
                    </div>
                    <div>
                      <strong>Supplier:</strong> {item.raw_material_supplier_profiles?.businesses?.name || "Verified Mill"}
                    </div>
                    <div>
                      <strong>City:</strong> {item.raw_material_supplier_profiles?.businesses?.city || "India"}
                    </div>
                  </div>
                  <Link
                    to={`/raw-materials/rfq?product=${item.slug || item.id}&material=${encodeURIComponent(item.name)}`}
                    className="block w-full py-2 bg-indigo-600 text-white font-bold rounded text-center mt-3 hover:bg-indigo-700"
                  >
                    Request Quotation
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
