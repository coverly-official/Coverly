import { ProductCategory } from "@/data/suppliers";
import { calculateLandedCost } from "@/lib/landed-cost";
import { formatRupees } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/ui/FadeUp";
import { VerifiedBadge } from "@/components/ui/Badge";

export default function Comparison() {
  const cottonTshirtsCategory: ProductCategory = [
    {
      id: "cotton-tshirts",
      label: "Cotton T-Shirts (Round Neck)",
      unit: "pc",
      defaultQty: 500,
      suppliers: [
        {
          name: "Tiruppur Knits",
          city: "Tiruppur",
          verified: true,
          unitPrice: 212,
          moq: 300,
          freight: 3200,
          gstRate: 0.05,
        },
        {
          name: "Surat Textile Hub",
          city: "Surat",
          verified: true,
          unitPrice: 196,
          moq: 500,
          freight: 9800,
          gstRate: 0.05,
        },
        {
          name: "Ludhiana Garments Co",
          city: "Ludhiana",
          verified: true,
          unitPrice: 205,
          moq: 250,
          freight: 2400,
          gstRate: 0.05,
        },
      ],
    },
  ][0];

  const suppliers = cottonTshirtsCategory.suppliers;
  const quantity = cottonTshirtsCategory.defaultQty;

  // Calculate landed costs for each supplier
  const landedCosts = suppliers.map((supplier) => {
    return calculateLandedCost({
      unitPrice: supplier.unitPrice,
      quantity: quantity,
      gstRate: supplier.gstRate,
      freight: supplier.freight,
    });
  });

  // Find the lowest landed cost
  const minLandedCost = Math.min(...landedCosts.map((lc) => lc.landedPerUnit));

  return (
    <section id="comparison" className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <FadeUp delay={0}>
          <h2 className="text-center text-3xl md:text-4xl font-heading font-bold text-ink mb-3">
            Stop the Sourcing Nightmare
          </h2>
          <p className="text-center text-lg text-surface-muted mb-8">
            Compare landed costs instantly
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Left Card - Typical Marketplace Listing */}
          <FadeUp delay={100}>
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-[rgba(45,50,80,0.06)]">
              <h3 className="text-xl font-heading font-semibold text-ink mb-4">
                Typical marketplace listing
              </h3>
              <div className="space-y-3">
                {suppliers.map((supplier, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-[rgba(45,50,80,0.1)] last:border-0"
                  >
                    <span className="font-medium text-ink">{supplier.name}</span>
                    <span className="text-surface-muted">
                      {formatRupees(supplier.unitPrice)} / pc
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Right Card - Coverly */}
          <FadeUp delay={200}>
            <div className="rounded-2xl bg-surface p-6 shadow-soft border border-[rgba(45,50,80,0.06)]">
              <h3 className="text-xl font-heading font-semibold text-ink mb-4">
                Coverly
              </h3>
              <div className="space-y-3">
                {suppliers.map((supplier, index) => {
                  const landedCost = landedCosts[index];
                  const isBest = landedCost.landedPerUnit === minLandedCost;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex justify-between items-center py-2 border-b border-[rgba(45,50,80,0.1)] last:border-0",
                        isBest && "bg-coral/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{supplier.name}</span>
                        {isBest && (
                          <VerifiedBadge
                            size="sm"
                            className={cn(
                              "bg-coral text-navy",
                              isBest ? "" : "bg-coral/10 text-surface-muted"
                            )}
                          >
                            Best landed cost
                          </VerifiedBadge>
                        )}
                      </div>
                      <span className="text-surface-muted">
                        {formatRupees(landedCost.landedPerUnit)} / pc
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={300}>
          <p className="text-center text-sm text-surface-muted">
            Illustrative example with sample data
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
