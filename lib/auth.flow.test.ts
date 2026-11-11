import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, string> = {};
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  },
};

const auth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  setProfile: vi.fn(),
  getProfile: vi.fn(),
  signOut: vi.fn(),
};
vi.mock("@/lib/insforge", () => ({ getInsforge: () => ({ auth }), authConfigured: true }));

import { signIn, signUp } from "@/lib/auth";

beforeEach(() => {
  Object.values(auth).forEach((f) => f.mockReset());
  Object.keys(store).forEach((k) => delete store[k]);
  auth.setProfile.mockResolvedValue({ data: {}, error: null });
  auth.signOut.mockResolvedValue({ error: null });
});

const su = { role: "wholesaler" as const, name: "Demo W", business: "Demo Traders", email: "w@example.com", phone: "9876543210", password: "Demo@12345" };

describe("signUp", () => {
  it("sets profile when a session is returned", async () => {
    auth.signUp.mockResolvedValue({ data: { accessToken: "t", user: { id: "u1" } }, error: null });
    const r = await signUp(su);
    expect(r.ok).toBe(true);
    expect(auth.setProfile).toHaveBeenCalledWith({ name: "Demo W", role: "wholesaler", business: "Demo Traders", phone: "9876543210" });
  });
  it("defers the profile when email verification is required", async () => {
    auth.signUp.mockResolvedValue({ data: { requireEmailVerification: true, accessToken: null }, error: null });
    const r = await signUp(su);
    expect(r).toEqual({ ok: false, reason: "verify-email" });
    expect(auth.setProfile).not.toHaveBeenCalled();
    expect(Object.keys(store)).toContain("coverly.pendingProfile");
  });
  it("returns the backend error message", async () => {
    auth.signUp.mockResolvedValue({ data: null, error: { message: "User already exists" } });
    const r = await signUp(su);
    expect(r.reason).toBe("failed");
    expect(r.message).toBe("User already exists");
  });
});

describe("signIn", () => {
  it("accepts a matching role", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1", email: "w@example.com", profile: { name: "Demo W" } } }, error: null });
    auth.getProfile.mockResolvedValue({ data: { id: "u1", name: "Demo W", role: "wholesaler" }, error: null });
    const r = await signIn({ role: "wholesaler", email: "w@example.com", password: "x" });
    expect(r.ok).toBe(true);
  });
  it("rejects a different role and signs out", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1", email: "w@example.com" } }, error: null });
    auth.getProfile.mockResolvedValue({ data: { id: "u1", role: "wholesaler" }, error: null });
    const r = await signIn({ role: "buyer", email: "w@example.com", password: "x" });
    expect(r).toEqual({ ok: false, reason: "role-mismatch", actualRole: "wholesaler" });
    expect(auth.signOut).toHaveBeenCalled();
  });
  it("applies the pending profile on first login", async () => {
    auth.signUp.mockResolvedValue({ data: { requireEmailVerification: true, accessToken: null }, error: null });
    await signUp(su);
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1", email: "w@example.com" } }, error: null });
    auth.getProfile
      .mockResolvedValueOnce({ data: { id: "u1" }, error: null })
      .mockResolvedValueOnce({ data: { id: "u1", role: "wholesaler" }, error: null });
    const r = await signIn({ role: "wholesaler", email: "w@example.com", password: "x" });
    expect(r.ok).toBe(true);
    expect(auth.setProfile).toHaveBeenCalledWith(expect.objectContaining({ role: "wholesaler", business: "Demo Traders" }));
    expect(Object.keys(store)).not.toContain("coverly.pendingProfile");
  });
  it("shows the backend message on bad credentials", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: "Invalid login credentials" } });
    const r = await signIn({ role: "buyer", email: "a@b.co", password: "bad" });
    expect(r.reason).toBe("failed");
    expect(r.message).toBe("Invalid login credentials");
  });
});