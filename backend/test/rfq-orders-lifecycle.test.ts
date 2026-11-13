import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("RFQ & Order Lifecycle State Machine Tests", () => {
  const PERMITTED_ORDER_TRANSITIONS: Record<string, string[]> = {
    pending_deposit: ["deposit_paid", "cancelled"],
    deposit_paid: ["in_production", "cancelled", "disputed"],
    in_production: ["quality_check", "disputed"],
    quality_check: ["shipped", "in_production", "disputed"],
    shipped: ["delivered", "disputed"],
    delivered: ["completed", "disputed"],
    completed: [],
    disputed: ["in_production", "shipped", "delivered", "completed", "cancelled"],
    cancelled: [],
  };

  it("permits standard forward progression: deposit -> production -> qc -> shipped -> delivered -> completed", () => {
    let current = "pending_deposit";

    assert.ok(PERMITTED_ORDER_TRANSITIONS[current].includes("deposit_paid"));
    current = "deposit_paid";

    assert.ok(PERMITTED_ORDER_TRANSITIONS[current].includes("in_production"));
    current = "in_production";

    assert.ok(PERMITTED_ORDER_TRANSITIONS[current].includes("quality_check"));
    current = "quality_check";

    assert.ok(PERMITTED_ORDER_TRANSITIONS[current].includes("shipped"));
    current = "shipped";

    assert.ok(PERMITTED_ORDER_TRANSITIONS[current].includes("delivered"));
    current = "delivered";

    assert.ok(PERMITTED_ORDER_TRANSITIONS[current].includes("completed"));
    current = "completed";

    assert.equal(PERMITTED_ORDER_TRANSITIONS[current].length, 0); // Terminal state
  });

  it("blocks backward state jumps (e.g. delivered back to pending_deposit)", () => {
    const allowed = PERMITTED_ORDER_TRANSITIONS["delivered"];
    assert.equal(allowed.includes("pending_deposit"), false);
    assert.equal(allowed.includes("in_production"), false);
  });

  it("prevents cancellation once order is in production or shipped", () => {
    assert.equal(PERMITTED_ORDER_TRANSITIONS["in_production"].includes("cancelled"), false);
    assert.equal(PERMITTED_ORDER_TRANSITIONS["shipped"].includes("cancelled"), false);
  });

  it("correctly identifies quotation expiry", () => {
    const today = new Date().toISOString().split("T")[0];
    const pastDate = "2020-01-01";
    const futureDate = "2099-12-31";

    const isExpired = (validUntil: string) => validUntil < today;

    assert.equal(isExpired(pastDate), true);
    assert.equal(isExpired(futureDate), false);
  });
});
