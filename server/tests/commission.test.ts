import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { accrueDeliveredShipment, quoteForAccount, reconcileCommissionOutbox } from "../src/commission/record.js";
import { HttpError } from "../src/middlewares/errorHandler.js";
import { AuditLog } from "../src/models/auditLog.js";
import { CommissionLedgerEvent, ledgerEventTypes } from "../src/models/commissionLedger.js";
import { AccountSubscription, PlanVersion } from "../src/models/package.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";
import { grantAuthorizedDemoContract } from "../src/packages/activation.js";
import { planByCode } from "../src/packages/catalog.js";
import { ensurePublishedCatalog } from "../src/packages/publishCatalog.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "qa";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "true";
process.env.PACKAGE_DEMO_DEPLOYMENT_ID = "commission-qa";
process.env.PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID = "commission-qa";
process.env.COMMISSION_SIMULATION_ENABLED = "true";
process.env.COMMISSION_SIMULATION_DEPLOYMENT_ID = "commission-qa";
process.env.COMMISSION_SIMULATION_AUTHORIZED_DEPLOYMENT_ID = "commission-qa";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_commission_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const databaseName = "coldi_commission_test";
const forbidden = new Set(["coldi", "admin", "local", "config"]);
const shipperEmail = "shipper.commission-test@coldi.local";
const shipperOtherEmail = "shipper-other.commission-test@coldi.local";
const shipperPlanEmail = "shipper-plan.commission-test@coldi.local";
const shipperEnterpriseEmail = "shipper-enterprise.commission-test@coldi.local";
const carrierEmail = "carrier.commission-test@coldi.local";
const carrierOtherEmail = "carrier-other.commission-test@coldi.local";
const carrierPlanEmail = "carrier-plan.commission-test@coldi.local";
const carrierCapEmail = "carrier-cap.commission-test@coldi.local";
const driverEmail = "driver.commission-test@coldi.local";
const adminEmail = "admin.commission-test@coldi.local";

type Json = Record<string, unknown>;
type Entry = {
  legacy: boolean;
  payerSide: string | null;
  status: string;
  baseFreightVnd: number | null;
  planCode: string | null;
  rateBps: number | null;
  feeVnd: number | null;
  settlementVnd: number | null;
  outboxStatus: string | null;
  ledger: { eventType: string; amountVnd: number; paymentCollected: boolean; simulation: boolean }[];
};

let shipperId = "";
let carrierId = "";
let carrierOtherId = "";
let carrierPlanId = "";
let driverId = "";
let adminId = "";
let vehicleId = "";

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

async function login(baseUrl: string, email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("coldi_session="));
  assert.ok(cookie);
  return cookie.split(";")[0] ?? "";
}

function headers(cookie: string, json = false, extra: Record<string, string> = {}): Record<string, string> {
  return { origin: "http://127.0.0.1:5173", cookie, ...(json ? { "content-type": "application/json" } : {}), ...extra };
}

function shipmentBody(cargoDescription: string, listedPriceVnd: number, extra: Json = {}) {
  return {
    cargoDescription,
    pickupLocation: "Cái Bè, Tiền Giang",
    deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
    temperatureGroup: "FROZEN",
    vehicleRequirement: "Xe đông lạnh 5 tấn",
    listedPriceVnd,
    pickupCompany: "Kho kiểm tra",
    pickupContactName: "Người lấy",
    pickupPhone: "0908123456",
    pickupEmail: "kho.gui@example.com",
    pickupDate: "2026-10-22",
    pickupTimeFrom: "08:00",
    pickupTimeTo: "11:30",
    deliveryCompany: "Kho giao",
    deliveryContactName: "Người nhận",
    deliveryPhone: "0912889999",
    deliveryEmail: "kho.nhan@example.com",
    deliveryDate: "2026-10-23",
    deliveryTimeFrom: "14:00",
    deliveryTimeTo: "18:00",
    cargoWeightTon: 2,
    cargoVolumeM3: 8,
    packageCount: 10,
    ...extra,
  };
}

