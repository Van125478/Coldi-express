import assert from "node:assert/strict";
import test from "node:test";
import { nextComparison } from "../../web/src/features/shipments/comparison.ts";
import { assignedDriverLine, cargoMeasures, stopFacts } from "../../web/src/features/workspace/carrier/carrierCopy.ts";
import { logoDestination } from "../../web/src/features/workspace/logoDestination.ts";

test("workspace logo returns each role to its own home", () => {
  assert.equal(logoDestination(null), "/");
  assert.equal(logoDestination("SHIPPER"), "/shipper");
  assert.equal(logoDestination("CARRIER"), "/carrier");
  assert.equal(logoDestination("DRIVER"), "/driver");
  assert.equal(logoDestination("ADMIN"), "/admin");
});

test("carrier detail copy groups missing measures and does not repeat the driver role", () => {
  assert.equal(cargoMeasures(null, null, null), "Chưa cập nhật khối lượng, thể tích và số kiện.");
  assert.equal(cargoMeasures(2.5, null, 12), "2.5 tấn · 12 thùng. Chưa cập nhật thể tích.");
  assert.equal(cargoMeasures(2.5, 8, 12), "2.5 tấn · 8 m³ · 12 thùng");
  assert.equal(assignedDriverLine("Tài xế demo"), "Tài xế demo");
  assert.equal(assignedDriverLine("Minh"), "Tài xế Minh");
  assert.equal(assignedDriverLine("  "), "Tài xế đã phân công");
  assert.equal(stopFacts("Chưa có", "Chưa có").gap, "Chưa cập nhật lịch và liên hệ.");
  const scheduled = stopFacts("20/10/2026, 08:00–10:00", "Chưa có");
  assert.equal(scheduled.schedule, "20/10/2026, 08:00–10:00");
  assert.equal(scheduled.gap, "Chưa cập nhật liên hệ.");
});

test("comparison keeps at most two shipments and does not claim", () => {
  const first = nextComparison([], "a");
  assert.deepEqual(first.selected, ["a"]);
  assert.equal(first.note, null);
  const second = nextComparison(first.selected, "b");
  assert.deepEqual(second.selected, ["a", "b"]);
  const blocked = nextComparison(second.selected, "c");
  assert.deepEqual(blocked.selected, ["a", "b"]);
  assert.match(blocked.note ?? "", /hai chuyến/);
  assert.deepEqual(nextComparison(second.selected, "a").selected, ["b"]);
});
