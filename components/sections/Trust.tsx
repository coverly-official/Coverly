import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/utils";

export default function Trust() {
  return (
    <section id="trust" className="py-20 bg-surface">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(45,50,80,0.1)] bg-surface-muted/30 px-4 py-2 text-sm font-semibold text-navy mb-6">
          <span className="h-2 w-2 rounded-full bg-coral" />
          Associated with Rungta University Business Incubator, Bhilai
        </div>

        {/* Trust Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {/* Single number stats - use CountUp */}
          <div className="text-center">
            <CountUp value="78%" />
            <p className="mt-2 text-sm font-medium text-navy">Satisfied Clients</p>
          </div>

          <div className="text-center">
            <CountUp value="95%" />
            <p className="mt-2 text-sm font-medium text-navy">On-Time Delivery</p>
          </div>

          {/* Range stats - plain text */}
          <div className="text-center">
            <span className="text-3xl font-heading font-bold text-ink">8-12</span>
            <p className="mt-2 text-sm font-medium text-navy">Years Experience</p>
          </div>

          <div className="text-center">
            <span className="text-3xl font-heading font-bold text-ink">15-40%</span>
            <p className="mt-2 text-sm font-medium text-navy">Cost Savings</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-muted/30 border border-[rgba(45,50,80,0.06)]">
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-navy/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.818a5.5 5.5 0 00-7.778-7.778m5.778 7.778V17.5M9 12l-3-3" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-navy">Verified Suppliers</p>
              <p className="text-sm text-ink opacity-70">All partners vetted and approved</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-muted/30 border border-[rgba(45,50,80,0.06)]">
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-navy/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6.43-12.57a10 10 0 0113.87 0M12 19V5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-navy">Transparent Pricing</p>
              <p className="text-sm text-ink opacity-70">No hidden fees or surprises</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-muted/30 border border-[rgba(45,50,80,0.06)]">
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-navy/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0L12 21m0 0l-3.364-3.364m3.364 3.364L21 12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-navy">Quality Assurance</p>
              <p className="text-sm text-ink opacity-70">Every order inspected before shipping</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