async function publish(baseUrl: string, cookie: string, cargo: string, price = 10_000_000, extra: Json = {}) {
  const response = await fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: headers(cookie, true),
    body: JSON.stringify(shipmentBody(cargo, price, extra)),
  });
  const body = (await response.json()) as Json & { error?: { code?: string } };
  return { status: response.status, body };
}

async function post(baseUrl: string, cookie: string, path: string, payload: Json = {}, extraHeaders: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: headers(cookie, true, extraHeaders),
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as Json & { error?: { code?: string; message?: string } };
  return { status: response.status, body };
}

async function commissionOf(baseUrl: string, cookie: string, id: string) {
  const response = await fetch(`${baseUrl}/api/commission/shipments/${id}`, { headers: headers(cookie) });
  const body = (await response.json()) as {
    available: boolean;
    simulation: boolean;
    paymentCollected: boolean;
    banner: string;
    shipment: Entry;
    error?: { code?: string };
  };
  return { status: response.status, body };
}

async function activate(baseUrl: string, cookie: string, planCode: string, key: string) {
  return post(baseUrl, cookie, "/api/packages/my-plan/demo-activate", { planCode, idempotencyKey: key });
}

async function assign(baseUrl: string, cookie: string, id: string) {
  return post(baseUrl, cookie, `/api/carrier/shipments/${id}/assign`, { vehicleId, driverId });
}

