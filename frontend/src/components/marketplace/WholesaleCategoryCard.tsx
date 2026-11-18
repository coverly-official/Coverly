import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";

export interface CategoryCardItem {
  id: string;
  label?: string;
  name?: string;
  default_qty?: number | string | null;
  unit?: string | null;
}

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "cotton-tshirts": "/categories/cotton-tshirts.jpg",
  "corrugated-boxes": "/categories/corrugated-boxes.jpg",
  "mild-steel-rods": "/categories/mild-steel-rods.jpg",
  "agriculture-products": "/categories/agriculture-products.jpg",
  "food-beverages": "/categories/food-beverages.jpg",
  "packaging-materials": "/categories/packaging-materials.jpg",
  "industrial-machinery": "/categories/industrial-machinery.jpg",
  "electrical-equipment": "/categories/electrical-equipment.jpg",
  "construction-materials": "/categories/construction-materials.jpg",
  chemicals: "/categories/chemicals.jpg",
  textiles: "/categories/textiles.jpg",
  electronics: "/categories/electronics.jpg",
  furniture: "/categories/furniture.jpg",
  "healthcare-supplies": "/categories/healthcare-supplies.jpg",
  "raw-materials": "/categories/raw-materials.svg",
};

export function getCategoryImageUrl(category: Pick<CategoryCardItem, "id" | "label" | "name">): string | null {
  const idKey = String(category.id || "").trim().toLowerCase();
  if (CATEGORY_IMAGE_MAP[idKey]) return CATEGORY_IMAGE_MAP[idKey];

  const text = `${category.label || ""} ${category.name || ""}`.toLowerCase();
  if (text.includes("t-shirt") || text.includes("apparel")) return CATEGORY_IMAGE_MAP["cotton-tshirts"];
  if (text.includes("corrugated") || text.includes("box")) return CATEGORY_IMAGE_MAP["corrugated-boxes"];
  if (text.includes("steel") || text.includes("rod")) return CATEGORY_IMAGE_MAP["mild-steel-rods"];
  if (text.includes("agri")) return CATEGORY_IMAGE_MAP["agriculture-products"];
  if (text.includes("food") || text.includes("beverage")) return CATEGORY_IMAGE_MAP["food-beverages"];
  if (text.includes("packag")) return CATEGORY_IMAGE_MAP["packaging-materials"];
  if (text.includes("machin")) return CATEGORY_IMAGE_MAP["industrial-machinery"];
  if (text.includes("electric")) return CATEGORY_IMAGE_MAP["electrical-equipment"];
  if (text.includes("construct")) return CATEGORY_IMAGE_MAP["construction-materials"];
  if (text.includes("chem")) return CATEGORY_IMAGE_MAP.chemicals;
  if (text.includes("textile") || text.includes("fabric")) return CATEGORY_IMAGE_MAP.textiles;
  if (text.includes("electron")) return CATEGORY_IMAGE_MAP.electronics;
  if (text.includes("furnitur")) return CATEGORY_IMAGE_MAP.furniture;
  if (text.includes("health") || text.includes("medic")) return CATEGORY_IMAGE_MAP["healthcare-supplies"];
  if (text.includes("raw")) return CATEGORY_IMAGE_MAP["raw-materials"];
  return null;
}

interface WholesaleCategoryCardProps {
  category: CategoryCardItem;
  alwaysShowExplore?: boolean;
}

export const WholesaleCategoryCard: React.FC<WholesaleCategoryCardProps> = ({
  category,
  alwaysShowExplore = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const title = category.label || category.name || "Wholesale Category";
  const imageUrl = getCategoryImageUrl(category);

  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.id)}`}
      className="group relative bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:border-[#2563EB] hover:ring-1 hover:ring-[#2563EB]/30 hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.22)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 transition-all duration-200 flex flex-col items-center text-center"
    >
      {/* Top Studio Product Visual Container */}
      <div className="w-full aspect-[16/10] rounded-xl bg-gradient-to-b from-[#EDF3FF] to-[#E2ECFF] overflow-hidden mb-3.5 flex items-center justify-center">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300 ease-out"
          />
        ) : (
          <Package className="w-9 h-9 text-blue-700/70 group-hover:scale-110 transition-transform duration-200" />
        )}
      </div>

      {/* Category Label & Standard MOQ */}
      <div className="w-full flex-1 flex flex-col items-center">
        <h3
          title={title}
          className="text-[13px] font-bold text-slate-900 group-hover:text-[#1D4ED8] transition-colors line-clamp-1 w-full px-0.5 leading-snug"
        >
          {title}
        </h3>
        <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
          Standard MOQ: {category.default_qty || 100} {category.unit || "units"}
        </div>
      </div>

      {/* Hover / Active Explore CTA */}
      <span
        className={`mt-2.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-[#2563EB] transition-all duration-200 ${
          alwaysShowExplore
            ? "opacity-100"
            : "opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100"
        }`}
      >
        Explore <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
      </span>
    </Link>
  );
};
