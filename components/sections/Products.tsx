"use client";

import { productCategories } from "@/data/productCategories";
import { sampleProducts } from "@/data/products";
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
    "raw-materials": Layers,
    packaging: Package,
    "fmcg-groceries": ShoppingBasket,
    "food-beverages": Utensils,
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

  // Filter products by search query and selected category
  const filteredProducts = sampleProducts.filter((product) => {
    const productLowerName = product.name.toLowerCase();
    const categoryLowerName = productCategories.find(c => c.id === product.categoryId)?.name.toLowerCase() || "";
    
    const matchesSearch = productLowerName.includes(searchQuery.toLowerCase()) ||
      categoryLowerName.includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="products" className={cn("py-28 min-h-[90vh] bg-surface", className)}>
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-ink mb-3">
            Browse Products
          </h2>
          <p className="text-lg text-ink-secondary">
            Find providers by category, starting nearby.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-secondary h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search raw materials, packaging, textiles"
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-full border border-surface-muted/50 bg-surface text-ink placeholder:text-ink-secondary/90 focus:outline-none focus:ring-2 focus:ring-coral/20 transition-all",
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
                    : "text-ink-secondary hover:text-ink"
                )}
              >
                {loc}
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-ink-secondary mt-3">
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
                  <p className="text-sm text-ink-secondary">
                    {category.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Featured Listings */}
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
              Sample preview
            </span>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-ink">
              Featured listings
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink-secondary">No matching products yet.</p>
            </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}>
              {filteredProducts.map((product) => {
                const category = productCategories.find(c => c.id === product.categoryId);
                return (
                  <div
                    key={product.id}
                    className="flex flex-col rounded-2xl bg-surface border border-surface-muted/50 p-6 hover:-translate-y-1 transition-all duration-300"
                  >
                    <h3 className="text-base font-heading font-semibold text-ink mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-ink-secondary mb-3">
                      {category?.name || "Unknown Category"}
                    </p>
                    <p className="text-sm text-ink-secondary mb-4">
                      {product.priceRange}
                    </p>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                      product.supplierType === "Manufacturer" 
                        ? "bg-navy/10 text-navy" 
                        : "bg-coral/10 text-coral"
                    )}>
                      {product.supplierType}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
