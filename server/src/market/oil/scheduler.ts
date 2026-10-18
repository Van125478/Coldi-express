import { syncOilPrices, type SyncOilPricesInput } from "./sync.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function readTimeoutMs(env: NodeJS.ProcessEnv): number | undefined {
  const raw = env.OIL_SYNC_TIMEOUT_MS?.trim() ?? "";
  if (raw === "") return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1_000 || value > 20_000) {
    console.error("OIL_SYNC_TIMEOUT_MS must be an integer from 1000 to 20000. The sync will use 8000 ms.");
    return undefined;
  }
  return value;
}

export function parseSyncTimes(raw: string): string[] | null {
  const parts = raw.split(",").map((part) => part.trim()).filter((part) => part !== "");
  if (parts.length < 2 || parts.length > 4) return null;
  if (parts.some((part) => !TIME_PATTERN.test(part))) return null;
  if (new Set(parts).size !== parts.length) return null;
  return [...parts].sort();
}

export function nextRunDelayMs(times: readonly string[], now: Date): number {
  const delays = times.map((time) => {
    const [hour, minute] = time.split(":").map(Number);
    const run = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0, 0));
    const delta = run.getTime() - now.getTime();
    if (delta > 0) return delta;
    if (now.getTime() - run.getTime() < 60_000) return 1_000;
    return delta + 24 * 60 * 60 * 1000;
  });
  return Math.max(1_000, Math.min(...delays));
}

export function startOilPriceScheduler(options?: {
  env?: NodeJS.ProcessEnv;
  sync?: (input: SyncOilPricesInput) => Promise<unknown>;
}): () => void {
  const env = options?.env ?? process.env;
  if (env.OIL_SYNC_ENABLED?.trim().toLowerCase() !== "true") {
    console.log("Oil price scheduler is off. Set OIL_SYNC_ENABLED=true only after EIA_API_KEY and OIL_SYNC_TIMES are configured.");
    return () => {};
  }
  const apiKey = env.EIA_API_KEY?.trim() ?? "";
  if (apiKey === "") {
    console.error("Oil price scheduler was not started. EIA_API_KEY is missing, so no upstream prices will be fetched.");
    return () => {};
  }
  const times = parseSyncTimes(env.OIL_SYNC_TIMES ?? "");
  if (times === null) {
    console.error("Oil price scheduler was not started. OIL_SYNC_TIMES must list 2 to 4 distinct UTC times as HH:mm. Those times are not an EIA publication calendar.");
    return () => {};
  }

  const timeoutMs = readTimeoutMs(env);
  const run = options?.sync ?? syncOilPrices;
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  const schedule = () => {
    if (stopped) return;
    const delay = nextRunDelayMs(times, new Date());
    timer = setTimeout(() => {
      void run(timeoutMs === undefined ? { apiKey } : { apiKey, timeoutMs })
        .catch((error: unknown) => {
          console.error("Oil price sync failed.", error instanceof Error ? error.name : "error");
        })
        .finally(schedule);
    }, delay);
    timer.unref();
  };
  schedule();
  console.log(`Oil price scheduler armed for ${times.join(", ")} UTC. This clock is not an approved EIA release calendar.`);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
