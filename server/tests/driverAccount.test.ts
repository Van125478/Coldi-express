import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { withRequiredCargoImage } from "./support/cargoImage.js";
import { AuditLog } from "../src/models/auditLog.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_driver_account_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.driver-account@coldi.local";
const carrierEmail = "carrier.driver-account@coldi.local";
const otherCarrierEmail = "other.driver-account@coldi.local";
const adminEmail = "admin.driver-account@coldi.local";
const driverEmail = "driver.driver-account@coldi.local";
const orphanEmail = "orphan.driver-account@coldi.local";

type Json = Record<string, unknown>;

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Test server did not bind.");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

function headers(cookie?: string, body = false) {
  return {
    origin: "http://127.0.0.1:5173",
    ...(body ? { "content-type": "application/json" } : {}),
    ...(cookie ? { cookie } : {}),
  };
}

async function login(baseUrl: string, email: string, secret = password): Promise<{ status: number; cookie: string; body: Json }> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: headers(undefined, true),
    body: JSON.stringify({ email, password: secret }),
  });
  const body = (await response.json()) as Json;
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("coldi_session="))?.split(";")[0] ?? "";
  return { status: response.status, cookie, body };
}

async function send(baseUrl: string, path: string, cookie: string | undefined, method: string, body?: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: headers(cookie, body !== undefined),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: (await response.json()) as Json };
}

async function publishAndClaim(baseUrl: string, shipper: string, carrier: string) {
  const published = await send(baseUrl, "/api/shipments", shipper, "POST", await withRequiredCargoImage(baseUrl, shipper, {
    cargoDescription: "Hàng kiểm tra tài khoản tài xế",
    pickupLocation: "Kho A, Cái Bè",
    deliveryLocation: "Kho B, Thủ Đức",
    temperatureGroup: "FROZEN",
    vehicleRequirement: "Xe đông lạnh",
    listedPriceVnd: 5000000,
    pickupCompany: "Kho A",
    pickupContactName: "Người lấy",
    pickupPhone: "0908000111",
    pickupDate: "2026-10-22",
    pickupTimeFrom: "08:00",
    pickupTimeTo: "10:00",
    deliveryCompany: "Kho B",
    deliveryContactName: "Người nhận",
    deliveryPhone: "0912000111",
    deliveryDate: "2026-10-23",
    deliveryTimeFrom: "14:00",
    deliveryTimeTo: "16:00",
    cargoWeightTon: 1,
    cargoVolumeM3: 2,
    packageCount: 10,
  }));
  assert.equal(published.status, 201);
  const id = String((published.body.shipment as Json).id);
  const claimed = await send(baseUrl, `/api/carrier/shipments/${id}/claim`, carrier, "POST", {});
  assert.equal(claimed.status, 200);
  return id;
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_driver_account_test") throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  await mongoose.connection.dropDatabase();
  await User.syncIndexes();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe A" });
  const other = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe B" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng" },
    { email: adminEmail, passwordHash, role: "ADMIN", displayName: "Quản trị" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế sẵn" },
    { email: orphanEmail, passwordHash, role: "DRIVER", displayName: "Tài xế chưa gắn" },
  ]);
  await Vehicle.create({ carrierId: carrier._id, label: "Xe tài khoản", plate: "51C-19001", vehicleKind: "REEFER_TRUCK", temperatureGroup: "FROZEN", capacityTon: 5 });
  await Vehicle.create({ carrierId: other._id, label: "Xe nhà khác", plate: "50C-19002", vehicleKind: "REEFER_TRUCK", temperatureGroup: "FROZEN", capacityTon: 5 });
});

