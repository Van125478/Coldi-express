export type NodeEnvironment = "development" | "test" | "production";

export type RuntimeMode = "development" | "qa" | "demo" | "production";

export type AppEnv = {
  PORT: number;
  MONGODB_URI: string;
  FRONTEND_ORIGIN: string;
  NODE_ENV: NodeEnvironment;
  AUTH_SECRET: string;
  APP_RUNTIME_MODE: RuntimeMode;
  PACKAGE_DEMO_SELF_ACTIVATION_ENABLED: boolean;
  demoSelfActivationAllowed: boolean;
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

  const authSecret = read("AUTH_SECRET");
  if (authSecret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  const runtimeMode = readRuntimeMode(nodeEnv as NodeEnvironment);
  const demoFlag = readDemoFlag();
  const deploymentId = process.env.PACKAGE_DEMO_DEPLOYMENT_ID?.trim() ?? "";
  const authorizedDeploymentId = process.env.PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID?.trim() ?? "";
  const databaseName = mongodbDatabaseName(mongodbUri);
  const runtimeError = packageRuntimeError({
    nodeEnv: nodeEnv as NodeEnvironment,
    runtimeMode,
    demoFlag,
    deploymentId,
    authorizedDeploymentId,
    databaseName,
  });
  if (runtimeError) {
    throw new Error(runtimeError);
  }

  return {
    PORT: port,
    MONGODB_URI: mongodbUri,
    FRONTEND_ORIGIN: frontendOrigin,
    NODE_ENV: nodeEnv as NodeEnvironment,
    AUTH_SECRET: authSecret,
    APP_RUNTIME_MODE: runtimeMode,
    PACKAGE_DEMO_SELF_ACTIVATION_ENABLED: demoFlag,
    demoSelfActivationAllowed: demoSelfActivationAllowed({
      nodeEnv: nodeEnv as NodeEnvironment,
      runtimeMode,
      demoFlag,
      deploymentId,
      authorizedDeploymentId,
      databaseName,
    }),
  };
}

const runtimeModes = new Set<RuntimeMode>(["development", "qa", "demo", "production"]);
const forbiddenDatabaseNames = new Set(["coldi", "admin", "local", "config"]);

export type PackageRuntimeInput = {
  nodeEnv: NodeEnvironment;
  runtimeMode: RuntimeMode;
  demoFlag: boolean;
  deploymentId: string;
  authorizedDeploymentId: string;
  databaseName: string;
};

export function mongodbDatabaseName(uri: string): string {
  const normalized = uri.replace(/^mongodb(\+srv)?:\/\//, "https://");
  const parsed = new URL(normalized);
  return decodeURIComponent(parsed.pathname.replace(/^\//, "").split("/")[0] ?? "");
}

export function packageRuntimeError(input: PackageRuntimeInput): string | null {
  const production = input.nodeEnv === "production" || input.runtimeMode === "production";
  if (production && (input.demoFlag || input.runtimeMode === "qa" || input.runtimeMode === "demo")) {
    return "Production cannot enable package demo self-activation. Refusing to start.";
  }
  if (!input.demoFlag) return null;
  if (input.runtimeMode !== "qa" && input.runtimeMode !== "demo") {
    return "Package demo self-activation requires APP_RUNTIME_MODE=qa or demo, not NODE_ENV alone.";
  }
  if (input.deploymentId.length < 8 || input.authorizedDeploymentId.length < 8 || input.deploymentId !== input.authorizedDeploymentId) {
    return "Package demo self-activation requires matching PACKAGE_DEMO_DEPLOYMENT_ID and PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID.";
  }
  if (forbiddenDatabaseNames.has(input.databaseName) || !/(test|qa|demo)/i.test(input.databaseName)) {
    return "Package demo self-activation requires a disposable database whose name contains test, qa, or demo.";
  }
  return null;
}

export function demoSelfActivationAllowed(input: PackageRuntimeInput): boolean {
  return packageRuntimeError(input) === null && input.demoFlag && (input.runtimeMode === "qa" || input.runtimeMode === "demo");
}

function readRuntimeMode(nodeEnv: NodeEnvironment): RuntimeMode {
  const raw = process.env.APP_RUNTIME_MODE?.trim() ?? "";
  if (raw === "") return nodeEnv === "production" ? "production" : "development";
  if (!runtimeModes.has(raw as RuntimeMode)) {
    throw new Error("APP_RUNTIME_MODE must be development, qa, demo, or production.");
  }
  return raw as RuntimeMode;
}

function readDemoFlag(): boolean {
  const raw = process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED?.trim().toLowerCase() ?? "";
  if (raw === "" || raw === "false" || raw === "0") return false;
  if (raw === "true" || raw === "1") return true;
  throw new Error("PACKAGE_DEMO_SELF_ACTIVATION_ENABLED must be true or false.");
}
