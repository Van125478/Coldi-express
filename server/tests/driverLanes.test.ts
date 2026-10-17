import assert from "node:assert/strict";
import test from "node:test";
import { compareDriverTrips, currentDriverTrip, driverActionLabel, driverCounts, driverLane, otherActionableTrips } from "../../web/src/features/workspace/driver/driverLanes.ts";

test("driver lanes follow persisted statuses and do not invent completed", () => {
  assert.equal(driverLane("MATCHED"), "pickup");
  assert.equal(driverLane("IN_TRANSIT"), "transit");
  assert.equal(driverLane("DELIVERY_CONFIRMED"), "delivered");
  assert.equal(driverLane("PUBLISHED"), "other");
  assert.equal(driverLane("COMPLETED"), "other");
});

test("the current driver trip prefers delivery, then pickup, and ignores delivered-only lists", () => {
  const items = [
    { id: "done", status: "DELIVERY_CONFIRMED", nextAction: "none" as const },
    { id: "wait", status: "MATCHED", nextAction: "pickup" as const },
    { id: "move", status: "IN_TRANSIT", nextAction: "delivery" as const },
  ];
  assert.deepEqual(driverCounts(items), { pickup: 1, transit: 1, delivered: 1 });
  assert.equal(currentDriverTrip(items)?.id, "move");
  assert.equal(currentDriverTrip(items.filter((item) => item.id !== "move"))?.id, "wait");
  assert.equal(currentDriverTrip([{ id: "done", status: "DELIVERY_CONFIRMED", nextAction: "none" as const }]), null);
  assert.deepEqual(items.slice().sort(compareDriverTrips).map((item) => item.id), ["wait", "move", "done"]);
  assert.equal(driverActionLabel("pickup"), "Xác nhận lấy hàng");
  assert.equal(driverActionLabel("none"), "Xem chi tiết chuyến");
  const current = currentDriverTrip(items);
  assert.deepEqual(
    otherActionableTrips(items, current).map((item) => item.id),
    ["wait"],
  );
  assert.deepEqual(otherActionableTrips(items.filter((item) => item.id === "move"), currentDriverTrip(items.filter((item) => item.id === "move"))), []);
});
