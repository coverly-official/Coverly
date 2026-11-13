import type { ProductCategory } from "@/data/suppliers";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export type ConciergeLeadPayload = {
  name: string;
  business: string;
  phone: string;
  category: string;
  requirement: string;
};

export type ConciergeLeadResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
};

export async function submitConciergeLead(
  payload: ConciergeLeadPayload
): Promise<ConciergeLeadResponse> {
  const response = await fetch(apiUrl("/api/concierge-leads"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as ConciergeLeadResponse;

  if (!response.ok) {
    throw new Error(body.error || "Unable to submit concierge request.");
  }

  return body;
}

export async function fetchSupplierCategories(): Promise<ProductCategory[] | null> {
  try {
    const response = await fetch(apiUrl("/api/suppliers"));
    if (!response.ok) return null;
    const body = (await response.json()) as {
      success?: boolean;
      categories?: ProductCategory[];
    };
    if (body.success && Array.isArray(body.categories) && body.categories.length > 0) {
      return body.categories;
    }
    return null;
  } catch {
    return null;
  }
}
