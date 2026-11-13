import { createAdminClient, createClient, type InsForgeClient } from "@insforge/sdk";

export interface InsForgeConfigStatus {
  configured: boolean;
  hasBaseUrl: boolean;
  hasAnonKey: boolean;
  hasApiKey: boolean;
}

function resolveCredentials() {
  const baseUrl = (
    process.env.INSFORGE_BASE_URL ||
    process.env.INSFORGE_URL ||
    ""
  ).trim();
  const anonKey = (process.env.INSFORGE_ANON_KEY || "").trim();
  const apiKey = (process.env.INSFORGE_API_KEY || "").trim();

  return { baseUrl, anonKey, apiKey };
}

export function getInsForgeConfigStatus(): InsForgeConfigStatus {
  const { baseUrl, anonKey, apiKey } = resolveCredentials();

  return {
    configured: Boolean(baseUrl && (anonKey || apiKey)),
    hasBaseUrl: Boolean(baseUrl),
    hasAnonKey: Boolean(anonKey),
    hasApiKey: Boolean(apiKey),
  };
}

let cachedClient: InsForgeClient | null = null;

export function getInsForgeClient(): InsForgeClient | null {
  const { baseUrl, anonKey, apiKey } = resolveCredentials();

  if (!baseUrl || (!anonKey && !apiKey)) {
    return null;
  }

  if (!cachedClient) {
    if (apiKey) {
      cachedClient = createAdminClient({ baseUrl, apiKey });
    } else {
      cachedClient = createClient({ baseUrl, anonKey });
    }
  }

  return cachedClient;
}
