import { describe, it, expect } from "vitest";
import { calculateLandedCost } from "./landed-cost";

describe("calculateLandedCost", () => {
  it("calculates correctly for Tiruppur Knits at qty 500", () => {
    const result = calculateLandedCost({
      unitPrice: 212,
      quantity: 500,
      gstRate: 0.05,
      freight: 3200,
    });
    // (212 * 500 * 1.05 + 3200) / 500 = 114500 / 500 = 229
    expect(result.landedPerUnit).toBe(229);
    expect(result.totalCost).toBe(114500);
  });

  it("calculates correctly for Surat Textile Hub at qty 500", () => {
    const result = calculateLandedCost({
      unitPrice: 196,
      quantity: 500,
      gstRate: 0.05,
      freight: 9800,
    });
    // (196 * 500 * 1.05 + 9800) / 500 = 112700 / 500 = 225.4
    expect(result.landedPerUnit).toBe(225.4);
  });

  it("calculates correctly for Ludhiana Garments at qty 500", () => {
    const result = calculateLandedCost({
      unitPrice: 205,
      quantity: 500,
      gstRate: 0.05,
      freight: 2400,
    });
    // (205 * 500 * 1.05 + 2400) / 500 = 110025 / 500 = 220.05
    expect(result.landedPerUnit).toBe(220.05);
  });

  it("proves lowest sticker price is NOT lowest landed cost", () => {
    const ludhiana = calculateLandedCost({
      unitPrice: 205,
      quantity: 500,
      gstRate: 0.05,
      freight: 2400,
    });
    const surat = calculateLandedCost({
      unitPrice: 196,
      quantity: 500,
      gstRate: 0.05,
      freight: 9800,
    });

    // Surat has the lowest sticker price
    expect(196).toBeLessThan(205);
    // But Ludhiana has the lowest landed cost
    expect(ludhiana.landedPerUnit).toBeLessThan(surat.landedPerUnit);
  });

  it("handles zero freight", () => {
    const result = calculateLandedCost({
      unitPrice: 100,
      quantity: 10,
      gstRate: 0.18,
      freight: 0,
    });
    expect(result.landedPerUnit).toBe(118);
    expect(result.freightPerUnit).toBe(0);
  });

  it("returns correct GST breakdown", () => {
    const result = calculateLandedCost({
      unitPrice: 200,
      quantity: 100,
      gstRate: 0.18,
      freight: 1000,
    });
    expect(result.gstAmount).toBe(3600);
    expect(result.totalCost).toBe(24600);
  });
});
