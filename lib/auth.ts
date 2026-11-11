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

export interface AuthResult {
  ok: boolean;
  reason?: "not-configured" | "failed";
}

export interface SignInInput {
  role: AccountRole;
  identifier: string;
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

// Accounts are not connected to a backend yet. When the InsForge auth calls
// are ready, replace the bodies of signIn and signUp. The screens in
// components/auth/AuthScreen.tsx already handle ok and failed results.
export async function signIn(input: SignInInput): Promise<AuthResult> {
  void input;
  return { ok: false, reason: "not-configured" };
}

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  void input;
  return { ok: false, reason: "not-configured" };
}