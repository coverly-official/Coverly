import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProductImage } from "@/components/ui/ProductImage";
import { GuestEnquiryModal } from "@/components/modals/GuestEnquiryModal";
import type { Product } from "@/types";
import {
  Building2,
  ShieldCheck,
  Tag,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Send,
  FileText,
  Package,
  Layers,
  Phone,
  Clock,
  ExternalLink,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProduct(data.data);

          // Fetch other products from same supplier
          if (data.data.business_id) {
            fetch(`${API_BASE}/products?business_id=${data.data.business_id}&limit=4`)
              .then((r) => r.json())
              .then((sp) => {
                if (sp.success) {
                  const items = (Array.isArray(sp.data) ? sp.data : sp.data?.items || []).filter(
                    (p: any) => p.id !== id
                  );
                  setSupplierProducts(items);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-stone-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-stone-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-stone-200 rounded w-3/4" />
            <div className="h-6 bg-stone-200 rounded w-1/3" />
            <div className="h-32 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Wholesale Product Not Found</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          The product listing you requested does not exist or has been archived by the supplier.
        </p>
        <Link
          to="/products"
          className="inline-flex px-5 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  const images = product.images || product.product_images || [];
  const currentImageUrl = images[selectedImageIndex]?.image_url || null;
  const isVerified =
    product.businesses?.verification_level && product.businesses.verification_level !== "unverified";

  // Filter out internal metadata keys from specifications table
  const specs = Object.entries(product.specifications || {}).filter(
    ([k]) => !k.startsWith("_")
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-stone-900 transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-stone-900 transition">
          Products
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          to={`/products?category=${product.category_id}`}
          className="hover:text-stone-900 transition capitalize"
        >
          {product.category_id?.replace("-", " ")}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-900 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: IMAGE GALLERY (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Display Image */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <ProductImage
              src={currentImageUrl}
              alt={product.title}
              categoryId={product.category_id}
              aspectRatio="square"
            />
          </div>

          {/* Thumbnail Gallery Strip (if multiple images) */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img: any, idx: number) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImageIndex === idx ? "border-blue-900 ring-2 ring-blue-900/20" : "border-stone-200"
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Supplier Trust Badge Card */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-800" />
              Direct Factory Sourcing Guarantee
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Order directly from verified Indian manufacturing plants with transparent landed-cost calculations and milestone-gated payment protection.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: COMMERCIAL DETAILS & SPECS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Title & Tag */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-950 text-[11px] font-bold uppercase tracking-wider">
                  {product.category_id?.replace("-", " ")}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-semibold">
                  MOQ: {product.moq?.toLocaleString("en-IN")} {product.unit}s
                </span>
                {product.hs_code && (
                  <span className="text-[11px] text-stone-500 font-mono">
                    ITC-HS: {product.hs_code}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
                {product.title}
              </h1>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-stone-500 font-medium">Indicative Wholesale Rate</div>
                <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
                  ₹{Number(product.indicative_price).toLocaleString("en-IN")}{" "}
                  <span className="text-sm font-normal text-stone-500">/ {product.unit}</span>
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  Ex-factory wholesale benchmark (taxes & freight calculated at quotation)
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnquiryModalOpen(true)}
                  className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Sourcing Enquiry
                </button>
              </div>
            </div>

            {/* Volume Tiered Pricing Table */}
            {product.tiered_pricing && product.tiered_pricing.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Volume Tiered Pricing Breaks
                </h3>
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 font-bold text-stone-700">
                      <tr>
                        <th className="py-2.5 px-4">Order Quantity ({product.unit}s)</th>
                        <th className="py-2.5 px-4 text-right">Price per {product.unit}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {product.tiered_pricing.map((tier: any, i: number) => (
                        <tr key={i} className="hover:bg-stone-50/50">
                          <td className="py-2.5 px-4 font-semibold text-stone-900">
                            {tier.min_qty?.toLocaleString("en-IN")}+ {product.unit}s
                          </td>
                          <td className="py-2.5 px-4 text-right font-extrabold text-emerald-700">
                            ₹{Number(tier.price).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Product Description & Scope
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {product.description ||
                  "Commercial wholesale consignment engineered for bulk buyers, industrial processors, and retail chains across India. Inquire for custom packaging, OEM private labelling, or high-volume dispatch."}
              </p>
            </div>

            {/* Technical Specifications Table */}
            {specs.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Technical Specifications
                </h3>
                <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                    <div className="divide-y divide-stone-100">
                      {specs.slice(0, Math.ceil(specs.length / 2)).map(([key, val]) => (
                        <div key={key} className="py-2.5 px-4 flex justify-between gap-2">
                          <span className="text-stone-500 font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-stone-900 font-semibold text-right">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="divide-y divide-stone-100">
                      {specs.slice(Math.ceil(specs.length / 2)).map(([key, val]) => (
                        <div key={key} className="py-2.5 px-4 flex justify-between gap-2">
                          <span className="text-stone-500 font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-stone-900 font-semibold text-right">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier Profile Card */}
            {product.businesses && (
              <div className="pt-4 border-t border-stone-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3">
                  Supplier Information
                </h3>
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-950 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                      {product.businesses.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-stone-900">
                        {product.businesses.name}
                        {isVerified && (
                          <span title="Verified Business">
                            <ShieldCheck className="w-4 h-4 text-blue-700" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {product.businesses.city}, {product.businesses.state}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/suppliers/${product.businesses.slug}`}
                      className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-xs font-semibold rounded-lg text-stone-800 transition flex items-center gap-1"
                    >
                      View Profile <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS FROM SAME SUPPLIER */}
      {supplierProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-stone-200">
          <h2 className="text-xl font-bold tracking-tight text-stone-900 mb-6">
            More Wholesale Products from this Supplier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {supplierProducts.map((sp) => (
              <div
                key={sp.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <Link to={`/products/${sp.id}`} className="block">
                    <ProductImage
                      src={sp.product_images?.[0]?.image_url}
                      alt={sp.title}
                      categoryId={sp.category_id}
                      aspectRatio="square"
                    />
                  </Link>
                  <div className="p-4 space-y-1">
                    <Link to={`/products/${sp.id}`}>
                      <h4 className="text-xs font-bold text-stone-900 line-clamp-2 hover:text-blue-900 leading-snug">
                        {sp.title}
                      </h4>
                    </Link>
                    <div className="text-sm font-extrabold text-stone-900">
                      ₹{sp.indicative_price?.toLocaleString("en-IN")}{" "}
                      <span className="text-[10px] text-stone-500 font-normal">/ {sp.unit}</span>
                    </div>
                    <div className="text-[10px] text-stone-500">MOQ: {sp.moq}</div>
                  </div>
                </div>

                <div className="p-3 border-t border-stone-100 bg-stone-50/50">
                  <Link
                    to={`/products/${sp.id}`}
                    className="block w-full py-1.5 text-center text-xs font-semibold text-blue-900 hover:underline"
                  >
                    View Product →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Enquiry Modal */}
      <GuestEnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        product={{
          id: product.id,
          title: product.title,
          indicative_price: Number(product.indicative_price),
          unit: product.unit,
          moq: product.moq,
          business_name: product.businesses?.name,
          category: product.category_id,
        }}
        supplier={
          product.businesses
            ? { id: product.business_id || product.businesses?.id, name: product.businesses?.name }
            : null
        }
      />
    </div>
  );
};
