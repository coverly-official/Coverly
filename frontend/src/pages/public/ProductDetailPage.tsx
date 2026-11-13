import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Product } from "@/types";
import { Building2, ShieldCheck, Tag, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProduct(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-72 bg-stone-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-6 bg-stone-200 rounded w-2/3" />
            <div className="h-4 bg-stone-200 rounded w-1/2" />
            <div className="h-24 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Product Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">The product listing you requested does not exist or has been removed.</p>
        <Link to="/products" className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-lg">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <Link to="/" className="hover:text-stone-900">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-stone-900">Products</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-900 truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details (Left 2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                MOQ: {product.moq} {product.unit}s
              </span>
              {product.hs_code && (
                <span className="text-xs text-stone-500">HS Code: {product.hs_code}</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-4">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-stone-100">
              <span className="text-3xl font-extrabold text-stone-900">
                ₹{Number(product.indicative_price).toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-stone-500">per {product.unit} (Indicative ex-factory price)</span>
            </div>

            {/* Description */}
            <div className="prose prose-sm text-stone-600 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-2">Description</h3>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {product.description || "Verified industrial grade wholesale specification. Request an official quotation to receive customized volume pricing including freight and applicable GST."}
              </p>
            </div>

            {/* Tiered volume pricing table if available */}
            {product.tiered_pricing && product.tiered_pricing.length > 0 && (
              <div className="mt-6 pt-6 border-t border-stone-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 mb-3">
                  Volume Pricing Tiers
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {product.tiered_pricing.map((tier, idx) => (
                    <div key={idx} className="bg-stone-50 border border-stone-200/80 rounded-lg p-3 text-center">
                      <div className="text-[11px] text-stone-500">
                        {tier.minQty} {tier.maxQty ? `– ${tier.maxQty}` : "+"} {product.unit}s
                      </div>
                      <div className="text-sm font-bold text-stone-900 mt-1">
                        ₹{Number(tier.unitPrice).toLocaleString("en-IN")}
                        <span className="text-[10px] font-normal text-stone-500">/{product.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Supplier Business Card & RFQ CTA */}
        <div className="space-y-6">
          {product.businesses && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Supplier</div>
                {product.businesses.verification_level !== "unverified" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Supplier
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-base text-stone-900 mb-1">
                {product.businesses.name}
              </h4>
              <p className="text-xs text-stone-500 mb-4 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {product.businesses.city}, {product.businesses.state}
              </p>

              <Link
                to={`/suppliers/${product.businesses.slug}`}
                className="block text-center text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 py-2 rounded-lg transition"
              >
                View Supplier Profile & Facility
              </Link>
            </div>
          )}

          {/* Sourcing Action Card */}
          <div className="bg-stone-900 text-white rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold mb-2">Need bulk supply?</h3>
            <p className="text-xs text-stone-300 leading-relaxed mb-6">
              Create a Request for Quotation (RFQ) directly for this item to receive comparative landed cost proposals with transparent freight and taxes.
            </p>

            <Link
              to={`/buyer/rfq/new?product_id=${product.id}&title=${encodeURIComponent(product.title)}&category=${product.category_id}&moq=${product.moq}`}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 bg-white text-stone-900 hover:bg-stone-100 rounded-lg transition"
            >
              Request Custom Quotation
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
