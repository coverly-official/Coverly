import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AiParser } from "@/components/sections/AiParser";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { Trust } from "@/components/sections/Trust";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* 1. Sticky Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section (Split Asymmetric Layout with Mockup Stats & Overlapping Cards) */}
        <Hero />

        {/* 3. How It Works (Connect -> Compare -> Manage) */}
        <HowItWorks />

        {/* 4. AI Feature: WhatsApp-to-Table Parser */}
        <AiParser />

        {/* 5. Interactive Demo / Live Quote Preview */}
        <LiveDemo />

        {/* 6. Trust & Verification Network */}
        <Trust />
      </main>

      {/* 7. Footer / Sourcing Concierge Lead Form */}
      <Footer />
    </div>
  );
}
