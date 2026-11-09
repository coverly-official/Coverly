"use client";

import { LineChart } from "@/components/ui/LineChart";
import { TrendingUp, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FadeUp } from "@/components/ui/FadeUp";

export default function WhyCoverly() {
  const reduce = useReducedMotion();

  return (
    <section id="why-coverly" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <FadeUp className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-surface-pink text-coral text-xs font-heading font-semibold uppercase tracking-wider">
            The real cost of sourcing
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink tracking-tight mb-4">
            Why Coverly?
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed">
            See what you really pay, not just the sticker price.
          </p>
        </FadeUp>

        {/* Landed Cost Variance Card */}
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
              3 Sample Quotes Analyzed
            </span>
          </div>

          {/* Metric Pills */}
          <div className="flex items-center gap-3 mb-5">
            <div className="px-3 py-1.5 rounded-full bg-surface shadow-soft text-xs font-semibold text-ink flex items-center gap-1.5">
              <TrendingUp size={14} className="text-verified" />
              Sample Calculation
            </div>
            <div className="px-3 py-1.5 rounded-full bg-surface shadow-soft text-xs font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-coral" />
              Freight Included
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-surface/80 backdrop-blur-sm rounded-xl p-3 border border-[rgba(45,50,80,0.04)]">
            <LineChart color="var(--accent)" secondaryColor="var(--btn-primary)" />
            <div className="flex justify-between items-center text-[10px] text-ink-secondary font-mono mt-2 pt-2 border-t border-[rgba(45,50,80,0.06)]">
              <span>Sticker Price (Surat): Rs196</span>
              <span className="text-coral font-bold">Landed (Ludhiana): Rs220.05</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
