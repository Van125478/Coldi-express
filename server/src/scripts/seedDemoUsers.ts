import "dotenv/config";
import { hashPassword } from "../auth/password.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { getEnv } from "../config/env.js";
import { User, userRoles, type UserRole } from "../models/user.js";

const accounts: readonly { role: UserRole; emailKey: string; passwordKey: string }[] = [
  { role: "SHIPPER", emailKey: "DEMO_SHIPPER_EMAIL", passwordKey: "DEMO_SHIPPER_PASSWORD" },
  { role: "CARRIER", emailKey: "DEMO_CARRIER_EMAIL", passwordKey: "DEMO_CARRIER_PASSWORD" },
  { role: "DRIVER", emailKey: "DEMO_DRIVER_EMAIL", passwordKey: "DEMO_DRIVER_PASSWORD" },
  { role: "ADMIN", emailKey: "DEMO_ADMIN_EMAIL", passwordKey: "DEMO_ADMIN_PASSWORD" },
];

function readPair(emailKey: string, passwordKey: string): { email: string; password: string } {
  const email = process.env[emailKey]?.trim().toLowerCase() ?? "";
  const password = process.env[passwordKey] ?? "";
  if (email.length === 0 || !email.includes("@")) {
    throw new Error(`${emailKey} must be an email address.`);
  }
  if (password.length < 8 || password.length > 72) {
    throw new Error(`${passwordKey} must be 8 to 72 characters. Set it only in the local .env file.`);
  }
  return { email, password };
}

const env = getEnv();
if (env.NODE_ENV === "production") {
  console.error("Demo account seeding is disabled in production.");
  process.exit(1);
}

const connected = await connectDatabase(env.MONGODB_URI);
if (!connected) {
  console.error("Demo accounts were not created because MongoDB is unavailable.");
  process.exit(1);
}

try {
  for (const account of accounts) {
    if (!userRoles.includes(account.role)) continue;
    const { email, password } = readPair(account.emailKey, account.passwordKey);
    const passwordHash = await hashPassword(password);
    await User.updateOne(
      { email },
      { $set: { email, passwordHash, role: account.role } },
      { upsert: true },
    );
    console.log(`Upserted demo ${account.role} account for ${email}.`);
  }
} finally {
  await disconnectDatabase();
}
