export const PLACEHOLDERS = {
  heroStats: [
    {
      value: "Same-day",
      label: "supplier matching",
    },
    {
      value: "Verified",
      label: "manufacturer network",
    },
    {
      value: "Transparent",
      label: "procurement pricing",
    },
  ],

  trustStats: [
    {
      value: "Buyer-led",
      label: "RFQ sourcing",
    },
    {
      value: "Supplier",
      label: "verification workflow",
    },
    {
      value: "Landed-cost",
      label: "comparison",
    },
    {
      value: "Order",
      label: "visibility across dispatch",
    },
  ],

  responseTime: "within 48 hours",

  metricPills: [
    { label: "Quote review", value: "Fast" },
    { label: "Response time", value: "48h" },
  ],
} as const;
