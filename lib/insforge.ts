import { createClient, type InsForgeClient } from "@insforge/sdk";

// Only the project URL and the anon key belong in the browser. Never put the
// admin API key or the database password in code or in NEXT_PUBLIC variables.
const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

export const authConfigured = Boolean(baseUrl && anonKey);

let client: InsForgeClient | null = null;

export function getInsforge(): InsForgeClient | null {
  if (!baseUrl || !anonKey) return null;
  if (!client) client = createClient({ baseUrl, anonKey });
  return client;
}