import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { getEnv } from "../config/env.js";
import { User } from "../models/user.js";
import { Vehicle } from "../models/vehicle.js";

const vehicleLabel = "Xe đông lạnh demo Core 05";

function readEmail(key: string): string {
  const email = process.env[key]?.trim().toLowerCase() ?? "";
  if (email.length === 0 || !email.includes("@")) {
    throw new Error(`${key} must be an email address.`);
  }
  return email;
}

const env = getEnv();
if (env.NODE_ENV === "production") {
  console.error("Demo fleet seeding is disabled in production.");
  process.exit(1);
}

const connected = await connectDatabase(env.MONGODB_URI);
if (!connected) {
  console.error("Demo fleet was not prepared because MongoDB is unavailable.");
  process.exit(1);
}

try {
  const carrier = await User.findOne({ email: readEmail("DEMO_CARRIER_EMAIL"), role: "CARRIER" });
  const driver = await User.findOne({ email: readEmail("DEMO_DRIVER_EMAIL"), role: "DRIVER" });
  if (!carrier || !driver) {
    console.error("Demo carrier and driver accounts must exist. Run npm run seed:demo first.");
    process.exitCode = 1;
  } else if (driver.carrierId && driver.carrierId.toString() !== carrier._id.toString()) {
    console.error("Demo driver is already linked to a different carrier. Fleet seed stopped.");
    process.exitCode = 1;
  } else {
    const displayName = driver.displayName?.trim() || "Tài xế demo";
    await User.updateOne({ _id: driver._id }, { $set: { carrierId: carrier._id, displayName } });
    await Vehicle.updateOne(
      { carrierId: carrier._id, label: vehicleLabel },
      { $setOnInsert: { carrierId: carrier._id, label: vehicleLabel } },
      { upsert: true },
    );
    console.log("Prepared one demo vehicle and linked the demo driver to the demo carrier.");
  }
} finally {
  await disconnectDatabase();
}
