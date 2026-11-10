"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SampleProduct, sampleProducts } from "@/data/products";
import { productCategories } from "@/data/productCategories";
import { ProductCard } from "@/components/browse/ProductCard";
import { RequestQuoteModal } from "@/components/browse/RequestQuoteModal";
import { AccountDialog } from "@/components/ui/AccountDialog";
import { Button } from "@/components/ui/Button";
import {
  Search,
  Filter,
  MapPin,
  SlidersHorizontal,
  Bookmark,
  ArrowUpDown,
  RotateCcw,
  Layers,
  Sparkles,
} from "lucide-react";

const CHHATTISGARH_NEARBY_CITIES = ["Bhilai", "Durg", "Raipur"];

const AVAILABLE_STATES = [
  "Chhattisgarh",
  "Gujarat",
  "Maharashtra",
  "Punjab",
  "Madhya Pradesh",
];

export function BrowseClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state initialization
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialScope = searchParams.get("scope") || "Nearby";
  const initialState = searchParams.get("state") || "Chhattisgarh";
  const initialSort = searchParams.get("sort") || "relevance";
  const initialSupplierType = searchParams.get("type") || "all";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedScope, setSelectedScope] = useState<"Nearby" | "Across state" | "All World">(
    (initialScope as "Nearby" | "Across state" | "All World") || "Nearby"
  );
  const [selectedState, setSelectedState] = useState(initialState);
  const [sortBy, setSortBy] = useState(initialSort);
  const [supplierType, setSupplierType] = useState(initialSupplierType);
  const [maxMoq, setMaxMoq] = useState<number | "">("");

  // Modals state
  const [quoteProduct, setQuoteProduct] = useState<SampleProduct | null>(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [accountFeature, setAccountFeature] = useState<string | null>(null);

  // Sync state to URL
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedScope !== "Nearby") params.set("scope", selectedScope);
    if (selectedState !== "Chhattisgarh") params.set("state", selectedState);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    if (supplierType !== "all") params.set("type", supplierType);
    if (maxMoq) params.set("maxMoq", String(maxMoq));

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedScope,
    selectedState,
    sortBy,
    supplierType,
    maxMoq,
    pathname,
    router,
  ]);

  useEffect(() => {
    const timer = setTimeout(updateUrlParams, 300);
    return () => clearTimeout(timer);
  }, [updateUrlParams]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return sampleProducts.filter((p) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSupplier = p.supplierName.toLowerCase().includes(q);
        const matchesCity = p.city.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesSupplier && !matchesCity && !matchesDesc) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) {
        return false;
      }

      // Supplier Type filter
      if (supplierType !== "all" && p.supplierType !== supplierType) {
        return false;
      }

      // MOQ filter
      if (maxMoq && p.moq > Number(maxMoq)) {
        return false;
      }

      // Location Scope filter
      if (selectedScope === "Nearby") {
        const isNearby =
          p.state.toLowerCase() === selectedState.toLowerCase() &&
          CHHATTISGARH_NEARBY_CITIES.map((c) => c.toLowerCase()).includes(
            p.city.toLowerCase()
          );
        if (!isNearby) return false;
      } else if (selectedScope === "Across state") {
        if (p.state.toLowerCase() !== selectedState.toLowerCase()) {
          return false;
        }
      }
      // "All World" includes all suppliers everywhere

      return true;
    });
  }, [
    searchQuery,
    selectedCategory,
    supplierType,
    maxMoq,
    selectedScope,
    selectedState,
  ]);

  // Sorting Logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "price-low") {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-high") {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === "moq-low") {
      return list.sort((a, b) => a.moq - b.moq);
    }
    if (sortBy === "nearest") {
      return list.sort((a, b) => {
        const aIsNearby = CHHATTISGARH_NEARBY_CITIES.includes(a.city) ? 0 : a.state === selectedState ? 1 : 2;
        const bIsNearby = CHHATTISGARH_NEARBY_CITIES.includes(b.city) ? 0 : b.state === selectedState ? 1 : 2;
        return aIsNearby - bIsNearby;
      });
    }
    return list;
  }, [filteredProducts, sortBy, selectedState]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedScope("Across state");
    setSelectedState("Chhattisgarh");
    setSortBy("relevance");
    setSupplierType("all");
    setMaxMoq("");
  };

  const handleRequestQuote = (prod: SampleProduct) => {
    setQuoteProduct(prod);
    setIsQuoteOpen(true);
  };

  return (
    <div className="min-h-screen bg-canvas py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Top Header & Context */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-heading font-semibold mb-3">
          <Sparkles size={13} />
          Guest Marketplace (Sample data)
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ink tracking-tight mb-2">
          Browse Products & Suppliers
        </h1>
        <p className="text-base text-ink-secondary max-w-3xl leading-relaxed">
          Find raw materials, packaging, and commercial supplies. Discover
          nearby providers first, then across your state, then All World.
        </p>
      </div>

      {/* Guest Gating Utility Strip */}
      <div className="mb-8 p-4 rounded-2xl bg-surface border border-[rgba(45,50,80,0.06)] shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
          <span className="w-2 h-2 rounded-full bg-coral" />
          <span>Guest browsing mode enabled. Accounts are coming soon for workflow tools.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAccountFeature("Side-by-side quote comparison")}
            className="text-xs"
          >
            <SlidersHorizontal size={13} />
            Compare quotes
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAccountFeature("Saved suppliers")}
            className="text-xs"
          >
            <Bookmark size={13} />
            Saved suppliers
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAccountFeature("Unified order dashboard")}
            className="text-xs"
          >
            <Layers size={13} />
            Order dashboard
          </Button>
        </div>
      </div>

      {/* Search & Location Bar */}
      <div className="bg-surface rounded-2xl p-5 border border-[rgba(45,50,80,0.08)] shadow-soft mb-8 space-y-4">
        {/* Search input + Category select */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/70 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, materials, specs or suppliers..."
              className="w-full pl-10 pr-4 h-11 rounded-xl bg-surface-muted border border-[rgba(45,50,80,0.1)] text-sm text-ink placeholder:text-ink-secondary/70 focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-[rgba(45,50,80,0.1)] text-sm text-ink focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value="all">All 9 Categories</option>
              {productCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Scope Tabs & State Selector */}
        <div className="pt-3 border-t border-[rgba(45,50,80,0.06)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-heading font-semibold text-ink-secondary mr-1">
              Discovery Scope:
            </span>
            {(["Nearby", "Across state", "All World"] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setSelectedScope(scope)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedScope === scope
                    ? "bg-navy text-white shadow-soft"
                    : "bg-surface-muted text-ink-secondary hover:text-ink hover:bg-surface-muted/80"
                }`}
              >
                {scope}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <MapPin size={14} className="text-coral flex-shrink-0" />
            <span className="text-ink-secondary font-medium">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-muted border border-[rgba(45,50,80,0.1)] text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-navy"
            >
              {AVAILABLE_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="mb-8 overflow-x-auto pb-2 flex items-center gap-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === "all"
              ? "bg-coral text-navy font-semibold"
              : "bg-surface text-ink-secondary border border-[rgba(45,50,80,0.08)] hover:text-ink"
          }`}
        >
          All
        </button>
        {productCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? "bg-coral text-navy font-semibold"
                : "bg-surface text-ink-secondary border border-[rgba(45,50,80,0.08)] hover:text-ink"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Controls & Results Count */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ink-secondary pb-3 border-b border-[rgba(45,50,80,0.06)]">
        <div>
          Showing <strong className="text-ink font-mono">{sortedProducts.length}</strong> sample products
          {selectedCategory !== "all" && ` in ${productCategories.find((c) => c.id === selectedCategory)?.name}`}
          {selectedScope === "Nearby" && ` (Nearby ${selectedState})`}
          {selectedScope === "Across state" && ` (Across ${selectedState})`}
          {selectedScope === "All World" && " (All World)"}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-ink">Type:</span>
            <select
              value={supplierType}
              onChange={(e) => setSupplierType(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface border border-[rgba(45,50,80,0.1)] text-xs text-ink focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Wholesaler">Wholesaler</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={12} className="text-ink-secondary" />
            <span className="font-medium text-ink">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface border border-[rgba(45,50,80,0.1)] text-xs text-ink focus:outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="nearest">Nearest first</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="moq-low">MOQ: Low to High</option>
            </select>
          </div>

          {(searchQuery || selectedCategory !== "all" || supplierType !== "all" || selectedScope !== "Nearby") && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-coral hover:underline font-semibold"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Product Grid / Empty State */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-[rgba(45,50,80,0.06)] shadow-soft p-8">
          <div className="w-12 h-12 rounded-2xl bg-surface-muted mx-auto flex items-center justify-center text-ink-secondary mb-4">
            <Search size={22} />
          </div>
          <h2 className="text-lg font-heading font-bold text-ink mb-2">
            No sample products found
          </h2>
          <p className="text-sm text-ink-secondary max-w-md mx-auto mb-6">
            Try adjusting your search terms or expand your discovery scope from
            &quot;Nearby&quot; to &quot;Across state&quot; or &quot;All World&quot;.
          </p>
          <Button type="button" variant="primary" size="md" onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onRequestQuote={handleRequestQuote}
            />
          ))}
        </div>
      )}

      {/* Quote Modal */}
      <RequestQuoteModal
        product={quoteProduct}
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />

      {/* Account Gating Dialog */}
      <AccountDialog
        isOpen={Boolean(accountFeature)}
        onClose={() => setAccountFeature(null)}
        title="Accounts are coming soon"
        description={`${accountFeature || "This feature"} is currently in development. Reach out on WhatsApp if you want early access during our Chhattisgarh pilot.`}
      />
    </div>
  );
}