async function countAccrual(shipmentId: string, payerSide?: string) {
  return CommissionLedgerEvent.countDocuments({ shipmentId, eventType: "ACCRUAL", ...(payerSide ? { payerSide } : {}) });
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 4000 });
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  await CommissionLedgerEvent.syncIndexes();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe hoa hồng" });
  const carrierOther = await User.create({ email: carrierOtherEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe hai" });
  const carrierPlan = await User.create({ email: carrierPlanEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe gói" });
  await User.create({ email: carrierCapEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe trần" });
  const shipper = await User.create({ email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng hoa hồng" });
  await User.create([
    { email: shipperOtherEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng khác" },
    { email: shipperPlanEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng đổi gói" },
    { email: shipperEnterpriseEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng hợp đồng" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế hoa hồng" },
    { email: adminEmail, passwordHash, role: "ADMIN", displayName: "Quản trị hoa hồng" },
  ]);
  const vehicle = await Vehicle.create({ carrierId: carrier._id, label: "Xe hoa hồng" });
  const driver = await User.findOne({ email: driverEmail });
  const admin = await User.findOne({ email: adminEmail });
  assert.ok(driver && admin);
  shipperId = shipper._id.toString();
  carrierId = carrier._id.toString();
  carrierOtherId = carrierOther._id.toString();
  carrierPlanId = carrierPlan._id.toString();
  driverId = driver._id.toString();
  adminId = admin._id.toString();
  vehicleId = vehicle._id.toString();
  await ensurePublishedCatalog();
});

after(async () => {
  if (mongoose.connection.name === databaseName && !forbidden.has(mongoose.connection.name)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("COM-T12 publish locks the shipper snapshot and leaves the carrier absent", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const beforeCount = await Shipment.countDocuments({ shipperId });
    const rejected = await publish(baseUrl, shipper, "Đơn bị từ chối vì gửi tỷ lệ", 10_000_000, { rateBps: 100, calculatedFeeVnd: 1, payerAccountId: shipperId });
    assert.equal(rejected.status, 400);
    assert.equal(rejected.body.error?.code, "invalid_request");
    assert.equal(await Shipment.countDocuments({ shipperId }), beforeCount);

    const created = await publish(baseUrl, shipper, "Đơn vừa đăng");
    assert.equal(created.status, 201);
    const id = String((created.body.shipment as Json).id);
    const view = await commissionOf(baseUrl, shipper, id);
    assert.equal(view.status, 200);
    assert.equal(view.body.available, true);
    assert.equal(view.body.paymentCollected, false);
    assert.equal(view.body.banner, "Mô phỏng Demo/QA — Không phải tiền đã thu");
    assert.equal(view.body.shipment.legacy, false);
    assert.equal(view.body.shipment.payerSide, "SHIPPER");
    assert.equal(view.body.shipment.status, "ESTIMATED");
    assert.equal(view.body.shipment.planCode, "shipper-free");
    assert.equal(view.body.shipment.rateBps, 500);
    assert.equal(view.body.shipment.baseFreightVnd, 10_000_000);
    assert.equal(view.body.shipment.feeVnd, 500_000);
    assert.equal(view.body.shipment.settlementVnd, 10_500_000);
    assert.equal(view.body.shipment.ledger.filter((row) => row.eventType === "ESTIMATED").length, 1);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.commission?.carrierStatus, "ABSENT");
    assert.equal(stored?.commission?.carrier, undefined);
    assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId: id, payerSide: "CARRIER" }), 0);
    const carrier = await login(baseUrl, carrierEmail);
    const hidden = await commissionOf(baseUrl, carrier, id);
    assert.equal(hidden.status, 404);
  });
});

test("COM-T13 a winning claim locks only that carrier", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const other = await login(baseUrl, carrierOtherEmail);
    const created = await publish(baseUrl, shipper, "Đơn để nhận");
    const id = String((created.body.shipment as Json).id);
    const claimed = await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`, { rateBps: 1, calculatedFeeVnd: 1, payerAccountId: carrierOtherId });
    assert.equal(claimed.status, 400);
    const winner = await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`, {});
    assert.equal(winner.status, 200);
    const again = await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`, {});
    assert.equal(again.status, 409);
    const loser = await post(baseUrl, other, `/api/carrier/shipments/${id}/claim`, {});
    assert.equal(loser.status, 409);
    const shipperView = await commissionOf(baseUrl, shipper, id);
    const carrierView = await commissionOf(baseUrl, carrier, id);
    assert.equal(shipperView.body.shipment.feeVnd, 500_000);
    assert.equal(shipperView.body.shipment.status, "ESTIMATED");
    assert.equal(shipperView.body.shipment.payerSide, "SHIPPER");
    assert.equal(carrierView.body.shipment.payerSide, "CARRIER");
    assert.equal(carrierView.body.shipment.status, "ESTIMATED");
    assert.equal(carrierView.body.shipment.rateBps, 500);
    assert.equal(carrierView.body.shipment.feeVnd, 500_000);
    assert.equal(carrierView.body.shipment.settlementVnd, 9_500_000);
    assert.equal(shipperView.body.shipment.settlementVnd, 10_500_000);
    const hidden = await commissionOf(baseUrl, other, id);
    assert.equal(hidden.status, 404);
    assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId: id, payerSide: "CARRIER", eventType: "ESTIMATED" }), 1);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.carrierId?.toString(), carrierId);
    assert.equal(stored?.commission?.carrier?.payerAccountId.toString(), carrierId);
  });
});

test("COM-T08 two carriers claiming together produce one snapshot", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const first = await login(baseUrl, carrierEmail);
    const second = await login(baseUrl, carrierOtherEmail);
    const created = await publish(baseUrl, shipper, "Đơn tranh nhận");
    const id = String((created.body.shipment as Json).id);
    const [left, right] = await Promise.all([
      post(baseUrl, first, `/api/carrier/shipments/${id}/claim`, {}),
      post(baseUrl, second, `/api/carrier/shipments/${id}/claim`, {}),
    ]);
    const statuses = [left.status, right.status].sort();
    assert.deepEqual(statuses, [200, 409]);
    assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId: id, payerSide: "CARRIER" }), 1);
    const stored = await Shipment.findById(id);
    assert.ok(stored?.carrierId);
    assert.equal(stored?.commission?.carrier?.payerAccountId.toString(), stored?.carrierId?.toString());
  });
});

test("COM-T09 a later shipper plan does not rewrite the published snapshot", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await login(baseUrl, shipperPlanEmail);
    const created = await publish(baseUrl, cookie, "Đơn trước khi đổi gói");
    const id = String((created.body.shipment as Json).id);
    const upgraded = await activate(baseUrl, cookie, "shipper-pro-monthly", "shipper-pro-001");
    assert.equal(upgraded.status, 200);
    const locked = await commissionOf(baseUrl, cookie, id);
    assert.equal(locked.body.shipment.planCode, "shipper-free");
    assert.equal(locked.body.shipment.rateBps, 500);
    assert.equal(locked.body.shipment.feeVnd, 500_000);
    const next = await publish(baseUrl, cookie, "Đơn sau khi đổi gói");
    assert.equal(next.status, 201);
    const nextView = await commissionOf(baseUrl, cookie, String((next.body.shipment as Json).id));
    assert.equal(nextView.body.shipment.planCode, "shipper-pro-monthly");
    assert.equal(nextView.body.shipment.rateBps, 400);
    assert.equal(nextView.body.shipment.feeVnd, 400_000);
    const unchanged = await commissionOf(baseUrl, cookie, id);
    assert.equal(unchanged.body.shipment.feeVnd, 500_000);
  });
});

test("COM-T11 a stale plan version is rejected before the write", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperPlanEmail);
    const carrier = await login(baseUrl, carrierPlanEmail);
    const freeShipper = await PlanVersion.findOne({ planCode: "shipper-free", revision: 1 });
    const freeCarrier = await PlanVersion.findOne({ planCode: "carrier-free", revision: 1 });
    assert.ok(freeShipper && freeCarrier);
    const beforeShipments = await Shipment.countDocuments();
    const stalePublish = await publish(baseUrl, shipper, "Đơn báo giá cũ", 10_000_000, { expectedPlanVersionId: freeShipper._id.toString() });
    assert.equal(stalePublish.status, 409);
    assert.equal(stalePublish.body.error?.code, "commission_quote_stale");
    assert.equal(await Shipment.countDocuments(), beforeShipments);
    const created = await publish(baseUrl, shipper, "Đơn cho báo giá nhà xe cũ");
    const id = String((created.body.shipment as Json).id);
    const upgraded = await activate(baseUrl, carrier, "carrier-pro-monthly", "carrier-pro-001");
    assert.equal(upgraded.status, 200);
    const staleClaim = await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`, { expectedPlanVersionId: freeCarrier._id.toString() });
    assert.equal(staleClaim.status, 409);
    assert.equal(staleClaim.body.error?.code, "commission_quote_stale");
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "PUBLISHED");
    assert.equal(stored?.carrierId ?? null, null);
    assert.equal(stored?.commission?.carrierStatus, "ABSENT");
  });
});

