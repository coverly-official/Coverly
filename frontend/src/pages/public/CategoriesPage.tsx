import React, { useState, useEffect } from "react";
import type { ProductCategory } from "@/types";
import { WholesaleCategoryCard } from "@/components/marketplace/WholesaleCategoryCard";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const items = Array.isArray(data.data) ? data.data : data.data?.items || [];
          setCategories(items);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1D4ED8] mb-1.5">
          Top Industrial Verticals
        </div>
        <h1 className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-slate-950">
          Browse Wholesale Product Categories
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Explore all {categories.length || 15} verified B2B sourcing verticals with standard wholesale MOQ tiers.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3.5 h-56 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <WholesaleCategoryCard key={cat.id} category={cat} alwaysShowExplore />
          ))}
        </div>
      )}
    </div>
  );
};
