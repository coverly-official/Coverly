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

export function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const { unitPrice, quantity, gstRate, freight } = input;

  const subtotal = unitPrice * quantity;
  const gstAmount = subtotal * gstRate;
  const totalCost = subtotal + gstAmount + freight;
  const landedPerUnit = totalCost / quantity;
  const freightPerUnit = freight / quantity;

  return {
    landedPerUnit,
    totalCost,
    gstAmount,
    freightPerUnit
  };
}
