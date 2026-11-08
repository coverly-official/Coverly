export interface ProductCategory {
  id: string;
  name: string;
  tagline: string;
}

export const productCategories: ProductCategory[] = [
  { id: "raw-materials", name: "Raw Materials", tagline: "Industrial grade raw materials for manufacturing" },
  { id: "packaging", name: "Packaging", tagline: "Sustainable and durable packaging solutions" },
  { id: "fmcg-groceries", name: "FMCG & Groceries", tagline: "Fast moving consumer goods at wholesale prices" },
  { id: "food-beverages", name: "Food & Beverages", tagline: "Premium food and beverage products for businesses" },
  { id: "textiles", name: "Textiles", tagline: "High quality fabrics and textile materials" },
  { id: "electronics", name: "Electronics", tagline: "Industrial electronics components and parts" },
  { id: "construction", name: "Construction", tagline: "Building materials and construction supplies" },
  { id: "agriculture", name: "Agriculture", tagline: "Farm fresh produce and agricultural inputs" },
  { id: "machinery", name: "Machinery", tagline: "Heavy machinery and industrial equipment" },
];
