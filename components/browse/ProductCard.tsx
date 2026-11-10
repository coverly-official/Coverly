"use client";

import Link from "next/link";
import { SampleProduct } from "@/data/products";
import { Button } from "@/components/ui/Button";
import { formatRupees } from "@/lib/utils";
import { MapPin, Clock, Package, Eye, Send } from "lucide-react";

interface ProductCardProps {
  product: SampleProduct;
  onRequestQuote: (product: SampleProduct) => void;
}

export function ProductCard({ product, onRequestQuote }: ProductCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-surface border border-[rgba(45,50,80,0.08)] p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
      <div>
        {/* Card Header: Category & Sample Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-ink-secondary">
            {product.categoryId.replace("-", " ")}
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-muted border border-[rgba(45,50,80,0.08)] px-2.5 py-0.5 text-[11px] font-medium text-ink-secondary">
            Sample listing
          </span>
        </div>

        {/* Image Placeholder */}
        <div className="w-full h-36 rounded-xl bg-surface-muted/80 border border-[rgba(45,50,80,0.04)] flex flex-col items-center justify-center text-ink-secondary/70 mb-4 group-hover:bg-surface-muted transition-colors">
          <Package size={28} className="text-coral/60 mb-1" />
          <span className="text-[11px] font-medium text-ink-secondary">
            Sample Product Image
          </span>
        </div>

        {/* Product Title */}
        <h3 className="font-heading font-bold text-base text-ink mb-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Price & MOQ */}
        <div className="mb-3">
          <div className="font-mono text-base font-bold text-coral">
            {product.priceRange}
          </div>
          <div className="text-xs text-ink-secondary mt-0.5">
            Min. Order: <strong className="text-ink">{product.moq} {product.unit}s</strong>
          </div>
        </div>

        {/* Supplier & Location */}
        <div className="pt-3 border-t border-[rgba(45,50,80,0.12)] space-y-1.5 text-xs text-ink-secondary mb-4">
          <div className="font-medium text-ink line-clamp-1">
            {product.supplierName}
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <MapPin size={12} className="text-coral flex-shrink-0" />
            <span className="truncate">{product.city}, {product.state}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <Clock size={12} className="text-ink-secondary flex-shrink-0" />
            <span>{product.leadTimeDays} days lead time</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center gap-2">
        <Link href={`/products/${product.id}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <Eye size={13} />
            View details
          </Button>
        </Link>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onRequestQuote(product)}
          className="flex-1 text-xs"
        >
          <Send size={13} />
          Request quote
        </Button>
      </div>
    </div>
  );
}
