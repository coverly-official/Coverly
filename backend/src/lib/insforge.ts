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
    process.env.INSFORGE_PROJECT_URL ||
    process.env.INSFORGE_URL ||
    ""
  ).trim();
  const anonKey = (
    process.env.INSFORGE_ANON_KEY ||
    process.env.VITE_INSFORGE_ANON_KEY ||
    ""
  ).trim();
  const apiKey = (
    process.env.INSFORGE_API_KEY ||
    process.env.INSFORGE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

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

export function getInsForgeClient(): InsForgeClient | null {
  const { baseUrl, anonKey, apiKey } = resolveCredentials();

  if (!baseUrl || (!anonKey && !apiKey)) {
    return null;
  }

  // Always return an unpolluted admin client for backend operations
  if (apiKey) {
    return createAdminClient({ baseUrl, apiKey });
  } else {
    return createClient({ baseUrl, anonKey });
  }
}

/**
 * Public unauthenticated client strictly constrained by InsForge RLS policies.
 * Used for public Open Graph / social preview metadata generation so private
 * records, internal documents, or unapproved listings can never be leaked.
 */
export function getPublicInsForgeClient(): InsForgeClient | null {
  const { baseUrl, anonKey } = resolveCredentials();

  if (!baseUrl || !anonKey) {
    return null;
  }

  return createClient({ baseUrl, anonKey });
}
