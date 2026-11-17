import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

type OgCardTheme =
  | "home"
  | "product"
  | "manufacturer"
  | "wholesaler"
  | "category"
  | "service"
  | "logistics"
  | "trade";

interface ThemePalette {
  bgStart: string;
  bgEnd: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  pillText: string;
  footerLabel: string;
}

const PALETTES: Record<OgCardTheme, ThemePalette> = {
  home: {
    bgStart: "#0B1B3B",
    bgEnd: "#132E63",
    accent: "#F59E0B",
    accentBg: "rgba(245, 158, 11, 0.16)",
    accentBorder: "rgba(245, 158, 11, 0.45)",
    pillText: "#FCD34D",
    footerLabel: "GST Verified Suppliers  •  Factory-Direct Pricing  •  Landed-Cost RFQs",
  },
  product: {
    bgStart: "#111827",
    bgEnd: "#1F2937",
    accent: "#F59E0B",
    accentBg: "rgba(245, 158, 11, 0.16)",
    accentBorder: "rgba(245, 158, 11, 0.45)",
    pillText: "#FCD34D",
    footerLabel: "Wholesale Bulk Pricing  •  Transparent MOQ Tiers  •  GST & Freight Included",
  },
  manufacturer: {
    bgStart: "#17153B",
    bgEnd: "#2E236C",
    accent: "#FBBF24",
    accentBg: "rgba(251, 191, 36, 0.16)",
    accentBorder: "rgba(251, 191, 36, 0.45)",
    pillText: "#FDE68A",
    footerLabel: "Verified Factory Profile  •  Direct B2B Enquiries  •  Zero Brokerage",
  },
  wholesaler: {
    bgStart: "#064E3B",
    bgEnd: "#065F46",
    accent: "#FCD34D",
    accentBg: "rgba(252, 211, 77, 0.16)",
    accentBorder: "rgba(252, 211, 77, 0.45)",
    pillText: "#FEF08A",
    footerLabel: "Bulk Wholesale Supply  •  Regional Fulfillment  •  Verified B2B Trade",
  },
  category: {
    bgStart: "#0C4A6E",
    bgEnd: "#075985",
    accent: "#38BDF8",
    accentBg: "rgba(56, 189, 248, 0.18)",
    accentBorder: "rgba(56, 189, 248, 0.45)",
    pillText: "#BAE6FD",
    footerLabel: "Compare Multiple Suppliers  •  Instant RFQ Quotes  •  Pan-India Delivery",
  },
  service: {
    bgStart: "#2E1065",
    bgEnd: "#4C1D95",
    accent: "#FBBF24",
    accentBg: "rgba(251, 191, 36, 0.18)",
    accentBorder: "rgba(251, 191, 36, 0.45)",
    pillText: "#FDE68A",
    footerLabel: "Verified Business Agencies  •  Milestone Deliverables  •  B2B Proposals",
  },
  logistics: {
    bgStart: "#134E4A",
    bgEnd: "#115E59",
    accent: "#F59E0B",
    accentBg: "rgba(245, 158, 11, 0.18)",
    accentBorder: "rgba(245, 158, 11, 0.45)",
    pillText: "#FDE68A",
    footerLabel: "Pan-India Freight  •  Verified Commercial Fleets  •  Electronic POD Tracking",
  },
  trade: {
    bgStart: "#0F172A",
    bgEnd: "#1E3A8A",
    accent: "#FBBF24",
    accentBg: "rgba(251, 191, 36, 0.18)",
    accentBorder: "rgba(251, 191, 36, 0.45)",
    pillText: "#FDE68A",
    footerLabel: "Raw Materials  •  Custom Packaging  •  Global Import & Export Trade",
  },
};

