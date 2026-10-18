import assert from "node:assert/strict";
import test from "node:test";
import { CommissionInputError, quoteBothSides, roundHalfUpFee } from "../src/commission/money.js";

test("COM-T01 rounds each side before adding", () => {
  const quote = quoteBothSides(10_000_000, 500, 400);
  assert.deepEqual(quote, {
    shipperFeeVnd: 500_000,
    carrierFeeVnd: 400_000,
    shipperTotalVnd: 10_500_000,
    carrierNetVnd: 9_600_000,
    platformGrossEstimateVnd: 900_000,
    paymentCollected: false,
  });
});

test("COM-T02 half-up at 3.5 percent", () => {
  assert.equal(roundHalfUpFee(1_000_100, 350), 35_004);
});

test("COM-T03 half-up from one half dong rounds away from zero", () => {
  assert.equal(roundHalfUpFee(10, 500), 1);
});

test("COM-T04 a remainder under half a dong rounds down", () => {
  assert.equal(roundHalfUpFee(9, 500), 0);
});

test("COM-T05 100 VND at 350 bps rounds half-up to 4", () => {
  assert.equal(roundHalfUpFee(100, 350), 4);
});

test("COM-T06 rejects unsafe, fractional, negative and empty money inputs", () => {
  for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, "1000"]) {
    assert.throws(() => roundHalfUpFee(value as number, 500), CommissionInputError);
  }
  for (const value of [-1, 10_001, 3.5, Number.NaN, "500"]) {
    assert.throws(() => roundHalfUpFee(10_000, value as number), CommissionInputError);
  }
});

test("COM-T07 does not share one rate across the two sides", () => {
  const quote = quoteBothSides(10_000_000, 350, 500);
  assert.equal(quote.shipperFeeVnd, 350_000);
  assert.equal(quote.carrierFeeVnd, 500_000);
  assert.notEqual(quote.shipperFeeVnd, quote.carrierFeeVnd);
});
