const blockedDatabases = new Set(["coldi", "admin", "local", "config"]);

export type DemoSeedDecision = "refuse" | "create-or-keep" | "sync-passwords";

export function demoSeedDecision(
  databaseName: string,
  env: { sync?: string | undefined; confirmedDatabase?: string | undefined },
): DemoSeedDecision {
  if (blockedDatabases.has(databaseName)) return "refuse";
  const confirmed = env.confirmedDatabase === databaseName && databaseName.length > 0;
  const sync = env.sync === "confirm";
  if (databaseName === "coldi_demo_local" && !confirmed) return "refuse";
  if (sync && !confirmed) return "refuse";
  if (sync && confirmed) return "sync-passwords";
  return "create-or-keep";
}

export function userIndexMigrationAllowed(databaseName: string, nodeEnv: string, confirm: string, allowProduction: string): boolean {
  if (databaseName.length === 0 || confirm !== databaseName || blockedDatabases.has(databaseName)) return false;
  if (nodeEnv === "production") return allowProduction === "yes";
  return true;
}
