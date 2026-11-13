import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Product, ProductCategory } from "@/types";
import { Search, Filter, ShieldCheck, ArrowRight, Tag, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "newest";

  useEffect(() => {
    // Load categories
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    if (sortBy) params.set("sort", sortBy);

    fetch(`${API_BASE}/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedCategory, searchQuery, sortBy]);

  const handleCategorySelect = (catId: string) => {
    const next = new URLSearchParams(searchParams);
    if (catId === selectedCategory) {
      next.delete("category");
    } else {
      next.set("category", catId);
    }
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          Wholesale Product Marketplace
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Explore factory-direct wholesale products with verified minimum order quantities and transparent indicative prices.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title, specs, or keyword..."
            value={searchQuery}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) {
                next.set("search", e.target.value);
              } else {
                next.delete("search");
              }
              setSearchParams(next);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-800 focus:border-stone-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              next.set("sort", e.target.value);
              setSearchParams(next);
            }}
            className="text-xs sm:text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-800"
          >
            <option value="newest">Sort by Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 text-xs no-scrollbar">
        <button
          onClick={() => handleCategorySelect("")}
          className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
            !selectedCategory
              ? "bg-stone-900 text-white border-stone-900 font-semibold"
              : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? "bg-stone-900 text-white border-stone-900 font-semibold"
                : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-4 animate-pulse h-64" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
          <Tag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No products found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Try adjusting your search terms or selecting another category from above.
          </p>
          <div className="mt-4">
            <Link
              to="/buyer/rfq/new"
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              Post an RFQ for Custom Sourcing
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <Link
              key={prod.id}
              to={`/products/${prod.id}`}
              className="group bg-white border border-stone-200 hover:border-stone-400 rounded-xl overflow-hidden transition shadow-xs flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
                  <span className="font-medium text-stone-700 uppercase tracking-wider">
                    MOQ: {prod.moq} {prod.unit}s
                  </span>
                  {prod.businesses?.verification_level && prod.businesses.verification_level !== "unverified" && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-sm text-stone-900 group-hover:text-stone-700 transition line-clamp-2 mb-2">
                  {prod.title}
                </h3>

                {prod.businesses && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{prod.businesses.name}</span>
                    <span>•</span>
                    <span>{prod.businesses.city}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider">Indicative Price</div>
                  <div className="text-base font-bold text-stone-900">
                    ₹{Number(prod.indicative_price).toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-stone-500">/{prod.unit}</span>
                  </div>
                </div>
                <div className="text-xs font-semibold text-stone-800 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
