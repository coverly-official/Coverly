import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/types";
import { PlusCircle, Package, ArrowRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const SupplierProductsPage: React.FC = () => {
  const { business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    setIsLoading(true);

    fetch(`${API_BASE}/products?business_id=${business.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [business]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Product Catalog Management</h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your factory products, MOQs, volume discount tiers, and technical specifications
          </p>
        </div>

        <Link
          to="/supplier/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition shadow-xs self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Product
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-800">No products added yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Add your manufacturing catalog to receive targeted RFQs and direct buyer inquiries.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
              <tr>
                <th className="py-3.5 px-4">Product Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">MOQ</th>
                <th className="py-3.5 px-4">Indicative Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-stone-900">{p.title}</td>
                  <td className="py-3 px-4 capitalize">{p.category_id.replace("-", " ")}</td>
                  <td className="py-3 px-4">
                    {p.moq} {p.unit}s
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    ₹{Number(p.indicative_price).toLocaleString("en-IN")}/{p.unit}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/products/${p.id}`}
                      className="font-semibold text-stone-900 hover:underline inline-flex items-center gap-1"
                    >
                      Marketplace Link <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
