import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { eventTime } from "@/features/workspace/format";
import { lostSession } from "@/features/workspace/sessionLoss";
import { DetailBlock } from "@/features/workspace/ui";
import { getShipmentLocation } from "@/services/shipmentService";
import { trackingLabels, type ShipmentTracking } from "./types";

const POLL_MS = 90 * 1000;

export function ShipmentLocation({ shipmentId }: { shipmentId: string }) {
  const { logout } = useAuth();
  const [tracking, setTracking] = useState<ShipmentTracking | null>(null);
  const [problem, setProblem] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let timer = 0;
    async function load() {
      try {
        const body = await getShipmentLocation(shipmentId);
        if (!active) return;
        setTracking(body.tracking);
        setProblem(false);
        const watching = body.tracking.phase === "waiting_for_fix" || body.tracking.phase === "current" || body.tracking.phase === "stale";
        if (watching) timer = window.setTimeout(() => void load(), POLL_MS);
      } catch (error) {
        if (!active || lostSession(error, logout)) return;
        setProblem(true);
      }
    }
    void load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [shipmentId, logout, attempt]);

  const phase = tracking?.phase;
  return (
    <DetailBlock title="Vị trí GPS">
      {problem ? (
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
      {!problem && phase ? <p className="text-sm font-semibold text-ink">{trackingLabels[phase]}</p> : null}
      {!problem && tracking?.location ? (
        <div className="space-y-2 rounded-2xl border border-line bg-canvas p-4">
          <p className="text-sm text-muted">Tọa độ mới nhất đã ghi. Đây chưa phải bản đồ nền.</p>
          <p className="font-mono text-sm text-navy">
            {tracking.location.latitude.toFixed(5)}, {tracking.location.longitude.toFixed(5)}
          </p>
          <p className="text-sm text-ink">Máy chủ nhận lúc {eventTime(tracking.location.receivedAt)}.</p>
          <p className="text-sm text-muted">Thiết bị quan sát lúc {eventTime(tracking.location.observedAt)}.</p>
          {phase === "current" ? null : <p className="text-sm text-ink">Mốc này không được hiển thị như vị trí trực tiếp.</p>}
        </div>
      ) : null}
      {!problem && phase === "ended" && !tracking?.location ? <p className="text-sm text-muted">Không có vị trí nào được ghi trước khi dừng theo dõi.</p> : null}
      <p className="text-sm leading-relaxed text-muted">
        Goong.io và Mapbox là ứng viên bản đồ, chưa được chọn và chưa có khóa API. Địa chỉ kho là chữ, không phải tọa độ. GPS không xác nhận lấy hàng, giao hàng hay thanh toán.
      </p>
    </DetailBlock>
  );
}
