export interface LandedCostInput {
  quantity: number;
  unitPrice: number;
  discount?: number;
  packaging?: number;
  freight?: number;
  insurance?: number;
  otherCharges?: number;
  gstRate?: number;
}

export interface LandedCostResult {
  baseAmount: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  packaging: number;
  freight: number;
  insurance: number;
  otherCharges: number;
  totalLandedCost: number;
  effectiveLandedUnitCost: number;
  // Aliases for legacy compatibility
  totalCost: number;
  landedPerUnit: number;
  isEstimate: boolean;
}

/**
 * Decimal-safe rounding to 2 decimal places preventing floating-point drift.
 */
export function roundToTwoDecimals(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Production-ready Landed Cost Calculation Engine.
 * Reconciles base item costs, discounts, GST, logistics, packaging, and insurance.
 */
export function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const quantity = Math.max(1, Number.isFinite(input.quantity) ? input.quantity : 1);
  const unitPrice = Math.max(0, Number.isFinite(input.unitPrice) ? input.unitPrice : 0);
  const discountInput = Math.max(0, Number.isFinite(input.discount || 0) ? (input.discount || 0) : 0);
  const packaging = Math.max(0, Number.isFinite(input.packaging || 0) ? (input.packaging || 0) : 0);
  const freight = Math.max(0, Number.isFinite(input.freight || 0) ? (input.freight || 0) : 0);
  const insurance = Math.max(0, Number.isFinite(input.insurance || 0) ? (input.insurance || 0) : 0);
  const otherCharges = Math.max(0, Number.isFinite(input.otherCharges || 0) ? (input.otherCharges || 0) : 0);

  // Normalize GST: 18 -> 0.18, 0.18 -> 0.18
  const rawGst = Number.isFinite(input.gstRate || 0) ? (input.gstRate || 0) : 0.18;
  const gstRate = rawGst > 1 ? rawGst / 100 : Math.max(0, rawGst);

  const baseAmount = roundToTwoDecimals(quantity * unitPrice);
  const discount = Math.min(baseAmount, roundToTwoDecimals(discountInput));
  const taxableAmount = roundToTwoDecimals(baseAmount - discount);

  const gstAmount = roundToTwoDecimals(taxableAmount * gstRate);
  const totalLandedCost = roundToTwoDecimals(
    taxableAmount + gstAmount + packaging + freight + insurance + otherCharges
  );

  const effectiveLandedUnitCost = quantity > 0 ? roundToTwoDecimals(totalLandedCost / quantity) : totalLandedCost;

  return {
    baseAmount,
    discount,
    taxableAmount,
    gstRate,
    gstAmount,
    packaging: roundToTwoDecimals(packaging),
    freight: roundToTwoDecimals(freight),
    insurance: roundToTwoDecimals(insurance),
    otherCharges: roundToTwoDecimals(otherCharges),
    totalLandedCost,
    effectiveLandedUnitCost,
    totalCost: totalLandedCost,
    landedPerUnit: effectiveLandedUnitCost,
    isEstimate: true,
  };
}
