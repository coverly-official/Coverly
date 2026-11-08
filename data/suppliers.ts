export type Supplier = {
  name: string;
  city: string;
  verified: boolean;
  unitPrice: number;
  moq: number;
  freight: number;
  gstRate: number;
};

export type ProductCategory = {
  id: string;
  label: string;
  unit: string;
  defaultQty: number;
  suppliers: Supplier[];
};

/**
 * Mock supplier data for the interactive demo.
 * Cotton T-Shirts data matches the brief spec exactly.
 * Other categories are PLACEHOLDER data.
 */
export const supplierData: ProductCategory[] = [
  {
    id: "cotton-tshirts",
    label: "Cotton T-Shirts (Round Neck)",
    unit: "pc",
    defaultQty: 500,
    suppliers: [
      {
        name: "Tiruppur Knits",
        city: "Tiruppur",
        verified: true,
        unitPrice: 212,
        moq: 300,
        freight: 3200,
        gstRate: 0.05,
      },
      {
        name: "Surat Textile Hub",
        city: "Surat",
        verified: true,
        unitPrice: 196,
        moq: 500,
        freight: 9800,
        gstRate: 0.05,
      },
      {
        name: "Ludhiana Garments Co",
        city: "Ludhiana",
        verified: true,
        unitPrice: 205,
        moq: 250,
        freight: 2400,
        gstRate: 0.05,
      },
    ],
  },
  {
    id: "corrugated-boxes",
    label: "Corrugated Boxes (5-ply, 12x10x8)",
    unit: "pc",
    defaultQty: 1000,
    /* PLACEHOLDER - all suppliers below are fictional demo data */
    suppliers: [
      {
        name: "Rajkot Packaging",
        city: "Rajkot",
        verified: true,
        unitPrice: 38,
        moq: 1000,
        freight: 4500,
        gstRate: 0.18,
      },
      {
        name: "Nagpur Box Works",
        city: "Nagpur",
        verified: false,
        unitPrice: 42,
        moq: 500,
        freight: 1800,
        gstRate: 0.18,
      },
      {
        name: "Indore Corr-Pack",
        city: "Indore",
        verified: true,
        unitPrice: 40,
        moq: 300,
        freight: 2200,
        gstRate: 0.18,
      },
    ],
  },
  {
    id: "mild-steel-rods",
    label: "Mild Steel Rods (12mm TMT)",
    unit: "kg",
    defaultQty: 2000,
    /* PLACEHOLDER - all suppliers below are fictional demo data */
    suppliers: [
      {
        name: "Raipur Steel Traders",
        city: "Raipur",
        verified: true,
        unitPrice: 58,
        moq: 2000,
        freight: 6200,
        gstRate: 0.18,
      },
      {
        name: "Bhilai Iron and Steel",
        city: "Bhilai",
        verified: true,
        unitPrice: 55,
        moq: 5000,
        freight: 3800,
        gstRate: 0.18,
      },
      {
        name: "Jamshedpur Metals",
        city: "Jamshedpur",
        verified: true,
        unitPrice: 52,
        moq: 1000,
        freight: 8900,
        gstRate: 0.18,
      },
    ],
  },
];
