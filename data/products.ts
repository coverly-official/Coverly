// SAMPLE DATA for preview only.
// Replace with real listings before launch.

export interface SampleProduct {
  id: string;
  name: string;
  categoryId: string;
  priceRange: string;
  supplierType: "Manufacturer" | "Wholesaler";
}

export const sampleProducts: SampleProduct[] = [
  { id: "prod-001", name: "Industrial Steel Sheets", categoryId: "raw-materials", priceRange: "Rs 45 to 52 per kg", supplierType: "Manufacturer" },
  { id: "prod-002", name: "Cardboard Boxes 50x40x30cm", categoryId: "packaging", priceRange: "Rs 85 to 110 per pc", supplierType: "Wholesaler" },
  { id: "prod-003", name: "Rice Basmati Premium 5kg", categoryId: "fmcg-groceries", priceRange: "Rs 650 to 780 per piece", supplierType: "Wholesaler" },
  { id: "prod-004", name: "Tea Leaves Assam Loose Leaf", categoryId: "food-beverages", priceRange: "Rs 280 to 350 per kg", supplierType: "Manufacturer" },
  { id: "prod-005", name: "Cotton Fabric Plain White", categoryId: "textiles", priceRange: "Rs 190 to 215 per pc", supplierType: "Manufacturer" },
  { id: "prod-006", name: "LED Bulb 10W Industrial", categoryId: "electronics", priceRange: "Rs 45 to 58 per piece", supplierType: "Wholesaler" },
  { id: "prod-007", name: "Cement Bag 50kg Standard", categoryId: "construction", priceRange: "Rs 320 to 360 per bag", supplierType: "Manufacturer" },
  { id: "prod-008", name: "Wheat Flour Atta 10kg", categoryId: "agriculture", priceRange: "Rs 420 to 480 per piece", supplierType: "Wholesaler" },
];
