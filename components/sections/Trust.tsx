"use client";

import { FadeUp } from "@/components/ui/FadeUp";
import { CountUp } from "@/components/ui/CountUp";
import { VerifiedBadge } from "@/components/ui/Badge";
import { PLACEHOLDERS } from "@/data/placeholders";
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  Scale,
  Award,
  CheckCircle2,
} from "lucide-react";

const verificationSteps = [
  {
    icon: Building2,
    title: "Premise & GSTIN Audit",
    description:
      "Physical verification of the manufacturing unit or warehouse, cross-referenced with active GST filings and dispatch logs.",
  },
  {
    icon: Scale,
    title: "Capacity & MOQ Validation",
    description:
      "Independent inspection of installed machinery and production output to guarantee genuine minimum order capacity.",
  },
  {
    icon: FileCheck2,
    title: "Locked Freight Tariffs",
    description:
      "Prior agreement on lane freight charges so buyers never face unexpected transport surcharges upon delivery.",
  },
  {
    icon: Award,
    title: "Quality Consistency Check",
    description:
      "Batch sample evaluation before granting the verified status mark on the Coverly network.",
  },
];

export function Trust() {
  return (
    <section id="trust" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Incubator Badge */}
        <FadeUp className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface border border-[rgba(34,37,42,0.08)] shadow-soft text-xs font-heading font-semibold text-ink">
            <span className="w-2.5 h-2.5 rounded-full bg-verified" />
            Incubated at Rungta University Business Incubator, Bhilai
          </div>
        </FadeUp>

        {/* Section Headline */}
        <FadeUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink tracking-tight mb-4">
            Ground-Truth Verification to Smash the Trust Deficit
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed">
            Wholesale sourcing fails when suppliers misrepresent capacity or hit
            buyers with freight markups. We audit on the ground before any vendor
            earns a verified badge.
          </p>
        </FadeUp>

        {/* 4-Step Verification Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {verificationSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <FadeUp
                key={step.title}
                delay={idx * 0.1}
                className="bg-surface rounded-card p-6 border border-[rgba(34,37,42,0.06)] shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-surface-pink text-coral flex items-center justify-center mb-5 shadow-sm">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-heading font-semibold text-base text-ink mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[rgba(34,37,42,0.06)] flex items-center gap-1.5 text-[11px] font-semibold text-verified">
                  <CheckCircle2 size={13} />
                  Field Verified
                </div>
              </FadeUp>
            );
          })}
        </div>

        {/* Trust Gap Stat Strip from PLACEHOLDERS */}
        <FadeUp
          delay={0.2}
          className="bg-surface rounded-card-lg p-6 sm:p-8 border border-[rgba(34,37,42,0.06)] shadow-soft mb-16"
        >
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-heading font-bold text-coral uppercase tracking-wider">
              The Reality of Indian B2B Procurement
            </span>
            <div className="text-lg font-heading font-semibold text-ink mt-1">
              Why Transparent Sourcing Matters
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {PLACEHOLDERS.trustStats.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-muted/60 border border-[rgba(34,37,42,0.04)]"
              >
                <div className="text-2xl sm:text-3xl font-heading font-bold text-ink mb-1.5">
                  <CountUp value={stat.value} />
                </div>
                <div className="text-xs text-ink-secondary leading-snug">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-[11px] text-ink-secondary/70 mt-4 font-mono">
            * Estimated baseline metrics for informal B2B purchasing workflows
          </div>
        </FadeUp>

        {/* Partner / Incubation Strip styled like mockup */}
        <FadeUp delay={0.3} className="text-center">
          <div className="text-xs font-heading font-semibold uppercase tracking-wider text-ink-secondary mb-6">
            Ecosystem Associations & Regional Focus
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-4 px-6 rounded-2xl bg-surface/60 border border-[rgba(34,37,42,0.06)]">
            <div className="flex items-center gap-2 font-heading font-bold text-sm text-ink tracking-tight">
              <span className="w-2 h-2 rounded-full bg-coral" />
              Rungta Incubation Centre
            </div>
            <div className="h-4 w-px bg-[rgba(34,37,42,0.1)] hidden sm:block" />
            <div className="flex items-center gap-2 font-heading font-semibold text-sm text-ink-secondary">
              Bhilai Industrial Zone
            </div>
            <div className="h-4 w-px bg-[rgba(34,37,42,0.1)] hidden sm:block" />
            <div className="flex items-center gap-2 font-heading font-semibold text-sm text-ink-secondary">
              Raipur Logistics Cluster
            </div>
            <div className="h-4 w-px bg-[rgba(34,37,42,0.1)] hidden sm:block" />
            <div className="flex items-center gap-2 font-heading font-semibold text-sm text-ink-secondary">
              Chhattisgarh MSME Network
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