function sanitizeText(val: string | null, fallback: string, maxLen: number): string {
  const clean = String(val || fallback)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return fallback;
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1).trimEnd()}…` : clean;
}

function el(type: string, props: Record<string, any>, ...children: any[]) {
  const flatChildren =
    children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return {
    type,
    props: {
      ...props,
      ...(flatChildren !== undefined ? { children: flatChildren } : {}),
    },
  };
}

export default function handler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawType = (searchParams.get("type") || "home").toLowerCase();
    const themeKey: OgCardTheme = (rawType in PALETTES ? rawType : "home") as OgCardTheme;
    const palette = PALETTES[themeKey];

    const title = sanitizeText(
      searchParams.get("title"),
      "India's Connected B2B Sourcing & Wholesale Procurement Marketplace",
      92
    );
    const subtitle = sanitizeText(
      searchParams.get("subtitle"),
      "Discover verified Indian manufacturers, wholesalers, raw materials, logistics & business services.",
      130
    );
    const meta = sanitizeText(
      searchParams.get("meta"),
      "Compare True Landed Cost with Unit Price, MOQ, GST & Freight",
      105
    );
    const badge = sanitizeText(
      searchParams.get("badge"),
      themeKey === "home" ? "VERIFIED B2B ECOSYSTEM" : themeKey.replace(/_/g, " ").toUpperCase(),
      36
    );

    const titleFontSize = title.length > 64 ? 42 : title.length > 42 ? 48 : 54;

    const tree = el(
      "div",
      {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage: `linear-gradient(135deg, ${palette.bgStart} 0%, ${palette.bgEnd} 100%)`,
          padding: "56px 64px",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        },
      },
      el(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          },
        },
        el(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "18px" } },
          el(
            "div",
            {
              style: {
                width: "62px",
                height: "62px",
                borderRadius: "16px",
                backgroundColor: palette.accent,
                color: "#0B1220",
                fontSize: "34px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            "C"
          ),
          el(
            "div",
            { style: { display: "flex", flexDirection: "column" } },
            el(
              "div",
              {
                style: {
                  fontSize: "30px",
                  fontWeight: 800,
                  letterSpacing: "2px",
                  color: "#FFFFFF",
                  lineHeight: 1.1,
                },
              },
              "COVERLY"
            ),
            el(
              "div",
              {
                style: {
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  color: palette.pillText,
                  marginTop: "4px",
                },
              },
              "B2B SOURCING & PROCUREMENT"
            )
          )
        ),
        el(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              borderRadius: "999px",
              backgroundColor: palette.accentBg,
              border: `2px solid ${palette.accentBorder}`,
              color: palette.pillText,
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "1.5px",
            },
          },
          badge
        )
      ),
      el(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "12px",
            marginBottom: "12px",
          },
        },
        el(
          "div",
          {
            style: {
              fontSize: `${titleFontSize}px`,
              fontWeight: 700,
              lineHeight: 1.18,
              color: "#FFFFFF",
            },
          },
          title
        ),
        el(
          "div",
          {
            style: {
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.4,
              color: "#CBD5E1",
            },
          },
          subtitle
        ),
        el(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "8px",
              padding: "16px 24px",
              borderRadius: "14px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
            },
          },
          el("div", {
            style: {
              width: "12px",
              height: "12px",
              borderRadius: "999px",
              backgroundColor: "#10B981",
            },
          }),
          el(
            "div",
            {
              style: {
                fontSize: "21px",
                fontWeight: 700,
                color: "#F8FAFC",
              },
            },
            meta
          )
        )
      ),
      el(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.16)",
            paddingTop: "22px",
            width: "100%",
          },
        },
        el(
          "div",
          {
            style: {
              fontSize: "17px",
              fontWeight: 400,
              color: "#94A3B8",
            },
          },
          palette.footerLabel
        ),
        el(
          "div",
          {
            style: {
              fontSize: "18px",
              fontWeight: 700,
              color: palette.pillText,
            },
          },
          "coverly-indol.vercel.app"
        )
      )
    );

    return new ImageResponse(tree as any, {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return Response.redirect("https://coverly-indol.vercel.app/og/coverly-home.png", 302);
  }
}
