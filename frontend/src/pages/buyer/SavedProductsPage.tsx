import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Heart, Package, ArrowRight, Trash2, Building2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SavedProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/buyer/saved-products`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });
      const json = await res.json();
      if (json.success) {
        setSavedProducts(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  const handleRemove = async (productId: string) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/buyer/saved-products/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });
      await loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Saved Products</h1>
          <p className="text-xs text-stone-500 mt-1">
            Bookmarked commodities, materials, and wholesale catalog items.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> {savedProducts.length} Bookmarked
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-stone-400">Loading saved products...</div>
      ) : savedProducts.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-800">No products saved yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Browse the marketplace to find raw materials, packaging, machinery, and wholesale products, and save items for procurement review.
          </p>
          <Link
            to="/products"
            className="inline-block mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {savedProducts.map((entry) => {
            const prod = entry.products;
            return (
              <div key={entry.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ₹{prod?.indicative_price?.toLocaleString() || "Quote"} / {prod?.unit || "unit"}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      MOQ: <strong className="text-stone-800">{prod?.moq || 1}</strong>
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-bold text-stone-900 line-clamp-1">{prod?.title || "Product"}</h3>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                    <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{prod?.businesses?.name || "Verified Supplier"}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3">
                  <button
                    onClick={() => handleRemove(prod?.id || entry.product_id)}
                    className="text-stone-400 hover:text-rose-600 text-xs flex items-center gap-1"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Remove</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/products/${prod?.id}`}
                      className="text-xs font-semibold text-stone-700 hover:text-stone-900"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/buyer/rfq/new?product_id=${prod?.id}&title=${encodeURIComponent(prod?.title || "")}`}
                      className="px-3 py-1.5 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-400 flex items-center gap-1"
                    >
                      RFQ
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
