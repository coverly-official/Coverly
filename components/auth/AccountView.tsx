"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROLE_OPTIONS, type AccountRole } from "@/lib/auth";
import { logOut, useAuth } from "@/lib/session";

interface InfoCard {
  title: string;
  text: string;
}

const CARDS: Record<AccountRole, InfoCard[]> = {
  buyer: [
    {
      title: "Quotation requests",
      text: "Requests you send from product pages will be listed here. You have none yet.",
    },
    {
      title: "Saved suppliers",
      text: "Saving suppliers is coming soon.",
    },
    {
      title: "Orders",
      text: "Order tracking across providers is coming soon.",
    },
  ],
  wholesaler: [
    {
      title: "Your listings",
      text: "Product listings for providers are coming soon.",
    },
    {
      title: "Quotation requests",
      text: "Requests from buyers will appear here once listings are open.",
    },
    {
      title: "Orders and sales",
      text: "Order management and sales monitoring are coming soon.",
    },
  ],
  manufacturer: [
    {
      title: "Your listings",
      text: "Product listings for providers are coming soon.",
    },
    {
      title: "Quotation requests",
      text: "Requests from buyers will appear here once listings are open.",
    },
    {
      title: "Orders and sales",
      text: "Order management and sales monitoring are coming soon.",
    },
  ],
};

export function AccountView() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
  }, [status, router]);

  if (status !== "signed-in" || !user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-ink-secondary">Loading your account...</p>
      </main>
    );
  }

  const role = ROLE_OPTIONS.find((option) => option.id === user.role) ?? ROLE_OPTIONS[0];

  async function handleLogOut() {
    await logOut();
    router.push("/");
  }

  return (
    <main className="px-4 py-10 sm:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-coral">
              {role.label} account
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Hello, {user.name}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {user.email}
              {user.business ? ` | ${user.business}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-full bg-coral px-6 py-3 text-sm font-semibold text-navy transition hover:brightness-95"
            >
              Browse products
            </Link>
            <button
              type="button"
              onClick={handleLogOut}
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>

        <p className="mb-4 text-sm text-ink-secondary">
          Account tools are still in development. This is what a {role.label.toLowerCase()} account is planned to include.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {CARDS[role.id].map((card) => (
            <section
              key={card.title}
              className="rounded-card-lg border border-[rgba(45,50,80,0.12)] bg-surface p-6 shadow-soft"
            >
              <h2 className="mb-2 font-heading text-lg font-bold text-ink">
                {card.title}
              </h2>
              <p className="text-sm leading-relaxed text-ink-secondary">
                {card.text}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}