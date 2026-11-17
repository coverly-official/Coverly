import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Search,
  MapPin,
  Box,
  ShieldCheck,
  FileText,
  Package,
  Utensils,
  Factory,
  Tag,
  Component,
  ArrowRight,
  TrendingUp,
  Building2,
  CheckCircle,
  Sparkles,
  Truck,
  Printer,
  ChevronRight,
} from "lucide-react";
import { PackagingProduct, PackagingSupplierProfile } from "../../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const PackagingHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [requiredQty, setRequiredQty] = useState("");
  const [unit, setUnit] = useState("piece");

  const [featuredProducts, setFeaturedProducts] = useState<PackagingProduct[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<PackagingSupplierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const packagingCategories = [
    {
      id: "pkg-cat-flexible",
      name: "Flexible Packaging",
      slug: "flexible-packaging",
      description: "Stand-up pouches, zipper pouches, vacuum pouches, rolls and multi-barrier films.",
      icon: Layers,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "pkg-cat-rigid",
      name: "Rigid Packaging",
      slug: "rigid-packaging",
      description: "Plastic containers, HDPE/PET bottles, jars, tubs, drums, buckets and pails.",
      icon: Box,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      id: "pkg-cat-paper",
      name: "Paper Packaging",
      slug: "paper-packaging",
      description: "Kraft paper bags, pouches, paper cartons, mailing envelopes, paper tubes and rolls.",
      icon: FileText,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      id: "pkg-cat-corrugated",
      name: "Corrugated Packaging",
      slug: "corrugated-packaging",
      description: "Shipping cartons, 3-ply, 5-ply, 7-ply multi-layer boxes, heavy duty boxes and mailers.",
      icon: Package,
      color: "bg-stone-50 text-stone-700 border-stone-200",
    },
    {
      id: "pkg-cat-food",
      name: "Food Packaging",
      slug: "food-packaging",
      description: "Snack pouches, dry fruit bags, spice packets, rice bags, bakery and frozen food boxes.",
      icon: Utensils,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "pkg-cat-industrial",
      name: "Industrial Packaging",
      slug: "industrial-packaging",
      description: "FIBC bulk jumbo bags, HDPE woven bags, multiwall paper sacks and pallet wraps.",
      icon: Factory,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "pkg-cat-labels",
      name: "Labels and Printing",
      slug: "labels-and-printing",
      description: "Custom roll stickers, barcode labels, printed product sleeves and shrink sleeves.",
      icon: Tag,
      color: "bg-pink-50 text-pink-700 border-pink-200",
    },
    {
      id: "pkg-cat-protective",
      name: "Protective Packaging",
      slug: "protective-packaging",
      description: "Bubble wraps, EPE foam sheets, air cushions, edge protectors and custom inserts.",
      icon: ShieldCheck,
      color: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      id: "pkg-cat-accessories",
      name: "Packaging Accessories",
      slug: "packaging-accessories",
      description: "Caps, closures, induction heat seals, BOPP tapes, strapping bands and handles.",
      icon: Component,
      color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, supRes] = await Promise.all([
          fetch(`${API_BASE}/packaging/products?limit=8`),
          fetch(`${API_BASE}/packaging/suppliers`),
        ]);

        if (prodRes.ok) {
          const json = await prodRes.json();
          if (json.success && json.data) {
            setFeaturedProducts(json.data);
          }
        }
        if (supRes.ok) {
          const json = await supRes.json();
          if (json.success && json.data) {
            setTopSuppliers(json.data.slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to load packaging marketplace data", err);
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
    if (deliveryLocation.trim()) params.append("location", deliveryLocation.trim());
    if (requiredQty.trim()) params.append("min_moq", requiredQty.trim());
    navigate(`/packaging/products?${params.toString()}`);
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-blue-950 via-slate-900 to-blue-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-blue-900/60">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Verified Packaging Manufacturers, Converters & Printing Specialists
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Custom & Bulk Packaging Sourcing Platform
          </h1>
          <p className="mt-4 text-base sm:text-lg text-blue-200/90 max-w-3xl mx-auto font-normal">
            Source pouches, corrugated shipping boxes, rigid containers, food barrier films and custom branded packaging directly from verified manufacturers with transparent bulk pricing.
          </p>

          {/* Sourcing Search Engine */}
          <div className="mt-8 max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-4 text-stone-900 border border-stone-200">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Product / Material Search */}
              <div className="relative text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Packaging Type / Item
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition">
                  <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Stand-up pouch, 5-ply box..."
                    className="w-full text-xs font-medium focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Packaging Category
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition">
                  <Layers className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs font-medium focus:outline-none bg-transparent"
                  >
                    <option value="all">All 9 Categories</option>
                    {packagingCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Required Quantity & Unit */}
              <div className="text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Required Quantity
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2 py-1.5 bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition">
                  <input
                    type="number"
                    value={requiredQty}
                    onChange={(e) => setRequiredQty(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full text-xs font-medium focus:outline-none bg-transparent px-1"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="text-[11px] font-semibold border-l border-stone-300 pl-1 text-stone-600 bg-transparent focus:outline-none"
                  >
                    <option value="piece">Pieces</option>
                    <option value="box">Boxes</option>
                    <option value="roll">Rolls</option>
                    <option value="kg">KG</option>
                    <option value="packet">Packets</option>
                  </select>
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="text-left">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Delivery Destination
                </label>
                <div className="flex items-center border border-stone-300 rounded-lg px-2.5 py-2 bg-stone-50 focus-within:bg-white focus-within:border-blue-600 transition">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="City or State"
                    className="w-full text-xs font-medium focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  Find Packaging
                </button>
              </div>
            </form>

            <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-700">Popular Searches:</span>
                <span className="cursor-pointer hover:text-blue-900 font-medium" onClick={() => setSearchQuery("Stand-up zipper pouch")}>Stand-up Zipper Pouches</span>
                <span>•</span>
                <span className="cursor-pointer hover:text-blue-900 font-medium" onClick={() => setSearchQuery("5-ply shipping carton")}>5-Ply Corrugated Cartons</span>
                <span>•</span>
                <span className="cursor-pointer hover:text-blue-900 font-medium" onClick={() => setSearchQuery("Roll labels")}>Roll Labels</span>
              </div>
              <Link
                to="/packaging/rfq"
                className="text-blue-950 font-bold hover:underline inline-flex items-center gap-1"
              >
                Need custom size or printed artwork? Submit Custom RFQ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Structured 9 Packaging Categories Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Standard Packaging Categories</h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Select category to discover verified converters, manufacturer direct catalogs and technical specifications.
            </p>
          </div>
          <Link
            to="/packaging/products"
            className="text-xs sm:text-sm font-bold text-blue-950 hover:text-blue-800 inline-flex items-center gap-1"
          >
            Explore All Catalogues <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packagingCategories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/packaging/products?category=${cat.id}`}
                className="bg-white rounded-xl p-5 border border-stone-200/90 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg border ${cat.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-400 group-hover:text-blue-600 transition flex items-center gap-0.5">
                      Explore <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm group-hover:text-blue-950 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Custom Packaging Solutions CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-blue-800">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              Tailored Manufacturing & Printing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Have Custom Packaging Specifications or Branded Artwork?
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-2 leading-relaxed">
              Upload your die-lines, specify barrier layers, print up to 8 rotogravure / flexo colours, request pre-production samples, and receive itemized landed-cost quotes from verified converters.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              to="/packaging/rfq"
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm text-center shadow-lg transition"
            >
              Post Custom Requirement
            </Link>
            <Link
              to="/packaging/suppliers"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl text-xs sm:text-sm text-center border border-white/20 transition"
            >
              View Converters Directory
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Featured Packaging Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-stone-200">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Featured Packaging Catalogues</h2>
            <p className="text-xs text-stone-500 mt-0.5">Approved manufacturer listings with live bulk quantity tiers.</p>
          </div>
          <Link
            to="/packaging/products"
            className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
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
                to={`/packaging/products/${p.slug}`}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 bg-stone-100 flex items-center justify-center relative overflow-hidden">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <Package className="w-12 h-12 text-stone-300" />
                    )}
                    <span className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {p.packaging_type || "Packaging"}
                    </span>
                  </div>

                  <div className="p-3.5">
                    <h3 className="font-bold text-stone-900 text-xs line-clamp-2 group-hover:text-blue-950 transition">
                      {p.name}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-stone-500">
                      <span>Material: {p.material_type}</span>
                    </div>
                    {p.thickness && (
                      <div className="text-[11px] text-stone-500">
                        Thickness: {p.thickness}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-stone-400 font-semibold uppercase">Starting Price</div>
                    <div className="text-sm font-extrabold text-blue-950">
                      ₹{p.base_price.toLocaleString("en-IN")}{" "}
                      <span className="text-[10px] font-normal text-stone-500">/ {p.unit_of_measurement}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-stone-400 font-semibold uppercase">MOQ</div>
                    <div className="text-xs font-bold text-stone-700">
                      {p.moq.toLocaleString("en-IN")} {p.unit_of_measurement}s
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <Package className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <p className="text-xs text-stone-600 font-medium">Approved packaging listings will appear here.</p>
            <Link
              to="/packaging/rfq"
              className="mt-3 inline-block text-xs font-bold text-blue-900 hover:underline"
            >
              Post a custom requirement to invite converters
            </Link>
          </div>
        )}
      </section>

      {/* 5. Verified Packaging Converters & Suppliers Directory Highlight */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Accredited Packaging Converters & Mills</h2>
            <p className="text-xs text-stone-500 mt-0.5">Audited manufacturing capabilities, food-grade certifications & production capacities.</p>
          </div>
          <Link
            to="/packaging/suppliers"
            className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
          >
            All Converters <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topSuppliers.length > 0 ? (
            topSuppliers.map((sup) => (
              <Link
                key={sup.id}
                to={`/packaging/suppliers/${sup.id}`}
                className="bg-white rounded-xl border border-stone-200 p-4 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      {sup.supplier_type?.replace(/_/g, " ")}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600">
                      ★ {sup.rating || "4.8"}
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-xs line-clamp-1">
                    {sup.businesses?.name || sup.headline}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                    {sup.description || "Custom packaging converting and flexo/rotogravure printing facility."}
                  </p>
                  <div className="mt-2 text-[11px] text-stone-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{sup.businesses?.city || "Industrial Cluster"}, {sup.businesses?.state || "India"}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 font-medium">Capacity</span>
                  <span className="font-bold text-stone-800">{sup.production_capacity || "500k units/mo"}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-4 bg-white rounded-xl border border-stone-200 p-8 text-center">
              <Building2 className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <p className="text-xs text-stone-600">Verified packaging manufacturers will appear here.</p>
              <Link
                to="/packaging-supplier/dashboard"
                className="mt-2 inline-block text-xs font-bold text-blue-900 hover:underline"
              >
                Are you a converter? Register your facility
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PackagingHomePage;
