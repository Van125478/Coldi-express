import { isValidObjectId } from "mongoose";
import { readCorrelationId, recordSuccessfulAudit } from "../audit/recordAudit.js";
import { assertAcceptablePassword, generateTemporaryPassword, hashPassword } from "../auth/password.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { Shipment } from "../models/shipment.js";
import { User } from "../models/user.js";

const activeAccount = { $or: [{ accountStatus: "ACTIVE" }, { accountStatus: { $exists: false } }, { accountStatus: null }] };
const passwordReady = { $or: [{ mustChangePassword: false }, { mustChangePassword: { $exists: false } }, { mustChangePassword: null }] };
const holdFree = {
  $or: [{ heldShipmentIds: { $exists: false } }, { heldShipmentIds: null }, { heldShipmentIds: { $size: 0 } }],
};
const activeTripStatuses = ["MATCHED", "IN_TRANSIT"] as const;

export type DriverRosterDto = {
  id: string;
  displayName: string | null;
  email: string;
  accountStatus: "ACTIVE" | "LOCKED";
  mustChangePassword: boolean;
};

type DriverRecord = {
  _id: { toString(): string };
  email: string;
  displayName?: string | null;
  accountStatus?: string | null;
  mustChangePassword?: boolean | null;
};

export function normalizeLoginEmail(value: unknown): string {
  if (typeof value !== "string") throw new HttpError(400, "invalid_request", "Email đăng nhập không hợp lệ.");
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "invalid_request", "Email đăng nhập không hợp lệ.");
  }
  return email;
}

export function toDriverRosterDto(driver: DriverRecord): DriverRosterDto {
  const displayName = driver.displayName?.trim() || null;
  return {
    id: driver._id.toString(),
    displayName,
    email: driver.email,
    accountStatus: driver.accountStatus === "LOCKED" ? "LOCKED" : "ACTIVE",
    mustChangePassword: driver.mustChangePassword === true,
  };
}

export async function claimDriverForAssignment(driverId: string, carrierId: string, shipmentId: string): Promise<"claimed" | "unavailable"> {
  const claimed = await User.findOneAndUpdate(
    { _id: driverId, role: "DRIVER", carrierId, heldShipmentIds: { $ne: shipmentId }, $and: [activeAccount, passwordReady] } as object,
    { $addToSet: { heldShipmentIds: shipmentId } },
  );
  if (claimed) return "claimed";
  const resumed = await User.findOne({
    _id: driverId,
    role: "DRIVER",
    carrierId,
    heldShipmentIds: shipmentId,
    $and: [activeAccount, passwordReady],
  } as object);
  return resumed ? "claimed" : "unavailable";
}

export async function releaseDriverHold(driverId: string, shipmentId: string): Promise<void> {
  await User.updateOne({ _id: driverId }, { $pull: { heldShipmentIds: shipmentId } });
}

export async function createDriverAccount(carrierId: string, body: unknown, correlationHeader: unknown): Promise<{ driver: DriverRosterDto; temporaryPassword: string }> {
  const input = readCreateInput(body);
  const parent = await User.findOne({ _id: carrierId, role: "CARRIER" });
  if (!parent || parent.accountStatus === "LOCKED") {
    throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
  }
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const taken = await User.exists({ email: input.email });
  if (taken) throw new HttpError(409, "conflict", "Email này đã được dùng.");
  try {
    const driver = await User.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash,
      role: "DRIVER",
      carrierId,
      accountStatus: "ACTIVE",
      mustChangePassword: true,
      sessionVersion: 0,
    });
    await recordSuccessfulAudit({
      action: "DRIVER_ACCOUNT_CREATED",
      actorId: carrierId,
      actorRole: "CARRIER",
      resourceType: "driver",
      resourceId: driver._id.toString(),
      relatedCarrierId: carrierId,
      fields: ["displayName", "email"],
      correlationId: readCorrelationId(correlationHeader),
    });
    return { driver: toDriverRosterDto(driver), temporaryPassword };
  } catch (error) {
    if (isDuplicate(error)) throw new HttpError(409, "conflict", "Email này đã được dùng.");
    throw error;
  }
}

