import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductImage } from "@/components/ui/ProductImage";
import { GuestEnquiryModal } from "@/components/modals/GuestEnquiryModal";
import type { Product, Category } from "@/types";
import {
  Search,
  Filter,
  ShieldCheck,
  ArrowRight,
  Building2,
  LayoutGrid,
  List,
  MapPin,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Package,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // View state: grid or list
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Active filters from URL
  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";
  const selectedCity = searchParams.get("city") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minMoq = searchParams.get("minMoq") || "";
  const sortBy = searchParams.get("sort") || "newest";
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);

  // Enquiry Modal
  const [enquiryProduct, setEnquiryProduct] = useState<any | null>(null);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  // 1. Fetch Categories
  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(Array.isArray(data.data) ? data.data : data.data?.items || []);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Filtered Products
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCity) params.set("city", selectedCity);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minMoq) params.set("minMoq", minMoq);
    if (sortBy) params.set("sort", sortBy);
    params.set("page", String(currentPage));
    params.set("limit", "16");

    fetch(`${API_BASE}/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const items = Array.isArray(data.data) ? data.data : data.data?.items || [];
          setProducts(items);
          setTotalCount(data.data?.total || items.length);
          setTotalPages(data.data?.totalPages || Math.ceil((data.data?.total || items.length) / 16) || 1);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedCategory, searchQuery, selectedCity, minPrice, maxPrice, minMoq, sortBy, currentPage]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1"); // Reset to page 1 on filter changes
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const openEnquiry = (prod: any) => {
    setEnquiryProduct(prod);
    setIsEnquiryModalOpen(true);
  };

  const cities = ["Delhi NCR", "Mumbai", "Surat", "Ahmedabad", "Pune", "Bengaluru", "Hyderabad", "Vadodara", "Raipur", "Rajkot", "Guntur", "Baddi"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <Link to="/" className="hover:text-stone-900 transition">Home</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Wholesale Marketplace</span>
          {selectedCategory && (
            <>
              <span>/</span>
              <span className="text-blue-900 font-semibold capitalize">
                {selectedCategory.replace("-", " ")}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              Wholesale B2B Product Discovery
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Explore factory-direct lots with verified MOQs, indicative rates in INR, and genuine supplier profiles.
            </p>
          </div>

          <div className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg shrink-0">
            Showing <span className="text-stone-900 font-bold">{totalCount}</span> Products
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Products List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* LEFT SIDEBAR FILTERS */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="font-bold text-xs uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" />
              Filter Products
            </span>
            {(selectedCategory || searchQuery || selectedCity || minPrice || maxPrice || minMoq) && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Title, material, spec..."
                value={searchQuery}
                onChange={(e) => updateParam("search", e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-2">
              Product Category
            </label>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => updateParam("category", "")}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition flex items-center justify-between ${
                  !selectedCategory
                    ? "bg-blue-900 text-white font-bold"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span>All Categories</span>
                <span>{totalCount}</span>
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateParam("category", isSelected ? "" : cat.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-900 text-white font-bold"
                        : "text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <span className="truncate">{cat.label || cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* City / Location Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Supplier Location
            </label>
            <select
              value={selectedCity}
              onChange={(e) => updateParam("city", e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="">All Regions</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter (INR) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => updateParam("minPrice", e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => updateParam("maxPrice", e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* MOQ Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Minimum Order Qty (MOQ)
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={minMoq}
              onChange={(e) => updateParam("minMoq", e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS & PRODUCT CATALOGUE */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Control Bar (Sort + View Switcher) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="newest">Recently Listed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="moq_asc">MOQ: Smallest First</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-stone-100 rounded-2xl h-80" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-900">No Wholesale Products Found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No active lots matched your search criteria. Try removing filters or searching by a broader keyword.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-2 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => {
                const hasVerified = p.businesses?.verification_level && p.businesses.verification_level !== "unverified";
                return (
                  <div
                    key={p.id}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-800/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image */}
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

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <div className="text-[11px] text-blue-900 font-semibold uppercase tracking-wider">
                          {p.category_id?.replace("-", " ")}
                        </div>

                        <Link to={`/products/${p.id}`}>
                          <h3 className="text-sm font-bold text-stone-900 line-clamp-2 hover:text-blue-900 transition leading-snug">
                            {p.title}
                          </h3>
                        </Link>

                        {/* Price */}
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

                    {/* Action buttons */}
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
                            business_id: p.business_id || p.businesses?.id,
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
          ) : (
            /* LIST VIEW */
            <div className="space-y-4">
              {products.map((p) => {
                const hasVerified = p.businesses?.verification_level && p.businesses.verification_level !== "unverified";
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-blue-800/40 transition flex flex-col sm:flex-row gap-5 items-stretch justify-between"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start flex-1">
                      <div className="w-full sm:w-44 h-44 rounded-xl overflow-hidden shrink-0">
                        <ProductImage
                          src={p.product_images?.[0]?.image_url}
                          alt={p.title}
                          categoryId={p.category_id}
                          aspectRatio="square"
                        />
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="text-[11px] text-blue-900 font-semibold uppercase tracking-wider">
                          {p.category_id?.replace("-", " ")}
                        </div>

                        <Link to={`/products/${p.id}`}>
                          <h3 className="text-base font-bold text-stone-900 hover:text-blue-900 transition leading-snug">
                            {p.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {p.description || "High grade commercial consignment for wholesale buyers and manufacturers across India."}
                        </p>

                        <div className="pt-2 flex flex-wrap gap-4 text-xs text-stone-700">
                          <div>
                            <span className="text-stone-500 font-medium">MOQ: </span>
                            <span className="font-bold text-stone-900">
                              {p.moq?.toLocaleString("en-IN")} {p.unit}
                            </span>
                          </div>
                          {p.hs_code && (
                            <div>
                              <span className="text-stone-500 font-medium">HS Code: </span>
                              <span className="font-semibold text-stone-900">{p.hs_code}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-stone-500 font-medium">Supplier: </span>
                            <span className="font-semibold text-stone-900">{p.businesses?.name}</span>
                          </div>
                          <div>
                            <span className="text-stone-500 font-medium">Dispatch City: </span>
                            <span className="font-semibold text-stone-900">{p.businesses?.city}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sm:border-l sm:border-stone-100 sm:pl-5 flex flex-col justify-between sm:w-56 shrink-0 pt-3 sm:pt-0 border-t border-stone-100">
                      <div>
                        <div className="text-xl font-extrabold text-stone-900 tracking-tight">
                          ₹{p.indicative_price?.toLocaleString("en-IN")}{" "}
                          <span className="text-xs font-normal text-stone-500">/ {p.unit}</span>
                        </div>
                        <div className="text-[10px] text-stone-500">Indicative wholesale rate</div>

                        {hasVerified && (
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Supplier
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mt-4">
                        <button
                          onClick={() =>
                            openEnquiry({
                              id: p.id,
                              title: p.title,
                              indicative_price: p.indicative_price,
                              unit: p.unit,
                              moq: p.moq,
                              business_id: p.business_id || p.businesses?.id,
                              business_name: p.businesses?.name,
                              category: p.category_id,
                            })
                          }
                          className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          Send Enquiry
                        </button>
                        <Link
                          to={`/products/${p.id}`}
                          className="block w-full py-1.5 text-center border border-stone-300 hover:bg-stone-50 rounded-lg text-xs font-semibold text-stone-800 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateParam("page", String(currentPage - 1))}
                className="px-3 py-1.5 rounded-lg border border-stone-200 disabled:opacity-40 hover:bg-stone-100 flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="font-semibold">
                Page {currentPage} of {totalPages}
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateParam("page", String(currentPage + 1))}
                className="px-3 py-1.5 rounded-lg border border-stone-200 disabled:opacity-40 hover:bg-stone-100 flex items-center gap-1 font-semibold"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Guest Enquiry Modal */}
      <GuestEnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        product={enquiryProduct}
        supplier={
          enquiryProduct?.business_id
            ? { id: enquiryProduct.business_id, name: enquiryProduct.business_name }
            : null
        }
      />
    </div>
  );
};
