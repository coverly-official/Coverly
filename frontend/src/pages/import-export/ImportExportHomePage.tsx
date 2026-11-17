import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Ship,
  TrendingUp,
  Building2,
  Package,
  Layers,
  Wheat,
  Utensils,
  Factory,
  Scissors,
  Cpu,
  Building,
  CheckCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { InternationalProduct, TradeParty } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ImportExportHomePage: React.FC = () => {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [direction, setDirection] = useState<"import" | "export">("import");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [requiredQty, setRequiredQty] = useState("");

  const [featuredProducts, setFeaturedProducts] = useState<InternationalProduct[]>([]);
  const [topExporters, setTopExporters] = useState<TradeParty[]>([]);
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [rateTimestamp, setRateTimestamp] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const tradeCategories = [
    {
      id: "trd-cat-agri",
      name: "Agricultural Commodities",
      slug: "agricultural-products",
      description: "Basmati rice, non-basmati, wheat, maize, pulses, spices, soybean, tea, and cotton.",
      icon: Wheat,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "trd-cat-food",
      name: "Food & Processed Products",
      slug: "food-processed-products",
      description: "Ready-to-eat snacks, dehydrated powders, edible oils, food ingredients, and purees.",
      icon: Utensils,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "trd-cat-industrial",
      name: "Industrial & Machinery",
      slug: "industrial-machinery",
      description: "Steel billets, aluminium ingots, copper cathodes, CNC machines, and industrial valves.",
      icon: Factory,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "trd-cat-chemicals",
      name: "Chemicals & Polymers",
      slug: "chemicals-and-materials",
      description: "Polymer resins, plastic granules, dyes, pigments, and certified industrial chemicals.",
      icon: Layers,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "trd-cat-textiles",
      name: "Textiles & Garments",
      slug: "textiles-and-apparel",
      description: "Combed cotton yarn, greige fabrics, home textiles, terry towels, and readymade apparel.",
      icon: Scissors,
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      id: "trd-cat-packaging",
      name: "Packaging Products",
      slug: "packaging-products",
      description: "FIBC bulk jumbo bags, flexible barrier pouches, corrugated boxes, and packaging reels.",
      icon: Package,
      color: "bg-stone-50 text-stone-700 border-stone-200",
    },
    {
      id: "trd-cat-electronics",
      name: "Electronics & Electricals",
      slug: "electronics-and-electrical",
      description: "Copper winding wire, power cables, switchgear, semiconductors, and electronic parts.",
      icon: Cpu,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      id: "trd-cat-construction",
      name: "Construction Materials",
      slug: "construction-materials",
      description: "Vitrified floor tiles, Portland cement, marble, granite slabs, and structural steel.",
      icon: Building,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, expRes, currRes] = await Promise.all([
          fetch(`${API_BASE}/import-export/products?limit=8`),
          fetch(`${API_BASE}/import-export/exporters`),
          fetch(`${API_BASE}/import-export/currencies`),
        ]);

        if (prodRes.ok) {
          const json = await prodRes.json();
          if (json.success && json.data) setFeaturedProducts(json.data);
        }
        if (expRes.ok) {
          const json = await expRes.json();
          if (json.success && json.data) setTopExporters(json.data.slice(0, 4));
        }
        if (currRes.ok) {
          const json = await currRes.json();
          if (json.success && json.data) {
            setCurrencyRates(json.data.rates || {});
            setRateTimestamp(json.data.timestamp || "");
          }
        }
      } catch (err) {
        console.error("Failed to load trade data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
    if (destinationCountry.trim()) params.append("origin_country", destinationCountry.trim());
    navigate(`/import-export/products?${params.toString()}`);
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-indigo-900/60">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            Cross-Border B2B Trade & Containerized Export Sourcing Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Indian Exporters & Global Importers Marketplace
          </h1>
          <p className="mt-4 text-base sm:text-lg text-indigo-200/90 max-w-3xl mx-auto font-normal">
            Discover verified Star Export Houses, FOB/CIF container pricing, DGFT-verified IEC exporters, international trade documentation, and customs clearance coordination.
          </p>

          {/* Sourcing Search Box */}
          <div className="mt-8 max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-4 text-stone-900 border border-stone-200">
            {/* Direction Toggle */}
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-100 text-xs font-bold">
              <span className="text-stone-400 uppercase text-[10px] tracking-wider mr-1">Trade Direction:</span>
              <button
                type="button"
                onClick={() => setDirection("import")}
                className={`px-3 py-1 rounded-lg transition ${
                  direction === "import"
                    ? "bg-indigo-900 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                I want to Import into my Country
              </button>
              <button
                type="button"
                onClick={() => setDirection("export")}
                className={`px-3 py-1 rounded-lg transition ${
                  direction === "export"
                    ? "bg-indigo-900 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                I want to Source Indian Exports
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Product Keyword */}
              <div className="text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Product / HS Code
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus-within:bg-white focus-within:border-indigo-600 transition">
                  <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Basmati Rice, 1006.30, Cotton..."
                    className="w-full text-xs font-medium focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Product Category
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus-within:bg-white focus-within:border-indigo-600 transition">
                  <Layers className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs font-medium focus:outline-none bg-transparent"
                  >
                    <option value="all">All 8 Categories</option>
                    {tradeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination / Origin Country */}
              <div className="text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Destination Country / Port
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus-within:bg-white focus-within:border-indigo-600 transition">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="e.g. UAE, Dubai, Germany..."
                    className="w-full text-xs font-medium focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Quantity (MT / FCL)
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus-within:bg-white focus-within:border-indigo-600 transition">
                  <Package className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="number"
                    value={requiredQty}
                    onChange={(e) => setRequiredQty(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full text-xs font-medium focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Search CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  Find Global Trade
                </button>
              </div>
            </form>

            <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-700">Top Trade Routes:</span>
                <span>India → UAE (Jebel Ali)</span>
                <span>•</span>
                <span>India → EU (Rotterdam)</span>
                <span>•</span>
                <span>India → USA (New York)</span>
              </div>
              <Link
                to="/import-export/rfq"
                className="text-indigo-950 font-bold hover:underline inline-flex items-center gap-1"
              >
                Submit Custom Import/Export Requirement <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Global Currency Exchange Rates Reference Bar */}
      <section className="bg-stone-900 text-stone-300 py-3 px-4 border-b border-stone-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white uppercase text-[10px] tracking-wider">
              Indicative Trade Rates (INR):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <span>1 USD = ₹{currencyRates.USD || "86.50"}</span>
            <span>1 EUR = ₹{currencyRates.EUR || "91.20"}</span>
            <span>1 AED = ₹{currencyRates.AED || "23.55"}</span>
            <span>1 GBP = ₹{currencyRates.GBP || "109.80"}</span>
            <span>1 SGD = ₹{currencyRates.SGD || "64.20"}</span>
          </div>

          <span className="text-[10px] text-stone-500 hidden md:inline">
            Source: RBI Reference Rate
          </span>
        </div>
      </section>

      {/* 3. 8 International Trade Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Global Product Categories</h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Browse export commodities, industrial equipment and consumer products verified for international trade.
            </p>
          </div>
          <Link
            to="/import-export/products"
            className="text-xs sm:text-sm font-bold text-indigo-950 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            Explore All Listings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tradeCategories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/import-export/products?category=${cat.id}`}
                className="bg-white rounded-xl p-5 border border-stone-200 hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg border ${cat.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-indigo-600 transition" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-indigo-950 transition">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Custom Trade Requirement CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-indigo-800">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Ship className="w-3.5 h-3.5 text-indigo-400" />
              FOB / CIF Quotations & Custom Clearance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Looking to Import from India or Sourcing Internationally?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-2 leading-relaxed">
              Post your trade requirement with destination port and target Incoterms (FOB, CFR, CIF, DDP). Receive formal quotations, phytosanitary certifications, inspection reports, and ocean freight rates.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              to="/import-export/rfq"
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm text-center shadow-lg transition"
            >
              Post Trade Requirement
            </Link>
            <Link
              to="/import-export/exporters"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl text-xs sm:text-sm text-center border border-white/20 transition"
            >
              Browse Exporters Directory
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Featured Export Listings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-stone-200">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Featured Export Listings</h2>
            <p className="text-xs text-stone-500 mt-0.5">Approved Indian exporter commodities with live FOB/CIF indicative pricing.</p>
          </div>
          <Link
            to="/import-export/products"
            className="text-xs font-bold text-indigo-900 hover:underline flex items-center gap-1"
          >
            View All ({featuredProducts.length}) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-stone-200/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <Link
                key={p.id}
                to={`/import-export/products/${p.slug}`}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md hover:border-indigo-300 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 bg-stone-100 flex items-center justify-center relative overflow-hidden">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <Package className="w-12 h-12 text-stone-300" />
                    )}
                    <span className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {p.incoterm_basis} • {p.currency}
                    </span>
                    {p.hs_code && (
                      <span className="absolute top-2 right-2 bg-indigo-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        HS {p.hs_code}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5">
                    <h3 className="font-bold text-stone-900 text-xs line-clamp-2 group-hover:text-indigo-950 transition">
                      {p.name}
                    </h3>
                    <div className="mt-1.5 text-[11px] text-stone-500">
                      Origin: <strong className="text-stone-700">{p.origin_country}</strong> ({p.loading_port || "Port of India"})
                    </div>
                  </div>
                </div>

                <div className="p-3.5 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-stone-400 font-semibold uppercase">{p.incoterm_basis} Rate</div>
                    <div className="text-sm font-extrabold text-indigo-950">
                      ${p.base_price_fob.toLocaleString("en-IN")}{" "}
                      <span className="text-[10px] font-normal text-stone-500">/ {p.unit_of_measurement}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-stone-400 font-semibold uppercase">MOQ</div>
                    <div className="text-xs font-bold text-stone-700">
                      {p.moq} {p.unit_of_measurement}s
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <Globe className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="text-xs text-stone-600 font-medium">Approved export listings will appear here.</p>
            <Link
              to="/import-export/rfq"
              className="mt-3 inline-block text-xs font-bold text-indigo-900 hover:underline"
            >
              Post an import requirement to invite global exporters
            </Link>
          </div>
        )}
      </section>

      {/* 6. Accredited Exporters Spotlight */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">DGFT-Accredited Indian Export Houses</h2>
            <p className="text-xs text-stone-500 mt-0.5">Audited IEC credentials, AEO accreditation and port registration.</p>
          </div>
          <Link
            to="/import-export/exporters"
            className="text-xs font-bold text-indigo-900 hover:underline flex items-center gap-1"
          >
            All Exporters <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topExporters.length > 0 ? (
            topExporters.map((exp) => (
              <Link
                key={exp.id}
                to={`/import-export/parties/${exp.id}`}
                className="bg-white rounded-xl border border-stone-200 p-4 hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                      {exp.party_type?.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      ★ {exp.rating || "4.9"}
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-xs line-clamp-1">
                    {exp.businesses?.name || exp.headline}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                    {exp.description || "International trader with containerized FCL/LCL capability."}
                  </p>
                  <div className="mt-2 text-[11px] text-stone-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{exp.country_name || "India"}</span>
                    {exp.iec_code && <span className="font-mono text-[10px] text-stone-400 ml-1">IEC: {exp.iec_code}</span>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 font-medium">Turnover</span>
                  <span className="font-bold text-stone-800">{exp.annual_trade_turnover || "$5M+"}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-4 bg-white rounded-xl border border-stone-200 p-8 text-center">
              <Building2 className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <p className="text-xs text-stone-600">Verified exporters will appear here.</p>
              <Link
                to="/import-export/dashboard"
                className="mt-2 inline-block text-xs font-bold text-indigo-900 hover:underline"
              >
                Are you an exporter? Register your IEC code
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ImportExportHomePage;
