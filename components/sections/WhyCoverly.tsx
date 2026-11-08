import { LineChart } from "@/components/ui/LineChart"
import { FadeUp } from "@/components/ui/FadeUp"
import { cn } from "@/lib/utils"
import { formatRupees, formatPercent } from "@/lib/utils"

const LandedCostCard = () => {
  const dataPoints = [
    { label: "Sticker Price", value: 100, color: "#94a3b8" },
    { label: "Landed Cost", value: 125, color: "#1e293b" },
    { label: "Savings", value: 75, color: "#22c55e" },
  ]

  return (
    <div className="rounded-2xl bg-surface p-6 shadow-soft border border-[rgba(45,50,80,0.06)]">
      <h3 className="text-lg font-heading font-semibold text-ink mb-4">
        Landed Cost Variance
      </h3>
      
      <div className="mb-6">
        <LineChart data={dataPoints} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard value="15%" label="Avg Savings" />
        <StatCard value="Rs 8,500" label="Freight Included" />
      </div>
    </div>
  )
}

export default function WhyCoverly() {
  return (
    <section id="why-coverly" className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeUp delay={0}>
          <p className="text-sm font-semibold text-navy uppercase tracking-wide mb-2">
            The real cost of sourcing
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-ink mb-3">
            Why Coverly?
          </h2>
          <p className="text-lg text-ink opacity-80 mb-10 max-w-2xl">
            See what you really pay, not just the sticker price.
          </p>
        </FadeUp>

        <FadeUp delay={100}>
          <LandedCostCard />
        </FadeUp>
      </div>
    </section>
  )
}
