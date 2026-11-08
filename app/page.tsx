import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Products } from "@/components/sections/Products";
import { WhyCoverly } from "@/components/sections/WhyCoverly";
import { Comparison } from "@/components/sections/Comparison";
import { Trust } from "@/components/sections/Trust";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AiParser } from "@/components/sections/AiParser";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* 1. Loading Screen */}
      <LoadingScreen />

      {/* 2. Sticky Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* 3. Hero Section (Split Asymmetric Layout with Mockup Stats & Overlapping Cards) */}
        <Hero />

        {/* 4. Products Section */}
        <Products />

        {/* 5. Why Coverly Section */}
        <WhyCoverly />

        {/* 6. Comparison Section */}
        <Comparison />

        {/* 7. Trust & Verification Network */}
        <Trust />

        {/* 8. How It Works (Connect -> Compare -> Manage) */}
        <HowItWorks />

        {/* 9. AI Feature: WhatsApp-to-Table Parser */}
        <AiParser />

        {/* 10. Interactive Demo / Live Quote Preview */}
        <LiveDemo />
      </main>

      {/* 11. Footer / Sourcing Concierge Lead Form */}
      <Footer />
    </div>
  );
}
