"use client";

import { FadeUp } from "@/components/ui/FadeUp";
import { CountUp } from "@/components/ui/CountUp";
// Project status
const projectStats = [
  { value: "9", label: "Planned product categories" },
  { value: "3", label: "Discovery tiers (Nearby, State, World)" },
  { value: "Pilot", label: "Current development stage" },
  { value: "C.G.", label: "Planned initial market focus" },
];
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
    title: "Incubated in Bhilai",
    description:
      "Associated with the Rungta University Business Incubator, Bhilai.",
  },
  {
    icon: Scale,
    title: "Platform in Development",
    description:
      "The web app and provider tools are currently in development for early testing.",
  },
  {
    icon: FileCheck2,
    title: "Bootstrapped Project",
    description:
      "An independent, early-stage project focused on transparent landed costs.",
  },
  {
    icon: Award,
    title: "Chhattisgarh Focus",
    description:
      "Starting with local businesses and suppliers in Chhattisgarh before expanding.",
  },
];

export function Trust() {
  return (
    <section id="trust" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Incubator Badge */}
        <FadeUp className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface border border-[rgba(45,50,80,0.08)] shadow-soft text-xs font-heading font-semibold text-ink">
            <span className="w-2.5 h-2.5 rounded-full bg-verified" />
            Startup project associated with the Rungta University Business Incubator, Bhilai
          </div>
        </FadeUp>

        {/* Section Headline */}
        <FadeUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink tracking-tight mb-4">
            Where We Are: Building for Local Businesses
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed">
            Coverly is an early-stage B2B marketplace project in active development.
            We are building tools to help buyers discover providers and compare
            landed costs, starting in Chhattisgarh.
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
                className="bg-surface rounded-card p-6 border border-[rgba(45,50,80,0.12)] shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
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
                <div className="pt-4 mt-4 border-t border-[rgba(45,50,80,0.12)] flex items-center gap-1.5 text-[11px] font-semibold text-verified">
                  <CheckCircle2 size={13} />
                  Current focus
                </div>
              </FadeUp>
            );
          })}
        </div>

        {/* Trust Gap Stat Strip from PLACEHOLDERS */}
        <FadeUp
          delay={0.2}
          className="bg-surface rounded-card-lg p-6 sm:p-8 border border-[rgba(45,50,80,0.12)] shadow-soft mb-16"
        >
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-heading font-bold text-coral uppercase tracking-wider">
              Project Scope & Current Status
            </span>
            <div className="text-lg font-heading font-semibold text-ink mt-1">
              Planned Marketplace Architecture
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {projectStats.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-muted/60 border border-[rgba(45,50,80,0.04)]"
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

          <div className="text-center text-[11px] text-ink-secondary/90 mt-4 font-mono">
            * Current project specifications and development phase
          </div>
        </FadeUp>

        {/* Partner / Incubation Strip styled like mockup */}
        <FadeUp delay={0.3} className="text-center">
          <div className="text-xs font-heading font-semibold uppercase tracking-wider text-ink-secondary mb-6">
            Ecosystem Associations & Regional Focus
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-4 px-6 rounded-2xl bg-surface/60 border border-[rgba(45,50,80,0.12)]">
            <div className="flex items-center gap-2 font-heading font-bold text-sm text-ink tracking-tight">
              <span className="w-2 h-2 rounded-full bg-coral" />
              Rungta Incubation Centre
            </div>
            <div className="h-4 w-px bg-[rgba(45,50,80,0.1)] hidden sm:block" />
            <div className="flex items-center gap-2 font-heading font-semibold text-sm text-ink-secondary">
              Bhilai Industrial Zone
            </div>
            <div className="h-4 w-px bg-[rgba(45,50,80,0.1)] hidden sm:block" />
            <div className="flex items-center gap-2 font-heading font-semibold text-sm text-ink-secondary">
              Raipur Logistics Cluster
            </div>
            <div className="h-4 w-px bg-[rgba(45,50,80,0.1)] hidden sm:block" />
            <div className="flex items-center gap-2 font-heading font-semibold text-sm text-ink-secondary">
              Chhattisgarh MSME Network
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
