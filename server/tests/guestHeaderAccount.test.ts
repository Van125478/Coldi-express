import assert from "node:assert/strict";
import test from "node:test";
import { guestAccountAction } from "../../web/src/features/guest/guestHeaderAccount.ts";

test("the public header sends each signed-in role home and does not offer registration", () => {
  assert.deepEqual(guestAccountAction(null), { kind: "login", href: "/dang-nhap", label: "Đăng nhập" });
  assert.equal(guestAccountAction("SHIPPER").href, "/shipper");
  assert.equal(guestAccountAction("CARRIER").href, "/carrier");
  assert.equal(guestAccountAction("DRIVER").href, "/driver");
  assert.equal(guestAccountAction("ADMIN").href, "/admin");
  assert.equal(guestAccountAction("CARRIER").label, "Vào khu làm việc");
});
