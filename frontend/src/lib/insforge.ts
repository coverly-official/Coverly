import { createClient } from "@insforge/sdk";

const API_BASE =
  import.meta.env.VITE_INSFORGE_API_BASE ||
  import.meta.env.VITE_INSFORGE_PROJECT_URL ||
  "";

const ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || "";

export const insforge = createClient({
  baseUrl: API_BASE || "https://4vwfw2w8.ap-southeast.insforge.app",
  anonKey: ANON_KEY,
});
