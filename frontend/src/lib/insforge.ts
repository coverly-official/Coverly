import { createClient } from "@insforge/sdk";

const API_BASE =
  import.meta.env.VITE_INSFORGE_API_BASE ||
  "https://4vwfw2w8.ap-southeast.insforge.app";

const ANON_KEY =
  import.meta.env.VITE_INSFORGE_ANON_KEY ||
  "anon_9da4660d2d03cec83d7ea57032348bab48a951f8ddf8b2b9dccdfb4b77eefe58";

export const insforge = createClient({
  baseUrl: API_BASE,
  anonKey: ANON_KEY,
});
