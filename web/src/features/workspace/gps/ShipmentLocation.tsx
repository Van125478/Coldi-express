import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { eventTime } from "@/features/workspace/format";
import { lostSession } from "@/features/workspace/sessionLoss";
import { DetailBlock } from "@/features/workspace/ui";
import { getShipmentLocation } from "@/services/shipmentService";
import { presentLocation, readPublicMapboxToken, toMapboxPosition } from "./mapPresentation";
import { trackingLabels, type ShipmentTracking } from "./types";

const ShipmentLiveMap = lazy(() => import("./ShipmentLiveMap").then((module) => ({ default: module.ShipmentLiveMap })));

const POLL_MS = 90 * 1000;
const activePhases = new Set(["waiting_for_fix", "current", "stale"]);

export function ShipmentLocation({
  shipmentId,
  title = "Vị trí GPS",
  load = getShipmentLocation,
}: {
  shipmentId: string;
  title?: string;
  load?: (id: string) => Promise<{ tracking: ShipmentTracking }>;
}) {
  const { logout } = useAuth();
  const [tracking, setTracking] = useState<ShipmentTracking | null>(null);
  const [problem, setProblem] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [scopeId, setScopeId] = useState(shipmentId);
  const token = readPublicMapboxToken(import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN);
  if (scopeId !== shipmentId) {
    setScopeId(shipmentId);
    setTracking(null);
    setProblem(false);
    setMapOpen(false);
  }

  useEffect(() => {
    let active = true;
    let timer = 0;
    let watching = false;

    async function refresh() {
      try {
        const body = await load(shipmentId);
        if (!active) return;
        setTracking(body.tracking);
        setProblem(false);
        watching = activePhases.has(body.tracking.phase);
        schedule();
      } catch (error) {
        if (!active || lostSession(error, logout)) return;
        setProblem(true);
        watching = false;
        window.clearTimeout(timer);
      }
    }

    function schedule() {
      window.clearTimeout(timer);
      if (!watching || document.visibilityState === "hidden") return;
      timer = window.setTimeout(() => void refresh(), POLL_MS);
    }

    function onVisibility() {
      if (!active) return;
      if (document.visibilityState === "hidden") {
        window.clearTimeout(timer);
        return;
      }
      if (watching) void refresh();
    }

    document.addEventListener("visibilitychange", onVisibility);
    void refresh();
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [shipmentId, logout, attempt, load]);

  const latitude = tracking?.location?.latitude;
  const longitude = tracking?.location?.longitude;
  const view = presentLocation({
    apiProblem: problem,
    phase: tracking?.phase ?? null,
    latitude,
    longitude,
    token,
    webglSupported: true,
    loadFailed: false,
  });
  const stablePosition = useMemo(() => toMapboxPosition(latitude, longitude), [latitude, longitude]);

  return (
    <DetailBlock title={title}>
      {view.kind === "api_error" ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-ink">
            Không thể tải vị trí.
          </p>
          <button type="button" className="min-h-11 text-sm font-semibold text-navy underline-offset-4 hover:underline" onClick={() => setAttempt((value) => value + 1)}>
            Thử lại
          </button>
        </div>
      ) : null}
      {!problem && !tracking ? <p className="text-sm text-muted">Đang tải vị trí.</p> : null}
      {!problem && tracking ? <p className="text-sm font-semibold text-ink">{trackingLabels[tracking.phase]}</p> : null}
      {!problem && tracking?.phase === "ended" && !tracking.location ? <p className="text-sm text-ink">Chưa có vị trí xe được cập nhật.</p> : null}
      {view.kind === "coordinates" && tracking?.location ? (
        <div className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-line bg-canvas p-4">
            {toneCopy[view.tone] ? <p className="text-sm text-ink">{toneCopy[view.tone]}</p> : null}
            <p className="font-mono text-sm text-navy">
              {tracking.location.latitude.toFixed(5)}, {tracking.location.longitude.toFixed(5)}
            </p>
            <p className="text-sm text-ink">Cập nhật lúc {eventTime(tracking.location.receivedAt)}.</p>
            <p className="text-sm text-muted">Thiết bị ghi lúc {eventTime(tracking.location.observedAt)}.</p>
          </div>
          {view.map === "missing_token" ? <p className="text-sm leading-relaxed text-ink">Bản đồ chưa được cấu hình. Tọa độ vẫn hiện ở trên.</p> : null}
          {view.map === "webgl" || view.map === "load_failed" ? <p className="text-sm leading-relaxed text-ink">Bản đồ chưa mở được trên trình duyệt này. Tọa độ vẫn hiện ở trên.</p> : null}
          {view.map === "ready" && !mapOpen ? (
            <button type="button" className="min-h-11 rounded-xl bg-navy px-4 text-sm font-semibold text-white" onClick={() => setMapOpen(true)}>
              {view.tone === "historical" ? "Xem vị trí cuối trên bản đồ" : "Mở bản đồ"}
            </button>
          ) : null}
          {view.map === "ready" && mapOpen && stablePosition && token ? (
            <Suspense fallback={<div className="grid h-72 place-items-center rounded-2xl border border-line sm:h-96"><p className="text-sm text-muted">Đang mở bản đồ.</p></div>}>
              <ShipmentLiveMap token={token} position={stablePosition} bearingDeg={tracking.location.bearingDeg} />
            </Suspense>
          ) : null}
        </div>
      ) : null}
    </DetailBlock>
  );
}

const toneCopy = {
  current: "Vị trí mới cập nhật.",
  stale: "Đây chưa phải vị trí đang trực tiếp.",
  historical: "Đây là vị trí cuối được ghi.",
} as const;
