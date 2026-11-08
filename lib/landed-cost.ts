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
  const { unitPrice, quantity, gstRate, freight } = input;

  const subtotal = unitPrice * quantity;
  const gstAmount = subtotal * gstRate;
  const totalCost = subtotal + gstAmount + freight;
  const landedPerUnit = totalCost / quantity;
  const freightPerUnit = freight / quantity;

  return {
    landedPerUnit: Math.round(landedPerUnit * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    freightPerUnit: Math.round(freightPerUnit * 100) / 100,
  };
}