after(async () => {
  if (mongoose.connection.name === "coldi_driver_account_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("a carrier creates a driver from the session and a forged parent is rejected", async () => {
  await withServer(async (baseUrl) => {
    const carrier = (await login(baseUrl, carrierEmail)).cookie;
    const other = (await login(baseUrl, otherCarrierEmail)).cookie;
    const shipper = (await login(baseUrl, shipperEmail)).cookie;
    const driver = (await login(baseUrl, driverEmail)).cookie;
    const admin = (await login(baseUrl, adminEmail)).cookie;
    const created = await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "POST", {
      displayName: "Tài xế mới",
      email: "new.driver-account@coldi.local",
      carrierId: String((await User.findOne({ email: otherCarrierEmail }))?._id),
      role: "CARRIER",
      password: "chosen-by-carrier",
    });
    assert.equal(created.status, 400);

    const blank = await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "POST", { displayName: "", username: "", password: "", confirmPassword: "khac" });
    assert.equal(blank.status, 400);
    const blankFields = (blank.body.error as Json).fields as Json;
    assert.equal(typeof blankFields.displayName, "string");
    assert.equal(typeof blankFields.username, "string");
    assert.equal(typeof blankFields.password, "string");
    assert.equal(typeof blankFields.confirmPassword, "string");

    const chosenPassword = "carrier-set-password";
    const accepted = await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "POST", {
      displayName: "Tài xế mới",
      username: "  TaiXe.Moi ",
      password: chosenPassword,
      confirmPassword: chosenPassword,
    });
    assert.equal(accepted.status, 201);
    assert.equal("temporaryPassword" in accepted.body, false);
    const rosterDriver = accepted.body.driver as Json;
    assert.equal(rosterDriver.role, undefined);
    assert.equal(rosterDriver.username, "taixe.moi");
    const stored = await User.findOne({ username: "taixe.moi" });
    assert.ok(stored);
    assert.equal(stored.role, "DRIVER");
    assert.equal(stored.email, undefined);
    assert.equal(stored.carrierId?.toString(), String((await User.findOne({ email: carrierEmail }))?._id));
    assert.equal(stored.mustChangePassword, false);
    assert.notEqual(stored.passwordHash, chosenPassword);
    assert.match(stored.passwordHash, /^\$2[aby]\$/);

    const duplicate = await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "POST", {
      displayName: "Trùng",
      username: "taixe.moi",
      password: chosenPassword,
      confirmPassword: chosenPassword,
    });
    assert.equal(duplicate.status, 409);
    const invalid = await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "POST", {
      displayName: "Sai",
      username: "khong hop le",
      password: "short",
      confirmPassword: "other-password",
    });
    assert.equal(invalid.status, 400);
    assert.equal((await send(baseUrl, "/api/carrier/fleet/drivers", shipper, "POST", { displayName: "X", username: "shipper.driver", password: chosenPassword, confirmPassword: chosenPassword })).status, 403);
    assert.equal((await send(baseUrl, "/api/carrier/fleet/drivers", driver, "POST", { displayName: "X", username: "driver.driver", password: chosenPassword, confirmPassword: chosenPassword })).status, 403);
    assert.equal((await send(baseUrl, "/api/carrier/fleet/drivers", admin, "POST", { displayName: "X", username: "admin.driver", password: chosenPassword, confirmPassword: chosenPassword })).status, 403);

    const roster = await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "GET");
    const detail = await send(baseUrl, `/api/carrier/fleet/drivers/${stored._id.toString()}`, carrier, "GET");
    const audits = await AuditLog.find({ resourceId: stored._id }).lean();
    const leaked = JSON.stringify({ roster, detail, audits, accepted: accepted.body });
    assert.equal(leaked.includes(chosenPassword), false);
    assert.equal(leaked.includes(stored.passwordHash), false);
    const otherNames = ((await send(baseUrl, "/api/carrier/fleet/drivers", other, "GET")).body.drivers as Json[]).map((item) => item.username);
    assert.equal(otherNames.includes("taixe.moi"), false);
    assert.equal((await send(baseUrl, `/api/carrier/fleet/drivers/${stored._id.toString()}`, other, "GET")).status, 404);

    const legacy = await login(baseUrl, driverEmail);
    assert.equal(legacy.status, 200);
    const activated = await login(baseUrl, "taixe.moi", chosenPassword);
    assert.equal(activated.status, 200);
    assert.equal((activated.body.user as Json).mustChangePassword, false);
    assert.equal((await send(baseUrl, "/api/driver/shipments", activated.cookie, "GET")).status, 200);
    assert.equal((await login(baseUrl, carrierEmail, chosenPassword)).status, 401);
  });
});

