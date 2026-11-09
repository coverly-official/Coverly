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
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-navy text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}