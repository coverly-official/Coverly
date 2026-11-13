import React from "react";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BusinessServicesShowcase } from "@/components/sections/BusinessServicesShowcase";
import { AiParser } from "@/components/sections/AiParser";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { Trust } from "@/components/sections/Trust";

export const HomePage: React.FC = () => {
  return (
    <div>
      {/* 1. Hero Section (Category Selector, Mockup Stats & Overlapping Cards) */}
      <Hero />

      {/* 2. How It Works (Connect -> Compare -> Manage) */}
      <HowItWorks />

      {/* 3. Business Services Marketplace Showcase */}
      <BusinessServicesShowcase />

      {/* 4. AI Feature: WhatsApp-to-Table Parser */}
      <AiParser />

      {/* 5. Interactive Demo / Live Quote Preview */}
      <LiveDemo />

      {/* 6. Trust & Verification Network */}
      <Trust />
    </div>
  );
};
