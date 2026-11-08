// @ts-nocheck
import { cn } from "@/lib/utils"

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-surface">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeUp delay={0}>
          <p className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">
            Simple 3-step process
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-ink mb-8 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div
              className={cn(
                "relative p-6 rounded-2xl bg-surface-muted/50 border border-[rgba(45,50,80,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                "text-center"
              )}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-coral"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-ink mb-2">
                Search & Compare
              </h3>
              <p className="text-sm text-ink/70">
                Browse verified suppliers and compare quotes for raw materials, packaging, and textiles.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={cn(
                "relative p-6 rounded-2xl bg-surface-muted/50 border border-[rgba(45,50,80,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                "text-center"
              )}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-coral"
                >
                  <path d="M12 2v20" />
                  <path d="M2 12h20" />
                  <path d="m4.93 4.93 14.14 14.14" />
                  <path d="m19.07 4.93-14.14 14.14" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-ink mb-2">
                Manage Orders
              </h3>
              <p className="text-sm text-ink/70">
                Track orders, manage deliveries, and keep all your sourcing in one centralized dashboard.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={cn(
                "relative p-6 rounded-2xl bg-surface-muted/50 border border-[rgba(45,50,80,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                "text-center"
              )}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-coral"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-bold text-ink mb-2">
                Get Verified Quotes
              </h3>
              <p className="text-sm text-ink/70">
                Receive transparent landed cost calculations and verified supplier ratings before you commit.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
