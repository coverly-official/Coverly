import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import Products from "@/components/sections/Products";
import WhyCoverly from "@/components/sections/WhyCoverly";
import Comparison from "@/components/sections/Comparison";
import { Trust } from "@/components/sections/Trust";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AiParser } from "@/components/sections/AiParser";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Products />
        <WhyCoverly />
        <Comparison />
        <div className="theme-dark"><Trust /></div>
        <HowItWorks />
        <AiParser />
        <LiveDemo />
      </main>
      <div className="theme-dark"><Footer /></div>
    </div>
  );
}