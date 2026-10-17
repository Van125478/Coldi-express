import assert from "node:assert/strict";
import test from "node:test";
import { followedShipment, shipperBucket } from "../../web/src/features/workspace/shipper/shipperGroups.ts";

test("shipper groups keep the canonical statuses and do not invent completed", () => {
  assert.equal(shipperBucket("PUBLISHED"), "published");
  assert.equal(shipperBucket("MATCHED"), "matched");
  assert.equal(shipperBucket("IN_TRANSIT"), "transit");
  assert.equal(shipperBucket("DELIVERY_CONFIRMED"), "delivered");
  assert.equal(shipperBucket("COMPLETED"), "other");
});

test("the followed shipment prefers a real trip in transit", () => {
  const items = [
    { id: "open", status: "PUBLISHED" },
    { id: "claimed", status: "MATCHED" },
    { id: "moving", status: "IN_TRANSIT" },
  ];
  assert.equal(followedShipment(items)?.id, "moving");
  assert.equal(followedShipment(items.filter((item) => item.status !== "IN_TRANSIT"))?.id, "claimed");
  assert.equal(followedShipment([{ id: "open", status: "PUBLISHED" }]), null);
});
