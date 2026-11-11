import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Wholesalers | Coverly",
};

export default function WholesalersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-heading font-bold text-ink mb-4">
          Wholesalers
        </h1>
        <p className="text-base md:text-lg text-ink-secondary leading-relaxed mb-8">
          Coverly is being built so wholesalers, suppliers and distributors can reach business buyers, respond to quotation requests and manage orders from one place. These provider tools are still in development, and this page will be updated as they are ready.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/signup?role=wholesaler"
            className="inline-flex items-center rounded-full bg-coral px-6 py-3 text-sm font-semibold text-navy shadow-[0_8px_30px_rgba(249,177,122,0.35)] transition hover:brightness-95"
          >
            Sign up as a wholesaler
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center rounded-full border border-[rgba(45,50,80,0.25)] px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
          >
            Browse as guest
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}