test("lock, unlock, reset and active trips stay on the owning carrier", async () => {
  await withServer(async (baseUrl) => {
    const carrier = (await login(baseUrl, carrierEmail)).cookie;
    const other = (await login(baseUrl, otherCarrierEmail)).cookie;
    const shipper = (await login(baseUrl, shipperEmail)).cookie;
    const chosenPassword = "idle-driver-password";
    const created = await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "POST", {
      displayName: "Tài xế khóa",
      username: "taixe.khoa",
      password: chosenPassword,
      confirmPassword: chosenPassword,
    });
    const idleId = String((created.body.driver as Json).id);
    const session = await login(baseUrl, "taixe.khoa", chosenPassword);

    const locked = await send(baseUrl, `/api/carrier/fleet/drivers/${idleId}/lock`, carrier, "POST", {});
    assert.equal(locked.status, 200);
    assert.equal((locked.body.driver as Json).accountStatus, "LOCKED");
    assert.equal((await login(baseUrl, "taixe.khoa", chosenPassword)).status, 403);
    assert.equal((await send(baseUrl, "/api/auth/me", session.cookie, "GET")).status, 401);
    const unlocked = await send(baseUrl, `/api/carrier/fleet/drivers/${idleId}/unlock`, carrier, "POST", {});
    assert.equal(unlocked.status, 200);
    assert.equal((await login(baseUrl, "taixe.khoa", chosenPassword)).status, 200);

    const nextPassword = "reset-driver-password";
    const reset = await send(baseUrl, `/api/carrier/fleet/drivers/${idleId}/reset-password`, carrier, "POST", { password: nextPassword, confirmPassword: nextPassword });
    assert.equal(reset.status, 200);
    assert.equal(JSON.stringify(reset.body).includes(nextPassword), false);
    assert.equal(JSON.stringify(reset.body).includes("passwordHash"), false);
    assert.equal((reset.body.driver as Json).mustChangePassword, false);
    assert.equal((await login(baseUrl, "taixe.khoa", chosenPassword)).status, 401);
    assert.equal((await send(baseUrl, "/api/auth/me", session.cookie, "GET")).status, 401);
    const resetLogin = await login(baseUrl, "taixe.khoa", nextPassword);
    assert.equal(resetLogin.status, 200);
    assert.equal((resetLogin.body.user as Json).mustChangePassword, false);
    assert.equal((await send(baseUrl, "/api/driver/shipments", resetLogin.cookie, "GET")).status, 200);
    assert.equal((await send(baseUrl, `/api/carrier/fleet/drivers/${idleId}/reset-password`, other, "POST", { password: nextPassword, confirmPassword: nextPassword })).status, 404);

    const ready = await User.findById(idleId);
    assert.ok(ready);
    ready.mustChangePassword = false;
    ready.passwordHash = await hashPassword(password);
    await ready.save();
    const vehicle = await Vehicle.findOne({ label: "Xe tài khoản" });
    assert.ok(vehicle);
    const matchedId = await publishAndClaim(baseUrl, shipper, carrier);
    const assigned = await send(baseUrl, `/api/carrier/shipments/${matchedId}/assign`, carrier, "POST", { vehicleId: vehicle._id.toString(), driverId: idleId });
    assert.equal(assigned.status, 200);
    const matchedLock = await send(baseUrl, `/api/carrier/fleet/drivers/${idleId}/lock`, carrier, "POST", {});
    assert.equal(matchedLock.status, 409);
    assert.equal((await User.findById(idleId))?.accountStatus, "ACTIVE");
    assert.equal((await login(baseUrl, "taixe.khoa")).status, 200);
    const driverCookie = (await login(baseUrl, "taixe.khoa")).cookie;
    assert.equal((await send(baseUrl, `/api/driver/shipments/${matchedId}/pickup`, driverCookie, "POST", {})).status, 200);
    assert.equal((await send(baseUrl, `/api/carrier/fleet/drivers/${idleId}/lock`, carrier, "POST", {})).status, 409);
    assert.equal((await send(baseUrl, `/api/carrier/fleet/drivers/${idleId}/reset-password`, carrier, "POST", {})).status, 409);
    assert.equal((await User.findById(idleId))?.accountStatus, "ACTIVE");

    const orphan = await User.findOne({ email: orphanEmail });
    assert.ok(orphan);
    const rosterEmails = ((await send(baseUrl, "/api/carrier/fleet/drivers", carrier, "GET")).body.drivers as Json[]).map((item) => item.email);
    assert.equal(rosterEmails.includes(orphanEmail), false);
    assert.equal((await send(baseUrl, `/api/carrier/fleet/drivers/${orphan._id.toString()}/lock`, carrier, "POST", {})).status, 404);
    const secondId = await publishAndClaim(baseUrl, shipper, carrier);
    assert.equal((await send(baseUrl, `/api/carrier/shipments/${secondId}/assign`, carrier, "POST", { vehicleId: vehicle._id.toString(), driverId: orphan._id.toString() })).status, 400);
  });
});

test("concurrent lock and assignment cannot leave a locked driver on an active trip", async () => {
  await withServer(async (baseUrl) => {
    const carrierUser = await User.findOne({ email: carrierEmail });
    const carrier = (await login(baseUrl, carrierEmail)).cookie;
    const shipper = (await login(baseUrl, shipperEmail)).cookie;
    assert.ok(carrierUser);
    const passwordHash = (await User.findOne({ email: driverEmail }))?.passwordHash;
    assert.ok(passwordHash);
    const shipmentIds: string[] = [];
    for (let index = 0; index < 8; index += 1) shipmentIds.push(await publishAndClaim(baseUrl, shipper, carrier));
    for (let index = 0; index < 8; index += 1) {
      const driver = await User.create({
        email: `race-${index}.driver-account@coldi.local`,
        passwordHash,
        role: "DRIVER",
        carrierId: carrierUser._id,
        displayName: `Tài xế đua ${index}`,
        accountStatus: "ACTIVE",
        mustChangePassword: false,
      });
      const vehicle = await Vehicle.create({ carrierId: carrierUser._id, label: `Xe đua tài khoản ${index}` });
      const shipmentId = shipmentIds[index];
      assert.ok(shipmentId);
      const [lockResult, assignResult] = await Promise.all([
        send(baseUrl, `/api/carrier/fleet/drivers/${driver._id.toString()}/lock`, carrier, "POST", {}),
        send(baseUrl, `/api/carrier/shipments/${shipmentId}/assign`, carrier, "POST", { vehicleId: vehicle._id.toString(), driverId: driver._id.toString() }),
      ]);
      const stored = await User.findById(driver._id);
      const shipment = await Shipment.findById(shipmentId);
      const locked = stored?.accountStatus === "LOCKED";
      const active = shipment?.driverId?.toString() === driver._id.toString() && (shipment.status === "MATCHED" || shipment.status === "IN_TRANSIT");
      assert.equal(locked && active, false);
      assert.equal(lockResult.status === 200 && assignResult.status === 200, false);
    }
  });
});
