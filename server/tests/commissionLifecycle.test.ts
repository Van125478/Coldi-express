import assert from "node:assert/strict";
import test from "node:test";
import { effectiveFee, holdAccrued, releaseHold, voidEstimated } from "../src/commission/lifecycle.js";
import { commissionRuntimeError, commissionSimulationAllowed, packageRuntimeError } from "../src/config/env.js";

test("void keeps an absent side absent and voids only an estimate", () => {
  assert.equal(voidEstimated("ABSENT"), "ABSENT");
  assert.equal(voidEstimated("ESTIMATED"), "VOID");
  assert.throws(() => voidEstimated("ACCRUED"));
  assert.throws(() => voidEstimated("ON_HOLD"));
});

test("hold and release stay on the accrued side", () => {
  assert.equal(holdAccrued("ACCRUED"), "ON_HOLD");
  assert.equal(releaseHold("ON_HOLD"), "ACCRUED");
  assert.throws(() => holdAccrued("ESTIMATED"));
  assert.throws(() => releaseHold("ACCRUED"));
});

test("COM-T21 and COM-T22 and COM-T23 adjust from the original accrual without going negative", () => {
  const once = effectiveFee(500_000, [{ payerSide: "SHIPPER", deltaVnd: -100_000, idempotencyKey: "adj-1" }], "SHIPPER");
  assert.equal(once, 400_000);
  const duplicated = effectiveFee(
    500_000,
    [
      { payerSide: "SHIPPER", deltaVnd: -100_000, idempotencyKey: "adj-1" },
      { payerSide: "SHIPPER", deltaVnd: -100_000, idempotencyKey: "adj-1" },
    ],
    "SHIPPER",
  );
  assert.equal(duplicated, 400_000);
  assert.throws(() => effectiveFee(500_000, [{ payerSide: "SHIPPER", deltaVnd: -600_000, idempotencyKey: "adj-2" }], "SHIPPER"));
  assert.throws(() => effectiveFee(500_000, [{ payerSide: "SHIPPER", deltaVnd: 1.5, idempotencyKey: "adj-3" }], "SHIPPER"));
  const otherSide = effectiveFee(500_000, [{ payerSide: "CARRIER", deltaVnd: -100_000, idempotencyKey: "adj-1" }], "SHIPPER");
  assert.equal(otherSide, 500_000);
});

test("COM-T28 and COM-T29 production commission simulation fails closed", () => {
  const base = {
    deploymentId: "commission-qa",
    authorizedDeploymentId: "commission-qa",
    databaseName: "coldi_commission_qa",
  };
  assert.match(
    commissionRuntimeError({ nodeEnv: "production", runtimeMode: "production", commissionFlag: true, ...base }) ?? "",
    /Production cannot enable commission simulation/,
  );
  assert.match(
    commissionRuntimeError({ nodeEnv: "test", runtimeMode: "production", commissionFlag: true, ...base }) ?? "",
    /Production cannot enable commission simulation/,
  );
  assert.equal(commissionSimulationAllowed({ nodeEnv: "production", runtimeMode: "qa", commissionFlag: true, ...base }), false);
  assert.match(commissionRuntimeError({ nodeEnv: "test", runtimeMode: "qa", commissionFlag: true, ...base, databaseName: "coldi" }) ?? "", /disposable database/);
  assert.match(
    commissionRuntimeError({
      nodeEnv: "test",
      runtimeMode: "qa",
      commissionFlag: true,
      deploymentId: "short",
      authorizedDeploymentId: "commission-qa",
      databaseName: "coldi_commission_qa",
    }) ?? "",
    /matching COMMISSION_SIMULATION_DEPLOYMENT_ID/,
  );
  assert.equal(
    commissionRuntimeError({ nodeEnv: "test", runtimeMode: "development", commissionFlag: true, ...base }),
    "Commission simulation requires APP_RUNTIME_MODE=qa or demo.",
  );
  assert.equal(commissionRuntimeError({ nodeEnv: "production", runtimeMode: "production", commissionFlag: false, ...base }), null);
  assert.equal(commissionSimulationAllowed({ nodeEnv: "test", runtimeMode: "qa", commissionFlag: true, ...base }), true);
  assert.match(
    packageRuntimeError({
      nodeEnv: "production",
      runtimeMode: "production",
      demoFlag: true,
      deploymentId: "commission-qa",
      authorizedDeploymentId: "commission-qa",
      databaseName: "coldi_commission_qa",
    }) ?? "",
    /Production cannot enable package demo/,
  );
});
