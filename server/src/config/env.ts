export type NodeEnvironment = "development" | "test" | "production";

export type AppEnv = {
  PORT: number;
  MONGODB_URI: string;
  FRONTEND_ORIGIN: string;
  NODE_ENV: NodeEnvironment;
};

const environments = new Set<NodeEnvironment>(["development", "test", "production"]);

function read(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value.trim();
}

export function getEnv(): AppEnv {
  const port = Number(read("PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535.");
  }

  const mongodbUri = read("MONGODB_URI");
  if (!mongodbUri.startsWith("mongodb://") && !mongodbUri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }

  const frontendOrigin = read("FRONTEND_ORIGIN");
  if (frontendOrigin === "*") {
    throw new Error("FRONTEND_ORIGIN must be an explicit origin, not *.");
  }
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(frontendOrigin);
  } catch {
    throw new Error("FRONTEND_ORIGIN must be an absolute http(s) URL.");
  }
  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    throw new Error("FRONTEND_ORIGIN must use http or https.");
  }

  const nodeEnv = read("NODE_ENV");
  if (!environments.has(nodeEnv as NodeEnvironment)) {
    throw new Error("NODE_ENV must be development, test, or production.");
  }

  return {
    PORT: port,
    MONGODB_URI: mongodbUri,
    FRONTEND_ORIGIN: frontendOrigin,
    NODE_ENV: nodeEnv as NodeEnvironment,
  };
}
