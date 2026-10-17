import assert from "node:assert/strict";
import test from "node:test";
import { nextComparison } from "../../web/src/features/shipments/comparison.ts";
import { logoDestination } from "../../web/src/features/workspace/logoDestination.ts";

test("workspace logo returns each role to its own home", () => {
  assert.equal(logoDestination(null), "/");
  assert.equal(logoDestination("SHIPPER"), "/shipper");
  assert.equal(logoDestination("CARRIER"), "/carrier");
  assert.equal(logoDestination("DRIVER"), "/driver");
  assert.equal(logoDestination("ADMIN"), "/admin");
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
