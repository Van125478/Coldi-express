import assert from "node:assert/strict";
import test from "node:test";
import { chooseDestination, isAssignableDriver, needsPasswordChange, validateDriverDraft, validateReplacementPassword } from "../../web/src/features/auth/driverAccountRules.ts";

test("driver creation form rejects a blank name and an invalid email", () => {
  assert.equal(validateDriverDraft("", "driver@coldi.local"), "Tên hiển thị cần từ 1 đến 80 ký tự.");
  assert.equal(validateDriverDraft("Tài xế", "khong-phai-email"), "Email đăng nhập không hợp lệ.");
  assert.equal(validateDriverDraft("Tài xế", "driver@coldi.local"), null);
});

test("a temporary-password driver is sent to the change screen and cannot be assigned", () => {
  const user = { role: "DRIVER" as const, mustChangePassword: true };
  const paths = {
    password: "/driver/doi-mat-khau",
    home: (role: "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN") => (role === "CARRIER" ? "/carrier" : "/driver"),
    owns: () => true,
  };
  assert.equal(needsPasswordChange(user), true);
  assert.equal(chooseDestination(user, "/driver/chuyen", paths), "/driver/doi-mat-khau");
  assert.equal(chooseDestination({ role: "CARRIER", mustChangePassword: false }, null, paths), "/carrier");
  assert.equal(isAssignableDriver({ accountStatus: "LOCKED", mustChangePassword: false }), false);
  assert.equal(isAssignableDriver({ mustChangePassword: true }), false);
  assert.equal(isAssignableDriver({}), true);
  assert.equal(validateReplacementPassword("short"), "Mật khẩu cần từ 8 đến 72 ký tự.");
  assert.equal(validateReplacementPassword("long-enough"), null);
});
