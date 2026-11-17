import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProductImage } from "@/components/ui/ProductImage";
import { GuestEnquiryModal } from "@/components/modals/GuestEnquiryModal";
import type { Product, Category, Business, BusinessService } from "@/types";
import {
  Search,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Building2,
  Package,
  Layers,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Briefcase,
  ChevronRight,
  Send,
  SlidersHorizontal,
  Clock,
  Factory,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [popularSuppliers, setPopularSuppliers] = useState<Business[]>([]);
  const [businessServices, setBusinessServices] = useState<BusinessService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hero Search States
  const [heroSearch, setHeroSearch] = useState("");
  const [heroCity, setHeroCity] = useState("All India");
  const [heroCategory, setHeroCategory] = useState("all");

  // Modal State for Enquiry
  const [enquiryProduct, setEnquiryProduct] = useState<any | null>(null);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  // Quick CTA Form State
  const [ctaName, setCtaName] = useState("");
  const [ctaPhone, setCtaPhone] = useState("");
  const [ctaRequirement, setCtaRequirement] = useState("");
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [ctaLoading, setCtaLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      // 1. Categories
      fetch(`${API_BASE}/categories`)
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data : d.data?.items || [])),
      // 2. Featured Products
      fetch(`${API_BASE}/products?limit=8`)
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data : d.data?.items || [])),
      // 3. Recently Added Products
      fetch(`${API_BASE}/products?sort=created_at&limit=4`)
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data : d.data?.items || [])),
      // 4. Popular Suppliers
      fetch(`${API_BASE}/directory/search`)
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data : d.data?.items || [])),
      // 5. Business Services
      fetch(`${API_BASE}/business-services?limit=4`)
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data : d.data?.items || [])),
    ])
      .then(([cats, featured, recents, suppliers, services]) => {
        setCategories(cats);
        setFeaturedProducts(featured);
        setRecentProducts(recents);
        setPopularSuppliers(suppliers.slice(0, 6));
        setBusinessServices(services);
      })
      .catch((err) => {
        console.error("Error loading homepage data:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroSearch.trim()) params.set("search", heroSearch.trim());
    if (heroCity !== "All India") params.set("city", heroCity);
    if (heroCategory !== "all") params.set("category", heroCategory);

    navigate(`/products?${params.toString()}`);
  };

  const handleCtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctaName.trim() || !ctaPhone.trim() || !ctaRequirement.trim()) return;

    setCtaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/concierge-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ctaName.trim(),
          phone: ctaPhone.trim(),
          requirement: ctaRequirement.trim(),
          category: "General Homepage Inquiry",
        }),
      });
      if (res.ok) {
        setCtaSubmitted(true);
      }
    } catch {
      // Handle network error
    } finally {
      setCtaLoading(false);
    }
  };

  const openEnquiry = (prod: any) => {
    setEnquiryProduct(prod);
    setIsEnquiryModalOpen(true);
  };

  const popularTags = [
    { label: "TMT Rebars (Fe-550D)", query: "TMT Rebar" },
    { label: "5-Ply Corrugated Boxes", query: "Corrugated Box" },
    { label: "HDPE Woven Sacks", query: "HDPE Woven" },
    { label: "Caustic Soda Flakes", query: "Caustic Soda" },
    { label: "IR-64 Non-Basmati Rice", query: "Rice" },
    { label: "FR-4 PCBs", query: "PCB" },
    { label: "3-Ply Surgical Masks", query: "Surgical Mask" },
    { label: "Trademark Registration", url: "/services/category/business-registration-legal" },
  ];

  return (
    <div className="space-y-14 md:space-y-20 pb-16">
      {/* 1. HERO SEARCH SECTION (IndiaMART / Justdial Inspired) */}
      <section className="relative bg-gradient-to-b from-blue-950 via-slate-900 to-blue-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-700/80 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            Verified B2B Discovery & Factory-Direct Sourcing
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Connect Directly With Leading Indian Manufacturers & Wholesalers
          </h1>

          <p className="mt-4 text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            Discover wholesale raw materials, industrial machinery, packaging, and commercial business services with transparent landed-cost calculation.
          </p>

          {/* Prominent B2B Search Box */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 bg-white p-2 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-blue-900/30"
          >
            {/* Category Select */}
            <div className="flex items-center px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 md:w-52">
              <Layers className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
              <select
                value={heroCategory}
                onChange={(e) => setHeroCategory(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City Selector */}
            <div className="flex items-center px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 md:w-44">
              <MapPin className="w-4 h-4 text-blue-900 shrink-0 mr-2" />
              <select
                value={heroCity}
                onChange={(e) => setHeroCity(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All India">All India</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Surat">Surat</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Pune">Pune</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Vadodara">Vadodara</option>
              </select>
            </div>

            {/* Product/Keyword Search Input */}
            <div className="flex-1 flex items-center px-3 py-1 text-stone-900">
              <Search className="w-4 h-4 text-stone-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Enter wholesale product, brand, HS Code, or material..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none py-1.5"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-7 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Search className="w-4 h-4" />
              Find Products
            </button>
          </form>

          {/* Trending Search Tags */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-blue-200">
            <span className="font-semibold text-white">Popular Sourcing:</span>
            {popularTags.map((tag) =>
              tag.url ? (
                <Link
                  key={tag.label}
                  to={tag.url}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition backdrop-blur-xs"
                >
                  {tag.label}
                </Link>
              ) : (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => navigate(`/products?search=${encodeURIComponent(tag.query || "")}`)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition backdrop-blur-xs"
                >
                  {tag.label}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* 2. POPULAR PRODUCT CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-900 mb-1">
              Top Industrial Verticals
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Browse Wholesale Product Categories
            </h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 transition"
          >
            View All {categories.length} Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {categories.slice(0, 12).map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group p-4 bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-blue-700 hover:shadow-md transition text-center flex flex-col items-center justify-between"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 group-hover:text-blue-900 transition line-clamp-1">
                  {cat.label || cat.name}
                </h3>
                <div className="text-[10px] text-stone-500 font-medium mt-1">
                  Standard MOQ: {cat.default_qty || 100} {cat.unit || "units"}
                </div>
              </div>
              <span className="mt-2 text-[10px] font-semibold text-blue-700 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                Explore <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS (Ecommerce Style Product Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified Sourcing Stock
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Featured Wholesale Products
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 transition"
          >
            Explore Complete Catalogue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => {
            const hasVerified = p.businesses?.verification_level && p.businesses.verification_level !== "unverified";
            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-800/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Product Image / Placeholder */}
                  <Link to={`/products/${p.id}`} className="block relative">
                    <ProductImage
                      src={p.product_images?.[0]?.image_url}
                      alt={p.title}
                      categoryId={p.category_id}
                      aspectRatio="square"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-stone-900/80 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                      MOQ: {p.moq?.toLocaleString("en-IN")} {p.unit}
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] text-blue-900 font-semibold uppercase tracking-wider">
                      {p.category_id.replace("-", " ")}
                    </div>

                    <Link to={`/products/${p.id}`}>
                      <h3 className="text-sm font-bold text-stone-900 line-clamp-2 hover:text-blue-900 transition leading-snug">
                        {p.title}
                      </h3>
                    </Link>

                    {/* Price in INR */}
                    <div className="pt-1">
                      <div className="text-lg font-extrabold text-stone-900 tracking-tight">
                        ₹{p.indicative_price?.toLocaleString("en-IN")}{" "}
                        <span className="text-xs font-medium text-stone-500 font-normal">
                          / {p.unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        Indicative factory-gate rate
                      </div>
                    </div>

                    {/* Supplier info */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                      <div className="truncate flex-1">
                        <div className="font-semibold text-stone-900 truncate">
                          {p.businesses?.name || "Verified Indian Supplier"}
                        </div>
                        <div className="text-[10px] text-stone-500 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {p.businesses?.city || "Industrial Hub"}, {p.businesses?.state || "India"}
                        </div>
                      </div>

                      {hasVerified && (
                        <div className="shrink-0 pl-1" title="Document Verified Supplier">
                          <ShieldCheck className="w-4 h-4 text-blue-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex gap-2">
                  <Link
                    to={`/products/${p.id}`}
                    className="flex-1 py-2 text-center rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() =>
                      openEnquiry({
                        id: p.id,
                        title: p.title,
                        indicative_price: p.indicative_price,
                        unit: p.unit,
                        moq: p.moq,
                        business_name: p.businesses?.name,
                        category: p.category_id,
                      })
                    }
                    className="flex-1 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    Send Enquiry
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. RECENTLY ADDED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-stone-600 mb-0.5">
                New Arrivals
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                Recently Added Sourcing Lots
              </h2>
            </div>
            <Link
              to="/products?sort=newest"
              className="text-xs font-bold text-blue-900 hover:text-blue-700 transition"
            >
              Browse Recent Lots →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-xs hover:border-blue-700 transition flex gap-3 items-center"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <ProductImage
                    src={p.product_images?.[0]?.image_url}
                    alt={p.title}
                    categoryId={p.category_id}
                    aspectRatio="square"
                  />
                </div>
                <div className="truncate flex-1">
                  <Link
                    to={`/products/${p.id}`}
                    className="text-xs font-bold text-stone-900 truncate block hover:text-blue-900"
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs font-extrabold text-blue-950 mt-0.5">
                    ₹{p.indicative_price?.toLocaleString("en-IN")}{" "}
                    <span className="text-[10px] text-stone-500 font-normal">/ {p.unit}</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1 truncate">
                    MOQ: {p.moq} • {p.businesses?.city || "India"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. POPULAR SUPPLIERS, MANUFACTURERS & WHOLESALERS (Justdial / IndiaMART Usability) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-900 mb-1">
              Supplier Directory
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Verified Industrial Manufacturers & Wholesalers
            </h2>
          </div>
          <Link
            to="/manufacturers"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 transition"
          >
            Explore Supplier Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularSuppliers.map((s: any) => {
            const isVerified = s.verification_level && s.verification_level !== "unverified";
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-lg hover:border-blue-800 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-950 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 line-clamp-1">{s.name}</h3>
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {s.city}, {s.state}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                      {s.business_type}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mt-4 line-clamp-2 leading-relaxed">
                    {s.legal_name || "Commercial B2B supplier and wholesale aggregate stockist."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="text-stone-500 text-[11px]">
                      Status:{" "}
                      <span className="font-semibold text-stone-800 capitalize">
                        {s.verification_level?.replace("_", " ") || "Registered"}
                      </span>
                    </div>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">Standard Account</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex gap-2">
                  <Link
                    to={`/suppliers/${s.slug}`}
                    className="flex-1 py-2 text-center rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() =>
                      openEnquiry({
                        title: `Supply inquiry for ${s.name}`,
                        business_name: s.name,
                      })
                    }
                    className="flex-1 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    Contact Supplier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BUSINESS SERVICES SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Turnkey Enterprise Solutions
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Professional Business Services Hub
              </h2>
              <p className="text-sm text-blue-200 mt-1 max-w-xl">
                Accelerate your factory or wholesale practice with company incorporation, GST filing, trademark protection, export freight, and cloud ERP systems.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition shrink-0"
            >
              Explore All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businessServices.map((serv) => (
              <div
                key={serv.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between hover:bg-white/15 transition"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-3">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{serv.title}</h3>
                  <p className="text-xs text-blue-200 mt-2 line-clamp-2 leading-relaxed">
                    {serv.short_description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-300 block">Starting at</span>
                    <span className="text-sm font-extrabold text-white">
                      ₹{serv.starting_price?.toLocaleString("en-IN") || "Custom"}
                    </span>
                  </div>
                  <Link
                    to={`/services/${serv.id}`}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white text-xs font-semibold text-white hover:text-stone-950 transition"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HOW COVERLY WORKS (Clean 3-Step B2B Procurement) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-900 mb-1">
            Structured Sourcing Protocol
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            How COVERLY Transforms B2B Procurement
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            No broker commissions, no opaque freight markups. Simple, direct manufacturer discovery with true landed-cost comparison.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-extrabold text-lg mb-4 shadow-xs">
              01
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              Post Your Buy Requirement
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Specify your volume, target price, material specifications, and delivery destination in a single click.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-extrabold text-lg mb-4 shadow-xs">
              02
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              Receive Verified Quotations
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Verified Indian factories and distributors review your requirement and submit itemized commercial quotes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-extrabold text-lg mb-4 shadow-xs">
              03
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              Compare True Landed Costs
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our automated landed-cost engine calculates base price, freight by PIN code, and GST into one true payable figure.
            </p>
          </div>
        </div>
      </section>

      {/* 8. BUSINESS ENQUIRY CTA SECTION (Interactive Post Requirement) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              100% Free Sourcing Assistance
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
              Submit your specific raw material, machine dimension, or component requirement. Our verified supplier network will reach out directly.
            </p>
          </div>

          <div className="w-full md:w-96 bg-white text-stone-900 rounded-2xl p-5 shadow-lg">
            {ctaSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm">Requirement Received!</div>
                <p className="text-xs text-stone-600">
                  Our sourcing team has notified relevant suppliers. Expect quotes shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCtaSubmit} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Quick Sourcing Request
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={ctaName}
                  onChange={(e) => setCtaName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="10-Digit Mobile Number"
                  value={ctaPhone}
                  onChange={(e) => setCtaPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <textarea
                  rows={2}
                  required
                  placeholder="Describe item, quantity & city..."
                  value={ctaRequirement}
                  onChange={(e) => setCtaRequirement(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={ctaLoading}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {ctaLoading ? "Submitting..." : "Get Free Factory Quotes"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Universal Enquiry Modal */}
      <GuestEnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        product={enquiryProduct}
      />
    </div>
  );
};
