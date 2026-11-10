"use client";

import { useState } from "react";
import Link from "next/link";
import { SampleProduct } from "@/data/products";
import { Button } from "@/components/ui/Button";
import { RequestQuoteModal } from "@/components/browse/RequestQuoteModal";
import { WHATSAPP_NUMBER, CONTACT_EMAIL } from "@/data/contact";
import { formatRupees } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Package,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface ProductDetailClientProps {
  product: SampleProduct;
  categoryName: string;
  relatedProducts: SampleProduct[];
}

export function ProductDetailClient({
  product,
  categoryName,
  relatedProducts,
}: ProductDetailClientProps) {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const directWhatsAppUrl = (() => {
    const message = [
      "Hello Coverly team,",
      "",
      `Inquiring about: ${product.name} (ID: ${product.id})`,
      `Supplier: ${product.supplierName}`,
      `Listed Price: ${product.priceRange}`,
      `Minimum Order Quantity: ${product.moq} ${product.unit}s`,
    ].join("\n");

    if (WHATSAPP_NUMBER) {
      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }
    if (CONTACT_EMAIL) {
      return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        `Coverly Product Inquiry: ${product.name}`
      )}&body=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  })();

  return (
    <div className="min-h-screen bg-canvas py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-secondary mb-6 font-medium" aria-label="Breadcrumb">
        <Link href="/browse" className="hover:text-ink transition-colors flex items-center gap-1">
          <ArrowLeft size={13} />
          Back to Browse
        </Link>
        <ChevronRight size={12} className="text-ink-secondary/50" />
        <Link href={`/browse?category=${product.categoryId}`} className="hover:text-ink transition-colors">
          {categoryName}
        </Link>
        <ChevronRight size={12} className="text-ink-secondary/50" />
        <span className="text-ink truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left: Gallery Placeholder */}
        <div className="lg:col-span-6 space-y-4">
          <div className="w-full h-80 sm:h-96 rounded-2xl bg-surface border border-[rgba(45,50,80,0.08)] flex flex-col items-center justify-center text-ink-secondary shadow-soft p-6">
            <Package size={56} className="text-coral/50 mb-3" />
            <span className="text-sm font-semibold text-ink">Sample Product Gallery</span>
            <span className="text-xs text-ink-secondary mt-1">
              Sample photo placeholder · {product.name}
            </span>
          </div>

          {/* Gallery Thumbnails Placeholder */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-20 rounded-xl bg-surface border border-[rgba(45,50,80,0.12)] flex items-center justify-center text-[11px] text-ink-secondary"
              >
                Angle {idx}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Details & CTAs */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-coral/10 text-coral text-xs font-semibold px-2.5 py-0.5">
                Sample listing
              </span>
              <span className="text-xs text-ink-secondary font-medium">
                {product.supplierType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink mb-3 leading-tight">
              {product.name}
            </h1>

            <p className="text-sm text-ink-secondary leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price & MOQ Block */}
          <div className="p-5 rounded-2xl bg-surface border border-[rgba(45,50,80,0.08)] shadow-soft space-y-3">
            <div>
              <div className="text-xs font-heading font-semibold uppercase tracking-wider text-ink-secondary">
                Price Range
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-coral mt-0.5">
                {product.priceRange}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-2 border-t border-[rgba(45,50,80,0.12)]">
              <div>
                Minimum Order Quantity: <strong className="text-ink font-mono">{product.moq} {product.unit}s</strong>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={13} className="text-coral" />
                <span>{product.leadTimeDays} days lead time</span>
              </div>
            </div>
          </div>

          {/* Price Tiers if available */}
          {product.tierPricing && product.tierPricing.length > 0 && (
            <div className="p-5 rounded-2xl bg-surface border border-[rgba(45,50,80,0.08)] shadow-soft">
              <div className="text-xs font-heading font-semibold uppercase tracking-wider text-ink-secondary mb-3">
                Volume Pricing Tiers
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(45,50,80,0.08)] text-[11px] text-ink-secondary font-semibold">
                      <th className="pb-2">Order Quantity</th>
                      <th className="pb-2 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(45,50,80,0.04)] font-mono">
                    {product.tierPricing.map((tier, idx) => (
                      <tr key={idx} className="py-2">
                        <td className="py-2 text-ink">
                          {tier.minQty.toLocaleString("en-IN")}+ {product.unit}s
                        </td>
                        <td className="py-2 text-right font-bold text-coral">
                          {formatRupees(tier.price)} / {product.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Supplier Summary Card */}
          <div className="p-5 rounded-2xl bg-surface border border-[rgba(45,50,80,0.08)] shadow-soft space-y-2">
            <div className="text-xs font-heading font-semibold uppercase tracking-wider text-ink-secondary">
              Supplier Information (Sample)
            </div>
            <div className="font-heading font-bold text-base text-ink">
              {product.supplierName}
            </div>
            <div className="flex items-center gap-1 text-xs text-ink-secondary">
              <MapPin size={13} className="text-coral flex-shrink-0" />
              <span>{product.city}, {product.state}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => setIsQuoteOpen(true)}
              className="flex-1"
            >
              <Send size={16} />
              Request Quote
            </Button>
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="whatsapp" size="lg" className="w-full">
                <MessageCircle size={16} />
                Contact on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {product.specs && Object.keys(product.specs).length > 0 && (
        <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-surface border border-[rgba(45,50,80,0.08)] shadow-soft">
          <h2 className="text-xl font-heading font-bold text-ink mb-4">
            Technical Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(product.specs).map(([key, val]) => (
              <div
                key={key}
                className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-surface-muted text-xs border border-[rgba(45,50,80,0.04)]"
              >
                <span className="font-medium text-ink-secondary">{key}</span>
                <span className="font-mono font-semibold text-ink">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products from same category */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-[rgba(45,50,80,0.12)]">
          <h2 className="text-xl font-heading font-bold text-ink mb-6">
            Related Products in {categoryName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((rel) => (
              <div
                key={rel.id}
                className="p-5 rounded-2xl bg-surface border border-[rgba(45,50,80,0.12)] shadow-soft hover:shadow-card transition-all"
              >
                <div className="text-[11px] text-ink-secondary mb-1">
                  {rel.supplierName}
                </div>
                <h3 className="font-heading font-semibold text-sm text-ink mb-2">
                  {rel.name}
                </h3>
                <div className="font-mono text-sm text-coral font-bold mb-3">
                  {rel.priceRange}
                </div>
                <Link href={`/products/${rel.id}`}>
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Quote Modal */}
      <RequestQuoteModal
        product={product}
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />
    </div>
  );
}
