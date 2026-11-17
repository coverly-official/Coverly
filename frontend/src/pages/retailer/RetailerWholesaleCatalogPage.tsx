import React, { useEffect, useState } from "react";
import { Search, Filter, Bookmark, Heart, Store, Building2, ShoppingBag, CheckCircle, Tag } from "lucide-react";
import { Product } from "@/types";

export const RetailerWholesaleCatalogPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplierType, setSelectedSupplierType] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  async function loadCategories() {
    try {
      const res = await fetch("/api/retailer/categories");
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Load categories error:", err);
    }
  }

  async function loadProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedSupplierType) params.append("supplier_type", selectedSupplierType);

      const res = await fetch(`/api/retailer/products?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error("Load products error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProduct(productId: string) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/retailer/saved-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg("Product saved to your bookmarks.");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error("Save product error:", err);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Search className="w-6 h-6 text-emerald-700" />
            Wholesale Product Marketplace
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Discover wholesale inventory directly from verified manufacturers, wholesalers, and regional distributors.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          {statusMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search wholesale products, brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadProducts()}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Supplier Type Dropdown */}
          <select
            value={selectedSupplierType}
            onChange={(e) => setSelectedSupplierType(e.target.value)}
            className="text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">All Supplier Types</option>
            <option value="wholesaler">Wholesaler</option>
            <option value="distributor">Distributor</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="importer">Importer</option>
          </select>

          <button
            onClick={loadProducts}
            className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-20 text-stone-500 text-xs">Searching wholesale catalog...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-stone-200 p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900">No Wholesale Products Found</h3>
          <p className="text-xs text-stone-500 mt-1">Try adjusting your category or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((prod) => {
            const biz = Array.isArray(prod.businesses) ? prod.businesses[0] : prod.businesses;
            const img = prod.product_images?.[0]?.image_url || null;
            return (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition"
              >
                <div>
                  {/* Image Placeholder */}
                  <div className="h-40 bg-stone-100 flex items-center justify-center relative overflow-hidden">
                    {img ? (
                      <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-stone-300" />
                    )}
                    <button
                      onClick={() => handleSaveProduct(prod.id)}
                      title="Save product"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-rose-600 shadow-xs backdrop-blur-xs transition"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                      {prod.category_id || "Wholesale"}
                    </span>
                    <h3 className="text-xs font-bold text-stone-900 line-clamp-2">{prod.name}</h3>

                    <div className="flex items-baseline gap-1 text-emerald-800 font-bold">
                      <span className="text-sm">₹{Number(prod.indicative_price || 0).toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-stone-500 font-normal">/ {prod.unit || "unit"}</span>
                    </div>

                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-1 border-t border-stone-100">
                      <Tag className="w-3 h-3 text-stone-400" />
                      <span>MOQ: {prod.moq || 1} {prod.unit || "units"}</span>
                    </div>

                    {biz && (
                      <div className="text-[11px] text-stone-600 flex items-center justify-between pt-1">
                        <span className="truncate font-medium">{biz.name}</span>
                        <span className="text-[10px] text-stone-400 shrink-0">{biz.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-2">
                  <a
                    href={`/retailer/purchase-lists`}
                    className="flex-1 text-center py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                  >
                    Add to List
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