export async function lockDriverAccount(carrierId: string, rawId: string, correlationHeader: unknown): Promise<DriverRosterDto> {
  const driverId = routeDriverId(rawId);
  const owned = await ownedDriver(carrierId, driverId);
  if (owned.accountStatus === "LOCKED") throw new HttpError(409, "conflict", "Tài khoản tài xế đã khóa.");
  if (await hasActiveTrip(driverId)) throw new HttpError(409, "conflict", "Không khóa được tài xế đang phụ trách chuyến chưa kết thúc.");
  const updated = await User.findOneAndUpdate(
    { _id: driverId, role: "DRIVER", carrierId, $and: [activeAccount, holdFree] } as object,
    { $set: { accountStatus: "LOCKED" }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after" },
  ).select("email displayName accountStatus mustChangePassword");
  if (!updated) {
    if (await hasActiveTrip(driverId)) throw new HttpError(409, "conflict", "Không khóa được tài xế đang phụ trách chuyến chưa kết thúc.");
    throw new HttpError(409, "conflict", "Không khóa được tài xế đang phụ trách chuyến chưa kết thúc.");
  }
  await recordSuccessfulAudit({
    action: "DRIVER_ACCOUNT_LOCKED",
    actorId: carrierId,
    actorRole: "CARRIER",
    resourceType: "driver",
    resourceId: updated._id.toString(),
    statusBefore: "ACTIVE",
    statusAfter: "LOCKED",
    relatedCarrierId: carrierId,
    fields: ["accountStatus"],
    correlationId: readCorrelationId(correlationHeader),
  });
  return toDriverRosterDto(updated);
}

export async function unlockDriverAccount(carrierId: string, rawId: string, correlationHeader: unknown): Promise<DriverRosterDto> {
  const driverId = routeDriverId(rawId);
  const owned = await ownedDriver(carrierId, driverId);
  if (owned.accountStatus !== "LOCKED") throw new HttpError(409, "conflict", "Tài khoản tài xế đang mở.");
  const updated = await User.findOneAndUpdate(
    { _id: driverId, role: "DRIVER", carrierId, accountStatus: "LOCKED" },
    { $set: { accountStatus: "ACTIVE" } },
    { returnDocument: "after" },
  ).select("email displayName accountStatus mustChangePassword");
  if (!updated) throw new HttpError(409, "conflict", "Tài khoản tài xế đang mở.");
  await recordSuccessfulAudit({
    action: "DRIVER_ACCOUNT_UNLOCKED",
    actorId: carrierId,
    actorRole: "CARRIER",
    resourceType: "driver",
    resourceId: updated._id.toString(),
    statusBefore: "LOCKED",
    statusAfter: "ACTIVE",
    relatedCarrierId: carrierId,
    fields: ["accountStatus"],
    correlationId: readCorrelationId(correlationHeader),
  });
  return toDriverRosterDto(updated);
}

export async function resetDriverPassword(carrierId: string, rawId: string, correlationHeader: unknown): Promise<{ driver: DriverRosterDto; temporaryPassword: string }> {
  const driverId = routeDriverId(rawId);
  await ownedDriver(carrierId, driverId);
  if (await hasActiveTrip(driverId)) throw new HttpError(409, "conflict", "Không đặt lại mật khẩu cho tài xế đang phụ trách chuyến chưa kết thúc.");
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const updated = await User.findOneAndUpdate(
    { _id: driverId, role: "DRIVER", carrierId, $and: [holdFree] } as object,
    { $set: { passwordHash, mustChangePassword: true }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after" },
  ).select("email displayName accountStatus mustChangePassword");
  if (!updated) throw new HttpError(409, "conflict", "Không đặt lại mật khẩu cho tài xế đang phụ trách chuyến chưa kết thúc.");
  await recordSuccessfulAudit({
    action: "DRIVER_PASSWORD_RESET",
    actorId: carrierId,
    actorRole: "CARRIER",
    resourceType: "driver",
    resourceId: updated._id.toString(),
    relatedCarrierId: carrierId,
    fields: ["mustChangePassword"],
    correlationId: readCorrelationId(correlationHeader),
  });
  return { driver: toDriverRosterDto(updated), temporaryPassword };
}

function readCreateInput(body: unknown): { displayName: string; email: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Hồ sơ tài xế không hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "displayName" && key !== "email")) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }
  if (typeof record.displayName !== "string") throw new HttpError(400, "invalid_request", "Tên hiển thị cần từ 1 đến 80 ký tự.");
  const displayName = record.displayName.trim();
  if (displayName.length < 1 || displayName.length > 80) {
    throw new HttpError(400, "invalid_request", "Tên hiển thị cần từ 1 đến 80 ký tự.");
  }
  return { displayName, email: normalizeLoginEmail(record.email) };
}

function routeDriverId(rawId: string): string {
  if (!isValidObjectId(rawId)) throw new HttpError(404, "not_found", "Không tìm thấy tài xế này.");
  return rawId;
}

async function ownedDriver(carrierId: string, driverId: string) {
  const driver = await User.findOne({ _id: driverId, role: "DRIVER", carrierId }).select("email displayName accountStatus mustChangePassword");
  if (!driver) throw new HttpError(404, "not_found", "Không tìm thấy tài xế này.");
  return driver;
}

async function hasActiveTrip(driverId: string): Promise<boolean> {
  const trip = await Shipment.exists({ driverId, status: { $in: [...activeTripStatuses] } });
  return trip !== null;
}

function isDuplicate(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code: unknown }).code === 11000) return true;
  return "cause" in error && isDuplicate((error as { cause: unknown }).cause);
}

export function assertReplacementPassword(password: unknown): string {
  if (typeof password !== "string") throw new HttpError(400, "invalid_request", "Mật khẩu cần từ 8 đến 72 ký tự.");
  assertAcceptablePassword(password);
  return password;
}
