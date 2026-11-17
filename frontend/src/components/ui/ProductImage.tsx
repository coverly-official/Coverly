import React, { useState } from "react";
import {
  Package,
  Factory,
  Wheat,
  Zap,
  Building,
  FlaskConical,
  Shirt,
  Cpu,
  Armchair,
  HeartPulse,
  Layers,
  UtensilsCrossed,
} from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  categoryId?: string;
  category?: string;
  categoryName?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  categoryId,
  category,
  categoryName,
  className = "",
  aspectRatio = "square",
}) => {
  const [imageError, setImageError] = useState(false);
  const effectiveCategory = categoryId || category;

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "video"
        ? "aspect-video"
        : "aspect-4/3";

  // If a valid image URL exists and hasn't failed to load, display it
  if (src && !imageError) {
    return (
      <div className={`relative overflow-hidden bg-stone-100 ${aspectClass} ${className}`}>
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }

  // Category specific icon and color scheme for authentic placeholder
  const catKey = (effectiveCategory || categoryName || "").toLowerCase();

  let Icon = Package;
  let bgGradient = "from-stone-100 to-stone-200 text-stone-700";
  let badgeColor = "bg-stone-200/80 text-stone-800";
  let label = categoryName || "Wholesale Product";

  if (catKey.includes("agri") || catKey.includes("wheat") || catKey.includes("rice")) {
    Icon = Wheat;
    bgGradient = "from-amber-50 to-emerald-100 text-emerald-800";
    badgeColor = "bg-emerald-200/80 text-emerald-900";
    label = "Agriculture Commodity";
  } else if (catKey.includes("food") || catKey.includes("beverage") || catKey.includes("oil")) {
    Icon = UtensilsCrossed;
    bgGradient = "from-amber-50 to-orange-100 text-orange-800";
    badgeColor = "bg-orange-200/80 text-orange-950";
    label = "Food & Ingredients";
  } else if (catKey.includes("packag") || catKey.includes("box") || catKey.includes("sack")) {
    Icon = Package;
    bgGradient = "from-orange-50 to-amber-100 text-amber-800";
    badgeColor = "bg-amber-200/80 text-amber-900";
    label = "Packaging Materials";
  } else if (catKey.includes("machin") || catKey.includes("motor") || catKey.includes("equip")) {
    Icon = Factory;
    bgGradient = "from-slate-100 to-slate-200 text-slate-800";
    badgeColor = "bg-slate-300 text-slate-900";
    label = "Industrial Machinery";
  } else if (catKey.includes("electr") || catKey.includes("cable") || catKey.includes("wire")) {
    Icon = Zap;
    bgGradient = "from-blue-50 to-indigo-100 text-indigo-800";
    badgeColor = "bg-indigo-200 text-indigo-950";
    label = "Electrical Equipment";
  } else if (catKey.includes("construct") || catKey.includes("steel") || catKey.includes("cement") || catKey.includes("rebar") || catKey.includes("rod")) {
    Icon = Building;
    bgGradient = "from-zinc-100 to-zinc-200 text-zinc-800";
    badgeColor = "bg-zinc-300 text-zinc-900";
    label = "Construction Materials";
  } else if (catKey.includes("chem") || catKey.includes("caustic") || catKey.includes("labsa")) {
    Icon = FlaskConical;
    bgGradient = "from-teal-50 to-cyan-100 text-cyan-900";
    badgeColor = "bg-teal-200 text-teal-950";
    label = "Chemicals & Solvents";
  } else if (catKey.includes("textil") || catKey.includes("cotton") || catKey.includes("fabric") || catKey.includes("tshirt") || catKey.includes("yarn")) {
    Icon = Shirt;
    bgGradient = "from-violet-50 to-purple-100 text-purple-900";
    badgeColor = "bg-purple-200 text-purple-950";
    label = "Textiles & Yarns";
  } else if (catKey.includes("electron") || catKey.includes("pcb") || catKey.includes("smps")) {
    Icon = Cpu;
    bgGradient = "from-sky-50 to-blue-100 text-blue-900";
    badgeColor = "bg-blue-200 text-blue-950";
    label = "Electronics Components";
  } else if (catKey.includes("furnitur") || catKey.includes("chair") || catKey.includes("rack") || catKey.includes("desk")) {
    Icon = Armchair;
    bgGradient = "from-stone-100 to-amber-50 text-stone-800";
    badgeColor = "bg-stone-300 text-stone-900";
    label = "Commercial Furniture";
  } else if (catKey.includes("health") || catKey.includes("mask") || catKey.includes("glove") || catKey.includes("syring")) {
    Icon = HeartPulse;
    bgGradient = "from-rose-50 to-pink-100 text-rose-900";
    badgeColor = "bg-rose-200 text-rose-950";
    label = "Healthcare Supplies";
  } else if (catKey.includes("raw") || catKey.includes("granule") || catKey.includes("polymer") || catKey.includes("ingot")) {
    Icon = Layers;
    bgGradient = "from-slate-100 to-stone-200 text-stone-800";
    badgeColor = "bg-stone-300 text-stone-900";
    label = "Industrial Raw Material";
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} ${aspectClass} flex flex-col items-center justify-center p-4 border border-stone-200/60 select-none ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-xs mb-2 transform transition-transform group-hover:scale-110">
        <Icon className="w-7 h-7" />
      </div>

      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeColor} text-center shadow-xs truncate max-w-[85%]`}>
        {label}
      </span>

      <span className="text-[11px] font-semibold text-stone-800 text-center mt-2 line-clamp-1 px-2">
        {alt}
      </span>

      <div className="absolute bottom-1.5 right-2 text-[9px] font-bold text-stone-400 tracking-wider">
        COVERLY VERIFIED
      </div>
    </div>
  );
};
