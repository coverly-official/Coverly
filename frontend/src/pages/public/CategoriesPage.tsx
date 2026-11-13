import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ProductCategory } from "@/types";
import { Layers, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          Wholesale Product Categories
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Browse verified categories across apparel, industrial packaging, steel, and raw materials.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 h-36 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group bg-white border border-stone-200 hover:border-stone-400 rounded-xl p-6 transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 mb-4 group-hover:bg-stone-900 group-hover:text-white transition">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-stone-900 mb-1 group-hover:text-stone-700 transition">
                  {cat.label}
                </h3>
                <p className="text-xs text-stone-500">
                  Standard Sourcing Unit: <span className="font-medium text-stone-700">{cat.unit}</span> • Typical MOQ: <span className="font-medium text-stone-700">{cat.default_qty}</span>
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                Explore Catalog <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
