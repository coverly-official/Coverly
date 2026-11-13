export type LandedCostInput = {
  unitPrice: number;
  quantity: number;
  gstRate: number;
  freight: number;
};

export type LandedCostResult = {
  landedPerUnit: number;
  totalCost: number;
  gstAmount: number;
  freightPerUnit: number;
};

/**
 * Calculate the true landed cost per unit.
 * landed_per_unit = (unit_price * qty * (1 + gst) + freight) / qty
 */
export function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const unitPrice = Number.isFinite(input.unitPrice) ? Math.max(0, input.unitPrice) : 0;
  const quantity = Number.isFinite(input.quantity) ? Math.max(0, input.quantity) : 0;
  const freight = Number.isFinite(input.freight) ? Math.max(0, input.freight) : 0;
  const gstRate = Number.isFinite(input.gstRate) ? Math.max(0, input.gstRate) : 0;

  const normalizedGstRate = gstRate > 1 ? gstRate / 100 : gstRate;
  const subtotal = unitPrice * quantity;
  const gstAmount = subtotal * normalizedGstRate;
  const totalCost = subtotal + gstAmount + freight;
  const landedPerUnit = quantity > 0 ? totalCost / quantity : 0;
  const freightPerUnit = quantity > 0 ? freight / quantity : 0;

  return {
    landedPerUnit: Number.isFinite(landedPerUnit) ? Math.round(landedPerUnit * 100) / 100 : 0,
    totalCost: Number.isFinite(totalCost) ? Math.round(totalCost * 100) / 100 : 0,
    gstAmount: Number.isFinite(gstAmount) ? Math.round(gstAmount * 100) / 100 : 0,
    freightPerUnit: Number.isFinite(freightPerUnit) ? Math.round(freightPerUnit * 100) / 100 : 0,
  };
}
