import { getInsforge } from "@/lib/insforge";

export type AccountRole = "buyer" | "wholesaler" | "manufacturer";

export interface RoleOption {
  id: AccountRole;
  label: string;
  title: string;
  blurb: string;
  perks: string[];
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "buyer",
    label: "Buyer",
    title: "Source from one place",
    blurb: "For shop owners, retailers, SMEs and new entrepreneurs.",
    perks: [
      "Find providers near you first, then across your state",
      "Compare quotations against what you need",
      "See orders from several providers in one view",
      "Follow delivery progress in one place",
    ],
  },
  {
    id: "wholesaler",
    label: "Wholesaler",
    title: "Reach business buyers",
    blurb: "For wholesalers, suppliers and distributors.",
    perks: [
      "List the products you supply",
      "Receive and answer quotation requests",
      "Manage incoming orders",
      "Monitor your sales",
    ],
  },
  {
    id: "manufacturer",
    label: "Manufacturer",
    title: "Sell direct to businesses",
    blurb: "For manufacturers of raw materials and finished goods.",
    perks: [
      "Show your products to business buyers",
      "Receive quotation requests directly",
      "Manage incoming orders",
      "Monitor your sales",
    ],
  },
];

export function isRole(value: string | undefined): value is AccountRole {
  return ROLE_OPTIONS.some((option) => option.id === value);
}

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  role: AccountRole | null;
  business: string;
}

export type AuthReason =
  | "not-configured"
  | "failed"
  | "verify-email"
  | "role-mismatch";

export interface AuthResult {
  ok: boolean;
  reason?: AuthReason;
  message?: string;
  actualRole?: AccountRole;
}

export interface SignInInput {
  role: AccountRole;
  email: string;
  password: string;
}

export interface SignUpInput {
  role: AccountRole;
  name: string;
  business: string;
  email: string;
  phone: string;
  password: string;
}

interface PendingProfile {
  email: string;
  role: AccountRole;
  name: string;
  business: string;
  phone: string;
}

const PENDING_KEY = "coverly.pendingProfile";

function readPending(email: string): PendingProfile | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingProfile;
    return parsed.email.toLowerCase() === email.toLowerCase() ? parsed : null;
  } catch {
    return null;
  }
}

function savePending(pending: PendingProfile): void {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // storage can be blocked; the role is then chosen again at first login
  }
}

function clearPending(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Builds the user shown in the site. Custom profile fields such as role are
// read with getProfile, because the session user may only carry the basics.
export async function loadAccountUser(
  rawUser: unknown
): Promise<AccountUser | null> {
  const client = getInsforge();
  const base = asRecord(rawUser);
  const id = asString(base.id);
  if (!client || !id) return null;

  let profile = asRecord(base.profile);
  try {
    const res = await client.auth.getProfile(id);
    if (res.data) profile = { ...profile, ...asRecord(res.data) };
  } catch {
    // keep the basic profile
  }

  const email = asString(base.email);
  const role = asString(profile.role);
  return {
    id,
    email,
    name: asString(profile.name) || email.split("@")[0],
    role: isRole(role) ? role : null,
    business: asString(profile.business),
  };
}

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const client = getInsforge();
  if (!client) return { ok: false, reason: "not-configured" };

  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    name: input.name,
  });
  if (error || !data) {
    return {
      ok: false,
      reason: "failed",
      message: error?.message ?? "Could not create the account.",
    };
  }

  const pending: PendingProfile = {
    email: input.email,
    role: input.role,
    name: input.name,
    business: input.business,
    phone: input.phone,
  };

  // With email verification switched on there is no session yet, so the role
  // is saved after the first login instead.
  if (data.requireEmailVerification || !data.accessToken) {
    savePending(pending);
    return { ok: false, reason: "verify-email" };
  }

  const saved = await client.auth.setProfile({
    name: input.name,
    role: input.role,
    business: input.business,
    phone: input.phone,
  });
  if (saved.error) savePending(pending);
  return { ok: true };
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const client = getInsforge();
  if (!client) return { ok: false, reason: "not-configured" };

  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error || !data) {
    return {
      ok: false,
      reason: "failed",
      message: error?.message ?? "Could not log in.",
    };
  }

  let user = await loadAccountUser(data.user);
  if (user && !user.role) {
    const pending = readPending(input.email);
    const result = await client.auth.setProfile({
      role: pending?.role ?? input.role,
      ...(pending
        ? {
            name: pending.name,
            business: pending.business,
            phone: pending.phone,
          }
        : {}),
    });
    if (!result.error) clearPending();
    user = await loadAccountUser(data.user);
  }

  if (user?.role && user.role !== input.role) {
    await client.auth.signOut();
    return { ok: false, reason: "role-mismatch", actualRole: user.role };
  }
  return { ok: true };
}

export async function signOutUser(): Promise<void> {
  const client = getInsforge();
  if (client) await client.auth.signOut();
}