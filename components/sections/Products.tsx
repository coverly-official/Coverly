"use client";

import { productCategories } from "@/data/productCategories";
import { Search, Layers, Package, ShoppingBasket, Utensils, Shirt, Cpu, Building2, Leaf, Settings } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductsProps {
  className?: string;
}

export default function Products({ className }: ProductsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Nearby");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const iconMap: Record<string, React.ElementType> = {
    raw-materials: Layers,
    packaging: Package,
    fmcg-groceries: ShoppingBasket,
    food-beverages: Utensils,
    textiles: Shirt,
    electronics: Cpu,
    construction: Building2,
    agriculture: Leaf,
    machinery: Settings,
  };

  const filteredCategories = productCategories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <section id="products" className={cn("py-28 min-h-[90vh] bg-surface", className)}>
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-ink mb-3">
            Browse Products
          </h2>
          <p className="text-lg text-surface-muted">
            Find providers by category, starting nearby.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-muted h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search raw materials, packaging, textiles"
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-full border border-surface-muted/50 bg-surface text-ink placeholder:text-surface-muted/70 focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all",
                selectedCategory && "ring-2 ring-coral"
              )}
            />
          </div>
        </div>

        {/* Segmented Control */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className={cn(
            "inline-flex rounded-full border border-surface-muted/50 bg-surface p-1",
            selectedCategory && "ring-2 ring-coral"
          )}>
            {["Nearby", "Across State", "All World"].map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  location === loc
                    ? "bg-navy text-white shadow-soft"
                    : "text-surface-muted hover:text-ink"
                )}
              >
                {loc}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-surface-muted mt-3">
            Nearby providers first, then across your state, then All World.
          </p>
        </div>

        {/* Category Grid */}
        <div className={cn(
          "grid gap-4",
          selectedCategory && "ring-2 ring-coral"
        )}>
          {filteredCategories.map((category) => {
            const Icon = iconMap[category.id] || Layers;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={cn(
                  "flex items-start gap-4 p-6 rounded-2xl bg-surface border border-surface-muted/50 hover:-translate-y-1 transition-all duration-300",
                  selectedCategory === category.id && "ring-2 ring-coral"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl bg-surface-muted/50 text-navy",
                  selectedCategory === category.id && "bg-coral/10"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-semibold text-ink mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-surface-muted">
                    {category.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-surface-muted">No categories found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </section>
  );
}
