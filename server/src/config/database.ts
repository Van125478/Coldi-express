import mongoose from "mongoose";

export type DatabaseStatus = "connected" | "unavailable";

export async function connectDatabase(uri: string): Promise<boolean> {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected.");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    console.error(`MongoDB connection failed: ${message}`);
    return false;
  }
}

export function databaseStatus(): DatabaseStatus {
  return mongoose.connection.readyState === 1 ? "connected" : "unavailable";
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}
