"use client";

import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { LineChart } from "@/components/ui/LineChart";
import { VerifiedBadge } from "@/components/ui/Badge";
import { PLACEHOLDERS } from "@/data/placeholders";
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative pt-8 md:pt-14 pb-16 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Mockup-style Gray Hero Container */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-surface-muted rounded-card-lg p-6 sm:p-8 md:p-10 border border-[rgba(34,37,42,0.06)] shadow-soft flex flex-col justify-between"
          >
            <div>
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-[rgba(34,37,42,0.06)] text-xs font-medium text-ink mb-6">
                <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                Raw Materials & MSME Procurement
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-ink tracking-tight leading-[1.12] mb-5">
                Stop the Sourcing Nightmare.
                <span className="block text-coral">
                  Compare True Landed Costs Instantly.
                </span>
              </h1>

              {/* Subcopy: strictly <= 20 words */}
              <p className="text-base sm:text-lg text-ink-secondary leading-relaxed mb-8 max-w-[52ch]">
                The modern wholesale marketplace for Indian MSMEs. Compare quotes
                with unit price, MOQ, GST, and freight calculated into one true
                landed cost.
              </p>

              {/* Divider Bar from mockup */}
              <div className="w-full h-px bg-[rgba(34,37,42,0.08)] mb-8" />

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <a href="#live-demo">
                  <Button variant="primary" size="lg" className="group">
                    Explore Live RFQ
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Button>
                </a>
                <a href="#contact">
                  <Button variant="ghost" size="lg">
                    Get Verified Quotes
                  </Button>
                </a>
              </div>
            </div>

            {/* Bottom 3 Stat Cards from Mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[rgba(34,37,42,0.06)]">
              {PLACEHOLDERS.heroStats.map((stat, i) => (
                <StatCard
                  key={i}
                  value={stat.value}
                  label={stat.label}
                  className="bg-surface hover:shadow-card transition-shadow"
                />
              ))}
            </div>
          </motion.div>

          {/* Right Column: Stacked Mockup Cards */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Top Soft-Pink Card with metric pills + line chart */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface-pink rounded-card p-6 border border-[rgba(241,106,90,0.15)] shadow-soft"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-heading font-semibold uppercase tracking-wider text-coral">
                  Landed Cost Variance
                </span>
                <span className="text-xs text-ink-secondary font-medium">
                  3 Quotes Analyzed
                </span>
              </div>

              {/* Metric Pills */}
              <div className="flex items-center gap-3 mb-5">
                <div className="px-3 py-1.5 rounded-full bg-surface shadow-soft text-xs font-semibold text-ink flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-verified" />
                  Avg Savings: 12%
                </div>
                <div className="px-3 py-1.5 rounded-full bg-surface shadow-soft text-xs font-semibold text-ink flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-coral" />
                  Freight Included
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-surface/80 backdrop-blur-sm rounded-xl p-3 border border-[rgba(34,37,42,0.04)]">
                <LineChart color="var(--accent)" secondaryColor="var(--btn-primary)" />
                <div className="flex justify-between items-center text-[10px] text-ink-secondary font-mono mt-2 pt-2 border-t border-[rgba(34,37,42,0.06)]">
                  <span>Sticker Price (Surat): Rs196</span>
                  <span className="text-coral font-bold">Landed (Ludhiana): Rs220.05</span>
                </div>
              </div>
            </motion.div>

            {/* Bottom Card: Floating Tilted Dashboard Screen over Gradient */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 bg-gradient-to-br from-[#EAE6F8] via-[#F4E9E6] to-[#FDECEB] rounded-card p-6 border border-[rgba(34,37,42,0.06)] shadow-soft flex flex-col justify-center relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-heading font-semibold text-ink">
                  Side by Side Comparison
                </span>
                <VerifiedBadge size="sm" />
              </div>

              {/* Tilted Floating Dashboard Card */}
              <div className="transform md:rotate-1 hover:rotate-0 transition-transform duration-300 bg-surface rounded-2xl p-4 shadow-card border border-[rgba(34,37,42,0.08)]">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(34,37,42,0.06)] mb-2.5">
                  <span className="text-xs font-bold text-ink">T-Shirts (500 pcs)</span>
                  <span className="text-[11px] font-mono font-medium text-verified bg-verified/10 px-2 py-0.5 rounded-full">
                    Best: Ludhiana
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-muted text-ink-secondary">
                    <span>Surat Hub (Sticker Rs196)</span>
                    <span className="font-mono text-ink">Landed Rs225.40</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-coral/10 text-coral font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Ludhiana Co (Sticker Rs205)
                    </span>
                    <span className="font-mono text-coral">Landed Rs220.05</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-muted text-ink-secondary">
                    <span>Tiruppur Knits (Sticker Rs212)</span>
                    <span className="font-mono text-ink">Landed Rs229.00</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