test("COM-T10 an expired carrier plan does not rewrite the claim snapshot", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierPlanEmail);
    const first = await publish(baseUrl, shipper, "Đơn khóa tỷ lệ nhà xe");
    const firstId = String((first.body.shipment as Json).id);
    const claimed = await post(baseUrl, carrier, `/api/carrier/shipments/${firstId}/claim`, {});
    assert.equal(claimed.status, 200);
    await AccountSubscription.updateOne({ accountId: carrierPlanId }, { $set: { endAt: new Date(Date.now() - 60_000) } });
    const locked = await commissionOf(baseUrl, carrier, firstId);
    assert.equal(locked.body.shipment.planCode, "carrier-pro-monthly");
    assert.equal(locked.body.shipment.rateBps, 400);
    assert.equal(locked.body.shipment.feeVnd, 400_000);
    const second = await publish(baseUrl, shipper, "Đơn sau khi gói nhà xe hết hạn");
    const secondId = String((second.body.shipment as Json).id);
    const nextClaim = await post(baseUrl, carrier, `/api/carrier/shipments/${secondId}/claim`, {});
    assert.equal(nextClaim.status, 200);
    const refreshed = await commissionOf(baseUrl, carrier, secondId);
    assert.equal(refreshed.body.shipment.planCode, "carrier-free");
    assert.equal(refreshed.body.shipment.rateBps, 500);
    const stillLocked = await commissionOf(baseUrl, carrier, firstId);
    assert.equal(stillLocked.body.shipment.feeVnd, 400_000);
    assert.equal(stillLocked.body.shipment.rateBps, 400);
  });
});

