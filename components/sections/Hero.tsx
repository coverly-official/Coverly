"use client";

import Link from "next/link";
import { FadeUp } from "@/components/ui/FadeUp";
import { useAuth } from "@/lib/session";
import { ArrowRight, Search, Scale, ShoppingCart, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    text: "Find providers, starting with the ones nearest to you.",
  },
  {
    icon: Scale,
    title: "Compare",
    text: "Review quotations against what you actually need.",
  },
  {
    icon: ShoppingCart,
    title: "Purchase",
    text: "Pick a provider and place the order.",
  },
  {
    icon: Truck,
    title: "Manage",
    text: "Follow every order from one dashboard.",
  },
];

export function Hero() {
  const { status, user } = useAuth();
  const signedIn = status === "signed-in" && user;

  return (
    <section id="hero" className="px-4 sm:px-6 pt-6 pb-16 md:pb-24">
      <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[2rem] bg-navy">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-coral/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#676f9d]/30 blur-3xl"
        />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center p-8 sm:p-12 lg:p-16">
          <FadeUp>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white tracking-tight leading-[1.12] mb-5">
              Find providers, compare quotes and manage orders in one place.
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl mb-8">
              Coverly helps businesses discover providers, compare quotations
              and manage orders from one platform, starting with nearby
              suppliers.
            </p>
            {signedIn ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-navy shadow-[0_8px_30px_rgba(249,177,122,0.35)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Go to my account
                </Link>
                <Link
                  href="/browse"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-navy shadow-[0_8px_30px_rgba(249,177,122,0.35)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Log in
                  </Link>
                </div>
                <Link
                  href="/browse"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Or browse as a guest
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </>
            )}
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-coral mb-5">
                Planned sourcing workflow
              </p>
              <ol className="space-y-5">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-coral">
                      <s.icon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {i + 1}. {s.title}
                      </p>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {s.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}