"use client";

import { useState, useId, useMemo } from "react";
import { FadeUp } from "@/components/ui/FadeUp";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/Badge";
import { supplierData } from "@/data/suppliers";
import { categories, cities } from "@/data/categories";
import { calculateLandedCost } from "@/lib/landed-cost";
import { formatRupees, formatPercent } from "@/lib/utils";
import {
  Calculator,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function LiveDemo() {
  const reduce = useReducedMotion();
  const formId = useId();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("cotton-tshirts");
  const [quantity, setQuantity] = useState<number>(500);
  const [destination, setDestination] = useState<string>("Raipur");
  const [isCalculated, setIsCalculated] = useState<boolean>(true);

  // Active Category Data
  const currentCategory = useMemo(() => {
    return supplierData.find((c) => c.id === selectedCategory) || supplierData[0];
  }, [selectedCategory]);

  // Handle Category Change (update default qty)
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const cat = supplierData.find((c) => c.id === catId);
    if (cat) {
      setQuantity(cat.defaultQty);
    }
  };

  // Compute landed cost for all suppliers in current category
  const computedSuppliers = useMemo(() => {
    const validQty = Math.max(1, quantity || 1);

    return currentCategory.suppliers.map((supplier) => {
      const calculation = calculateLandedCost({
        unitPrice: supplier.unitPrice,
        quantity: validQty,
        gstRate: supplier.gstRate,
        freight: supplier.freight,
      });

      const isMoqMet = validQty >= supplier.moq;

      return {
        ...supplier,
        calculation,
        isMoqMet,
      };
    });
  }, [currentCategory, quantity]);

  // Find lowest sticker price supplier
  const lowestStickerSupplier = useMemo(() => {
    return [...computedSuppliers].sort((a, b) => a.unitPrice - b.unitPrice)[0];
  }, [computedSuppliers]);

  // Find lowest landed cost supplier among those meeting MOQ
  const bestLandedSupplier = useMemo(() => {
    const eligible = computedSuppliers.filter((s) => s.isMoqMet);
    if (eligible.length === 0) return null;
    return [...eligible].sort(
      (a, b) => a.calculation.landedPerUnit - b.calculation.landedPerUnit
    )[0];
  }, [computedSuppliers]);

  // Calculate savings vs lowest sticker price
  const savingsAnalysis = useMemo(() => {
    if (!bestLandedSupplier || !lowestStickerSupplier) return null;

    // Difference in landed cost between the lowest sticker supplier and the best landed supplier
    const stickerSupplierLanded = lowestStickerSupplier.calculation.landedPerUnit;
    const bestSupplierLanded = bestLandedSupplier.calculation.landedPerUnit;
    const diffPerUnit = stickerSupplierLanded - bestSupplierLanded;
    const totalSavings = diffPerUnit * quantity;

    return {
      isSame: bestLandedSupplier.name === lowestStickerSupplier.name,
      diffPerUnit: Math.round(diffPerUnit * 100) / 100,
      totalSavings: Math.round(totalSavings),
      stickerName: lowestStickerSupplier.name,
      bestName: bestLandedSupplier.name,
    };
  }, [bestLandedSupplier, lowestStickerSupplier, quantity]);

  return (
    <section id="live-demo" className="py-20 md:py-28 bg-surface-muted/60 border-y border-[rgba(34,37,42,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <FadeUp className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface text-xs font-heading font-semibold text-coral uppercase tracking-wider mb-4 border border-[rgba(34,37,42,0.06)] shadow-soft">
            <Calculator size={14} /> Interactive RFQ Simulator
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink tracking-tight mb-4">
            Test True Landed Costs in Real Time
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed">
            See how hidden freight and minimum order quantities flip purchasing
            decisions. Enter your order parameters below to run the live comparison.
          </p>
        </FadeUp>

        {/* Demo Widget Container */}
        <div className="bg-surface rounded-card-lg p-6 sm:p-8 md:p-10 border border-[rgba(34,37,42,0.06)] shadow-card">
          {/* Controls Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsCalculated(true);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pb-8 border-b border-[rgba(34,37,42,0.06)] mb-8"
          >
            {/* Category Select */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-category`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Product Category
              </label>
              <select
                id={`${formId}-category`}
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-[rgba(34,37,42,0.1)] text-sm font-body text-ink focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-qty`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Order Quantity ({currentCategory.unit}s)
              </label>
              <input
                id={`${formId}-qty`}
                type="number"
                min={1}
                step={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-[rgba(34,37,42,0.1)] text-sm font-mono text-ink focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
              />
            </div>

            {/* Destination City Select */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-city`}
                className="block text-xs font-heading font-semibold text-ink"
              >
                Destination City
              </label>
              <select
                id={`${formId}-city`}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-muted border border-[rgba(34,37,42,0.1)] text-sm font-body text-ink focus:border-coral focus:ring-1 focus:ring-coral transition-colors"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Action */}
            <div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full h-11"
              >
                <Sparkles size={16} />
                Generate Comparison
              </Button>
            </div>
          </form>

          {/* Results Table View */}
          <div
            aria-live="polite"
            className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(34,37,42,0.08)] text-[11px] font-heading font-bold text-ink-secondary uppercase tracking-wider">
                  <th className="pb-3 pr-4">Supplier & Location</th>
                  <th className="pb-3 px-3">Unit Price</th>
                  <th className="pb-3 px-3">MOQ</th>
                  <th className="pb-3 px-3">Freight to {destination}</th>
                  <th className="pb-3 px-3">GST</th>
                  <th className="pb-3 pl-4 text-right">Landed Cost / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(34,37,42,0.06)] text-sm">
                {computedSuppliers.map((supplier) => {
                  const isBest =
                    bestLandedSupplier &&
                    bestLandedSupplier.name === supplier.name &&
                    supplier.isMoqMet;

                  return (
                    <motion.tr
                      key={supplier.name}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`group transition-colors ${
                        isBest
                          ? "bg-surface-pink/60 font-medium"
                          : "hover:bg-surface-muted/50"
                      }`}
                    >
                      {/* Supplier column */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-semibold text-ink">
                            {supplier.name}
                          </span>
                          {supplier.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="text-xs text-ink-secondary mt-0.5">
                          {supplier.city}
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 px-3 font-mono">
                        {formatRupees(supplier.unitPrice)}
                        {supplier.name === lowestStickerSupplier?.name && (
                          <span className="block text-[10px] font-sans font-medium text-ink-secondary">
                            Lowest sticker
                          </span>
                        )}
                      </td>

                      {/* MOQ */}
                      <td className="py-4 px-3 font-mono">
                        {supplier.moq.toLocaleString("en-IN")}{" "}
                        <span className="font-sans text-xs text-ink-secondary">
                          {currentCategory.unit}
                        </span>
                        {!supplier.isMoqMet && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-coral bg-coral/10 px-1.5 py-0.5 rounded mt-1">
                            <AlertTriangle size={11} />
                            Min {supplier.moq} required
                          </span>
                        )}
                      </td>

                      {/* Freight */}
                      <td className="py-4 px-3 font-mono">
                        {formatRupees(supplier.freight)}
                        <span className="block text-[10px] font-sans text-ink-secondary">
                          +{formatRupees(supplier.calculation.freightPerUnit)}/{currentCategory.unit}
                        </span>
                      </td>

                      {/* GST */}
                      <td className="py-4 px-3 font-mono text-ink-secondary">
                        {formatPercent(supplier.gstRate)}
                      </td>

                      {/* True Landed Cost */}
                      <td className="py-4 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`font-mono text-base font-bold tabular-nums ${
                              isBest ? "text-coral text-lg" : "text-ink"
                            }`}
                          >
                            {formatRupees(supplier.calculation.landedPerUnit)}
                          </span>
                          {isBest && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-coral text-white text-xs font-heading font-bold shadow-sm">
                              <Award size={12} />
                              Best landed cost
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-ink-secondary mt-0.5">
                          Total: {formatRupees(supplier.calculation.totalCost)}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Dramatization & Savings Callout Banner */}
          {savingsAnalysis && !savingsAnalysis.isSame && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 rounded-2xl bg-surface-pink border border-[rgba(241,106,90,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-coral text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Info size={16} />
                </div>
                <div>
                  <div className="text-sm font-heading font-bold text-ink">
                    Sticker Price Illusion Unmasked
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5 max-w-[60ch]">
                    {savingsAnalysis.stickerName} offers the lowest unit sticker,
                    yet {savingsAnalysis.bestName} saves you{" "}
                    <strong className="text-coral">
                      {formatRupees(savingsAnalysis.diffPerUnit)} per {currentCategory.unit}
                    </strong>{" "}
                    due to lower transport. That is a net savings of{" "}
                    <strong className="text-coral">
                      {formatRupees(savingsAnalysis.totalSavings)}
                    </strong>{" "}
                    on this batch.
                  </p>
                </div>
              </div>

              <a href="#contact" className="flex-shrink-0 w-full sm:w-auto">
                <Button variant="coral" size="sm" className="w-full">
                  Lock this quote
                </Button>
              </a>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