test("an enterprise contract uses the approved rate rather than the midpoint", async () => {
  await withServer(async (baseUrl) => {
    const enterprise = planByCode("shipper-enterprise");
    assert.equal(enterprise?.rateBps, null);
    const user = await User.findOne({ email: shipperEnterpriseEmail });
    assert.ok(user);
    const cookie = await login(baseUrl, shipperEnterpriseEmail);
    const missing = await activate(baseUrl, cookie, "shipper-enterprise", "enterprise-missing");
    assert.equal(missing.status, 409);
    assert.equal(missing.body.error?.code, "quote_required");
    await grantAuthorizedDemoContract(user._id.toString(), "shipper-enterprise", { priceVnd: 1_000_000, rateBps: 220 });
    const activated = await activate(baseUrl, cookie, "shipper-enterprise", "enterprise-approved");
    assert.equal(activated.status, 200);
    const created = await publish(baseUrl, cookie, "Đơn hợp đồng", 10_000_000);
    assert.equal(created.status, 201);
    const view = await commissionOf(baseUrl, cookie, String((created.body.shipment as Json).id));
    assert.equal(view.body.shipment.rateBps, 220);
    assert.equal(view.body.shipment.feeVnd, 220_000);
    assert.notEqual(view.body.shipment.feeVnd, 250_000);
    await assert.rejects(() => quoteForAccount(adminId, 10_000_000), (error: unknown) => error instanceof HttpError && error.code === "commission_rate_unavailable");
  });
});

test("COM-T14 pickup and GPS do not accrue, and an incident does not hold", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const created = await publish(baseUrl, shipper, "Đơn chưa giao");
    const id = String((created.body.shipment as Json).id);
    assert.equal((await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`, {})).status, 200);
    assert.equal((await assign(baseUrl, carrier, id)).status, 200);
    assert.equal((await post(baseUrl, driver, `/api/driver/shipments/${id}/pickup`, {})).status, 200);
    const located = await post(baseUrl, driver, `/api/driver/shipments/${id}/location`, {
      latitude: 10.76,
      longitude: 106.66,
      observedAt: new Date().toISOString(),
    });
    assert.equal(located.status, 200);
    const duringTransit = await commissionOf(baseUrl, shipper, id);
    assert.equal(duringTransit.body.shipment.status, "ESTIMATED");
    assert.equal(await countAccrual(id), 0);
    await Shipment.updateOne({ _id: id }, { $set: { status: "INCIDENT" } });
    assert.equal(await accrueDeliveredShipment(id), "skipped");
    const held = await commissionOf(baseUrl, shipper, id);
    assert.equal(held.body.shipment.status, "ESTIMATED");
    assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId: id, eventType: "HOLD" }), 0);
    await Shipment.updateOne({ _id: id }, { $set: { status: "IN_TRANSIT" } });
    assert.equal((await post(baseUrl, driver, `/api/driver/shipments/${id}/delivery`, {})).status, 200);
  });
});

test("COM-T15 and COM-T16 delivery accrues each side once across retries", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const created = await publish(baseUrl, shipper, "Đơn giao một lần");
    const id = String((created.body.shipment as Json).id);
    assert.equal((await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`, {})).status, 200);
    assert.equal((await assign(baseUrl, carrier, id)).status, 200);
    assert.equal((await post(baseUrl, driver, `/api/driver/shipments/${id}/pickup`, {})).status, 200);
    const [first, second] = await Promise.all([
      post(baseUrl, driver, `/api/driver/shipments/${id}/delivery`, {}),
      post(baseUrl, driver, `/api/driver/shipments/${id}/delivery`, {}),
    ]);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    const third = await post(baseUrl, driver, `/api/driver/shipments/${id}/delivery`, {});
    assert.equal(third.status, 200);
    assert.equal(await countAccrual(id, "SHIPPER"), 1);
    assert.equal(await countAccrual(id, "CARRIER"), 1);
    assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId: id, eventType: { $nin: ["ESTIMATED", "ACCRUAL"] } }), 0);
    const paid = await CommissionLedgerEvent.countDocuments({ shipmentId: id, paymentCollected: true });
    assert.equal(paid, 0);
    const view = await commissionOf(baseUrl, shipper, id);
    assert.equal(view.body.shipment.status, "ACCRUED");
    assert.equal(view.body.shipment.outboxStatus, "APPLIED");
    assert.equal(view.body.paymentCollected, false);
    assert.equal(view.body.shipment.ledger.some((row) => row.eventType === "ACCRUAL" && row.paymentCollected === false && row.simulation === true), true);
    const stored = await Shipment.findById(id);
    const deliveryEvents = (stored?.events ?? []).filter((event) => event.type === "DELIVERY_CONFIRMED");
    assert.equal(deliveryEvents.length, 1);
    assert.equal(await AuditLog.countDocuments({ action: "COMMISSION_ACCRUED", resourceId: id }), 1);
    const carrierView = await commissionOf(baseUrl, carrier, id);
    assert.equal(carrierView.body.shipment.status, "ACCRUED");
  });
});

