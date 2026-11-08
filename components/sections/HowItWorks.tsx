"use client";

import { FadeUp } from "@/components/ui/FadeUp";
import { ArrowRight, Layers, FileSpreadsheet, CheckCircle2, MapPin, Truck } from "lucide-react";

const steps = [
  {
    number: "01",
    action: "Connect",
    title: "Submit structured requirements",
    description:
      "Enter specifications, quantities, and delivery location. Coverly prioritizes verified suppliers nearby first, then across the state.",
    badge: "Location Prioritized",
    snippet: (
      <div className="bg-surface rounded-xl p-3 border border-[rgba(34,37,42,0.06)] shadow-soft text-xs space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px] text-ink-secondary pb-1.5 border-b border-[rgba(34,37,42,0.06)]">
          <span className="flex items-center gap-1 text-ink font-semibold">
            <Layers size={13} className="text-coral" /> RFQ-8492
          </span>
          <span className="text-verified">Active Match</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-secondary text-[11px]">
          <MapPin size={12} className="text-coral" />
          <span>Dispatch to Raipur (C.G.)</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="px-2 py-0.5 rounded-md bg-surface-muted text-[10px] font-medium text-ink">
            Qty: 500 pcs
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-muted text-[10px] font-medium text-ink">
            Target: 48h
          </span>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    action: "Compare",
    title: "Review true landed costs",
    description:
      "See raw sticker prices converted into transparent landed figures including MOQ, freight quotes, and applicable GST rates.",
    badge: "Transparent Math",
    snippet: (
      <div className="bg-surface rounded-xl p-3 border border-[rgba(34,37,42,0.06)] shadow-soft text-xs space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-ink-secondary pb-1 border-b border-[rgba(34,37,42,0.06)]">
          <span>Formula</span>
          <span className="text-coral font-semibold">(Price + GST) + Freight</span>
        </div>
        <div className="flex justify-between items-center text-[11px] pt-1 text-ink-secondary">
          <span>Sticker Price</span>
          <span className="font-mono text-ink">Rs196</span>
        </div>
        <div className="flex justify-between items-center text-[11px] text-coral font-bold bg-surface-pink p-1 rounded">
          <span>True Landed</span>
          <span className="font-mono">Rs220.05</span>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    action: "Manage",
    title: "Order and track centrally",
    description:
      "Select your best match, coordinate delivery status, and reorder from trusted partners in one organized workflow.",
    badge: "Unified Sourcing",
    snippet: (
      <div className="bg-surface rounded-xl p-3 border border-[rgba(34,37,42,0.06)] shadow-soft text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-ink-secondary pb-1 border-b border-[rgba(34,37,42,0.06)]">
          <span className="text-ink font-semibold">PO #4102</span>
          <span className="text-verified flex items-center gap-1 font-sans">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 text-ink-secondary">
            <Truck size={12} className="text-coral" /> Dispatch
          </span>
          <span className="font-mono font-medium text-ink">Ludhiana Hub</span>
        </div>
        <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden">
          <div className="bg-coral w-3/4 h-full rounded-full" />
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-surface/50 border-y border-[rgba(34,37,42,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header: Clean vertical stack */}
        <FadeUp className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-surface-pink text-coral text-xs font-heading font-semibold uppercase tracking-wider mb-3">
            Workflow Overview
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink tracking-tight mb-4">
            How Coverly Works
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed">
            Eliminate phone tag, opaque spreadsheets, and hidden transport fees.
            Experience structured B2B procurement in three clear stages.
          </p>
        </FadeUp>

        {/* 3 Connected Step Cards */}
        <div className="relative">
          {/* Subtle connecting line for desktop */}
          <div
            className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 -translate-y-8 bg-gradient-to-r from-coral/20 via-coral/40 to-coral/20 border-dashed"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <FadeUp
                key={step.action}
                delay={index * 0.12}
                className="bg-surface rounded-card p-6 sm:p-7 border border-[rgba(34,37,42,0.06)] shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Number circle & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-10 h-10 rounded-2xl bg-surface-muted border border-[rgba(34,37,42,0.08)] flex items-center justify-center font-mono font-bold text-sm text-ink shadow-sm">
                      {step.number}
                    </span>
                    <span className="text-[11px] font-medium text-ink-secondary bg-surface-muted px-2.5 py-1 rounded-full">
                      {step.badge}
                    </span>
                  </div>

                  {/* Action & Title */}
                  <div className="text-xs font-heading font-bold uppercase tracking-wider text-coral mb-1">
                    {step.action}
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-ink mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Illustrative Snippet */}
                <div className="pt-4 border-t border-[rgba(34,37,42,0.06)]">
                  {step.snippet}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
