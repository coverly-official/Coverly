import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateLandedCost, roundToTwoDecimals } from "../src/lib/landed-cost.js";

describe("Smart Landed Cost Engine Tests", () => {
  it("calculates basic landed cost accurately with 18% GST", () => {
    const res = calculateLandedCost({
      quantity: 100,
      unitPrice: 50,
      gstRate: 0.18,
      freight: 500,
    });

    assert.equal(res.baseAmount, 5000);
    assert.equal(res.discount, 0);
    assert.equal(res.taxableAmount, 5000);
    assert.equal(res.gstAmount, 900);
    assert.equal(res.freight, 500);
    assert.equal(res.totalLandedCost, 6400);
    assert.equal(res.effectiveLandedUnitCost, 64);
    assert.equal(res.isEstimate, true);
  });

  it("handles percentage input for GST rate (e.g. 18 instead of 0.18)", () => {
    const res = calculateLandedCost({
      quantity: 10,
      unitPrice: 100,
      gstRate: 18, // should be normalized to 0.18
      freight: 100,
    });

    assert.equal(res.gstRate, 0.18);
    assert.equal(res.gstAmount, 180);
    assert.equal(res.totalLandedCost, 1280);
    assert.equal(res.effectiveLandedUnitCost, 128);
  });

  it("applies discounts before calculating GST taxable amount", () => {
    const res = calculateLandedCost({
      quantity: 10,
      unitPrice: 200, // base 2000
      discount: 200,  // discount 200 -> taxable 1800
      gstRate: 0.18,  // 18% of 1800 = 324
      freight: 150,
      packaging: 50,
      insurance: 26,
    });

    assert.equal(res.baseAmount, 2000);
    assert.equal(res.discount, 200);
    assert.equal(res.taxableAmount, 1800);
    assert.equal(res.gstAmount, 324);
    assert.equal(res.packaging, 50);
    assert.equal(res.freight, 150);
    assert.equal(res.insurance, 26);
    assert.equal(res.totalLandedCost, 2350);
    assert.equal(res.effectiveLandedUnitCost, 235);
  });

  it("prevents negative values and handles zero quantities safely", () => {
    const res = calculateLandedCost({
      quantity: -5,
      unitPrice: -100,
      freight: -50,
    });

    assert.equal(res.baseAmount, 0);
    assert.equal(res.freight, 0);
    assert.equal(res.totalLandedCost, 0);
    assert.equal(res.effectiveLandedUnitCost, 0);
  });

  it("rounds decimal numbers to two places accurately", () => {
    const rounded = roundToTwoDecimals(123.456);
    assert.equal(rounded, 123.46);

    const res = calculateLandedCost({
      quantity: 3,
      unitPrice: 33.33,
      gstRate: 0.18,
    });

    // 3 * 33.33 = 99.99
    // GST = 99.99 * 0.18 = 17.9982 -> 18.00
    // Total = 117.99
    // Per unit = 117.99 / 3 = 39.33
    assert.equal(res.baseAmount, 99.99);
    assert.equal(res.gstAmount, 18);
    assert.equal(res.totalLandedCost, 117.99);
    assert.equal(res.effectiveLandedUnitCost, 39.33);
  });
});