test("COM-T17 a failed accrual stays visible and repairs without a second row", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const created = await publish(baseUrl, shipper, "Đơn sửa sổ");
    const id = String((created.body.shipment as Json).id);
    assert.equal((await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`, {})).status, 200);
    assert.equal((await assign(baseUrl, carrier, id)).status, 200);
    assert.equal((await post(baseUrl, driver, `/api/driver/shipments/${id}/pickup`, {})).status, 200);
    assert.equal((await post(baseUrl, driver, `/api/driver/shipments/${id}/delivery`, {})).status, 200);
    const original = await Shipment.findById(id);
    const fee = original?.commission?.shipper?.calculatedFeeVnd;
    assert.equal(typeof fee, "number");
    await CommissionLedgerEvent.deleteMany({ shipmentId: id, eventType: "ACCRUAL" });
    await Shipment.collection.updateOne(
      { _id: original?._id },
      {
        $set: {
          "commission.shipper.calculatedFeeVnd": null,
          "commission.shipperStatus": "ESTIMATED",
          "commission.carrierStatus": "ESTIMATED",
          "commission.outbox.status": "PENDING",
        },
      },
    );
    assert.equal(await accrueDeliveredShipment(id), "pending");
    const pending = await commissionOf(baseUrl, shipper, id);
    assert.equal(pending.body.shipment.status, "ESTIMATED");
    assert.equal(pending.body.shipment.outboxStatus, "ERROR");
    assert.equal(await countAccrual(id), 0);
    await Shipment.collection.updateOne({ _id: original?._id }, { $set: { "commission.shipper.calculatedFeeVnd": fee } });
    const [left, right] = await Promise.all([accrueDeliveredShipment(id), accrueDeliveredShipment(id)]);
    assert.equal([left, right].every((result) => result === "applied" || result === "pending"), true);
    assert.equal(await reconcileCommissionOutbox() >= 0, true);
    assert.equal(await countAccrual(id, "SHIPPER"), 1);
    assert.equal(await countAccrual(id, "CARRIER"), 1);
    const repaired = await commissionOf(baseUrl, shipper, id);
    assert.equal(repaired.body.shipment.status, "ACCRUED");
    assert.equal(repaired.body.shipment.outboxStatus, "APPLIED");
    assert.equal(await AuditLog.countDocuments({ action: "COMMISSION_ACCRUED", resourceId: id }), 1);
  });
});

test("COM-T24 a legacy shipment is not priced from the current plan", async () => {
  await withServer(async (baseUrl) => {
    const legacy = await Shipment.create({
      shipperId,
      cargoDescription: "Đơn cũ",
      pickupLocation: "Kho cũ",
      deliveryLocation: "Kho mới",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh",
      listedPriceVnd: 10_000_000,
      status: "PUBLISHED",
    });
    const shipper = await login(baseUrl, shipperEmail);
    const view = await commissionOf(baseUrl, shipper, legacy._id.toString());
    assert.equal(view.status, 200);
    assert.equal(view.body.shipment.legacy, true);
    assert.equal(view.body.shipment.status, "ABSENT");
    assert.equal(view.body.shipment.feeVnd, null);
    assert.equal(view.body.shipment.rateBps, null);
    assert.equal(view.body.shipment.ledger.length, 0);
    assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId: legacy._id }), 0);
    const history = await fetch(`${baseUrl}/api/commission/mine`, { headers: headers(shipper) });
    const historyBody = (await history.json()) as { entries: { shipmentId: string }[] };
    assert.equal(history.status, 200);
    assert.equal(historyBody.entries.some((entry) => entry.shipmentId === legacy._id.toString()), false);
  });
});

test("COM-T25 and COM-T26 foreign accounts, drivers and admins cannot read or change commission", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, shipperOtherEmail);
    const driver = await login(baseUrl, driverEmail);
    const admin = await login(baseUrl, adminEmail);
    const created = await publish(baseUrl, shipper, "Đơn cách ly");
    const id = String((created.body.shipment as Json).id);
    const foreign = await commissionOf(baseUrl, otherShipper, id);
    assert.equal(foreign.status, 404);
    assert.equal(JSON.stringify(foreign.body).includes("500000"), false);
    for (const cookie of [driver, admin]) {
      const deniedRead = await commissionOf(baseUrl, cookie, id);
      assert.equal(deniedRead.status, 403);
      const missingKey = await post(baseUrl, cookie, "/api/commission/adjustments", { amountVnd: 1, shipmentId: id });
      assert.equal(missingKey.status, 400);
      const denied = await post(baseUrl, cookie, "/api/commission/adjustments", { amountVnd: 1, shipmentId: id, payerSide: "SHIPPER" }, { "idempotency-key": "adjust-denied-1" });
      assert.equal(denied.status, 403);
      assert.equal(denied.body.error?.code, "commission_mutation_denied");
      const hold = await post(baseUrl, cookie, "/api/commission/holds", { shipmentId: id }, { "idempotency-key": "hold-denied-001" });
      assert.equal(hold.status, 403);
      assert.equal(hold.body.error?.code, "commission_mutation_denied");
    }
    const shipperDenied = await post(baseUrl, shipper, "/api/commission/releases", { shipmentId: id }, { "idempotency-key": "release-denied" });
    assert.equal(shipperDenied.status, 403);
    assert.equal(await CommissionLedgerEvent.countDocuments({ eventType: { $in: ["HOLD", "RELEASE", "ADJUSTMENT", "VOID"] } }), 0);
    const payments = await fetch(`${baseUrl}/api/payments`, { headers: headers(admin) });
    assert.equal(payments.status, 404);
    const ledger = await fetch(`${baseUrl}/api/commission/ledger`, { headers: headers(admin) });
    assert.equal(ledger.status, 404);
    assert.equal(ledgerEventTypes.includes("PAID" as (typeof ledgerEventTypes)[number]), false);
  });
});

test("COM-T27 and a disabled simulation flag do not open a payment path", async () => {
  const previous = process.env.COMMISSION_SIMULATION_ENABLED;
  try {
    await withServer(async (baseUrl) => {
      const shipper = await login(baseUrl, shipperEmail);
      process.env.COMMISSION_SIMULATION_ENABLED = "false";
      const created = await publish(baseUrl, shipper, "Đơn khi mô phỏng tắt", 10_000_000, {});
      assert.equal(created.status, 201);
      const id = String((created.body.shipment as Json).id);
      const stored = await Shipment.findById(id);
      assert.equal(stored?.commission, undefined);
      const bypass = await fetch(`${baseUrl}/api/shipments?commissionSimulation=true`, {
        method: "POST",
        headers: headers(shipper, true, { "x-commission-simulation": "true" }),
        body: JSON.stringify(shipmentBody("Đơn header bỏ qua", 10_000_000)),
      });
      assert.equal(bypass.status, 201);
      const bypassBody = (await bypass.json()) as { shipment: { id: string } };
      const bypassed = await Shipment.findById(bypassBody.shipment.id);
      assert.equal(bypassed?.commission, undefined);
      const view = await commissionOf(baseUrl, shipper, id);
      assert.equal(view.body.available, false);
      assert.equal(view.body.shipment.legacy, true);
      assert.equal(view.body.shipment.feeVnd, null);
      assert.equal(view.body.paymentCollected, false);
    });
  } finally {
    process.env.COMMISSION_SIMULATION_ENABLED = previous;
  }
});

test("listed price has no side door and the snapshot is not recomputed from it", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const created = await publish(baseUrl, shipper, "Đơn giữ giá");
    const id = String((created.body.shipment as Json).id);
    const patched = await fetch(`${baseUrl}/api/shipments/${id}`, {
      method: "PATCH",
      headers: headers(shipper, true),
      body: JSON.stringify({ listedPriceVnd: 9 }),
    });
    assert.equal(patched.status, 404);
    await Shipment.updateOne({ _id: id }, { $set: { listedPriceVnd: 9 } });
    const view = await commissionOf(baseUrl, shipper, id);
    assert.equal(view.body.shipment.baseFreightVnd, 10_000_000);
    assert.equal(view.body.shipment.feeVnd, 500_000);
  });
});

test("fleet cap and exclusive vehicle assignment still reject the extra write", async () => {
  await withServer(async (baseUrl) => {
    const capCarrier = await login(baseUrl, carrierCapEmail);
    const vehicleBody = { label: "Xe trần", vehicleKind: "REEFER_TRUCK", temperatureGroup: "FROZEN", capacityTon: 5 };
    const first = await post(baseUrl, capCarrier, "/api/carrier/fleet/vehicles", { ...vehicleBody, plate: "51C-200.01" });
    const second = await post(baseUrl, capCarrier, "/api/carrier/fleet/vehicles", { ...vehicleBody, plate: "51C-200.02" });
    const third = await post(baseUrl, capCarrier, "/api/carrier/fleet/vehicles", { ...vehicleBody, plate: "51C-200.03" });
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(third.status, 409);
    assert.equal(third.body.error?.code, "plan_limit_exceeded");

    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const left = await publish(baseUrl, shipper, "Chuyến giữ xe");
    const right = await publish(baseUrl, shipper, "Chuyến xe bận");
    const leftId = String((left.body.shipment as Json).id);
    const rightId = String((right.body.shipment as Json).id);
    assert.equal((await post(baseUrl, carrier, `/api/carrier/shipments/${leftId}/claim`, {})).status, 200);
    assert.equal((await post(baseUrl, carrier, `/api/carrier/shipments/${rightId}/claim`, {})).status, 200);
    assert.equal((await assign(baseUrl, carrier, leftId)).status, 200);
    const busy = await assign(baseUrl, carrier, rightId);
    assert.equal(busy.status, 409);
    assert.equal(busy.body.error?.code, "vehicle_busy");
    const driver = await login(baseUrl, driverEmail);
    assert.equal((await post(baseUrl, driver, `/api/driver/shipments/${leftId}/pickup`, {})).status, 200);
    assert.equal((await post(baseUrl, driver, `/api/driver/shipments/${leftId}/delivery`, {})).status, 200);
    const accrued = await commissionOf(baseUrl, carrier, leftId);
    assert.equal(accrued.body.shipment.status, "ACCRUED");
    const waiting = await commissionOf(baseUrl, carrier, rightId);
    assert.equal(waiting.body.shipment.status, "ESTIMATED");
  });
});
