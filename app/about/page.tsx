import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "About | Coverly",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-heading font-bold text-ink mb-4">
          About Coverly
        </h1>
        <p className="text-base md:text-lg text-ink-secondary leading-relaxed mb-8">
          Coverly is an early-stage B2B marketplace project associated with the Rungta University Business Incubator, Bhilai. It aims to help businesses discover providers, compare quotations, purchase supplies and manage orders through one platform, with Chhattisgarh, India as the planned starting market.
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