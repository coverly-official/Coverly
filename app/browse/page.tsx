import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { BrowseClient } from "@/components/browse/BrowseClient";

export const metadata: Metadata = {
  title: "Browse Products & Suppliers | Coverly",
  description:
    "Discover suppliers and raw materials starting nearby in Chhattisgarh, then across the state and All World.",
};

export default function BrowsePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-[70vh] flex items-center justify-center p-8 text-center text-ink-secondary text-sm">
              Loading marketplace listings...
            </div>
          }
        >
          <BrowseClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
