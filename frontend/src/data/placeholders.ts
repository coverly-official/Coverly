/**
 * PLACEHOLDER VALUES
 * Every number in this file is a placeholder.
 * Replace with real, verified data before production launch.
 */

export const PLACEHOLDERS = {
  /** Hero stat cards */
  heroStats: [
    {
      value: "48h",
      label: "Concierge response",
      /* PLACEHOLDER - based on pilot target, not measured */
    },
    {
      value: "120+",
      label: "Verified suppliers",
      /* PLACEHOLDER - target count, not current */
    },
    {
      value: "True landed cost",
      label: "On every listing",
      /* PLACEHOLDER - aspirational, not live */
    },
  ],

  /** Trust section stats */
  trustStats: [
    {
      value: "78%",
      label: "of MSMEs source via WhatsApp or phone",
      /* PLACEHOLDER - industry estimate, not verified */
    },
    {
      value: "8-12",
      label: "quotes collected before a single order",
      /* PLACEHOLDER - anecdotal, needs validation */
    },
    {
      value: "6-8 hrs",
      label: "per week spent comparing prices manually",
      /* PLACEHOLDER - anecdotal, needs validation */
    },
    {
      value: "15-40%",
      label: "gap between quoted and true landed cost",
      /* PLACEHOLDER - industry estimate, not verified */
    },
  ],

  /** Concierge response promise */
  responseTime: "48 hours" /* PLACEHOLDER */,

  /** Metric card values for hero right column */
  metricPills: [
    { label: "Avg. savings", value: "12%" /* PLACEHOLDER */ },
    { label: "Response time", value: "< 48h" /* PLACEHOLDER */ },
  ],
} as const;
