import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { eventTime } from "@/features/workspace/format";
import { lostSession } from "@/features/workspace/sessionLoss";
import { DetailBlock } from "@/features/workspace/ui";
import { ApiError } from "@/services/apiClient";
import { submitDriverLocation } from "@/services/shipmentService";
import { distanceKm, nextCheckDelayMs, planPing } from "./pingPolicy";
import type { ShipmentTracking } from "./types";

type ShareState = "idle" | "requesting" | "sharing" | "denied" | "timeout" | "unsupported" | "unavailable" | "upload_error" | "paused";

export function DriverLocationShare({ shipmentId, active }: { shipmentId: string; active: boolean }) {
  const { logout } = useAuth();
  const [share, setShare] = useState<ShareState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [tracking, setTracking] = useState<ShipmentTracking | null>(null);
  const sharingRef = useRef(false);
  const timerRef = useRef(0);
  const lastFix = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastUploadAt = useRef(0);
  const sampleRef = useRef<(forceUpload: boolean) => Promise<void>>(async () => {});

  function stop() {
    sharingRef.current = false;
    window.clearTimeout(timerRef.current);
  }

  useEffect(() => {
    return () => {
      sharingRef.current = false;
      window.clearTimeout(timerRef.current);
    };
  }, [shipmentId]);

  useEffect(() => {
    if (!active) stop();
  }, [active]);

  useEffect(() => {
    function onVisibility() {
      if (!sharingRef.current) return;
      if (document.visibilityState === "hidden") {
        window.clearTimeout(timerRef.current);
        setShare("paused");
        setNotice("Trang không còn ở trước màn hình. Trình duyệt không bảo đảm gửi vị trí khi ẩn hoặc đã đóng.");
        return;
      }
      setShare("sharing");
      setNotice(null);
      void sampleRef.current(false);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  async function sample(forceUpload: boolean) {
    if (!sharingRef.current || !active) return;
    if (!navigator.geolocation) {
      stop();
      setShare("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void onFix(position, forceUpload);
      },
      (error) => {
        if (!sharingRef.current) return;
        const next = error.code === error.PERMISSION_DENIED ? "denied" : error.code === error.TIMEOUT ? "timeout" : "unavailable";
        setShare(next);
        if (next === "denied") stop();
        else timerRef.current = window.setTimeout(() => void sample(false), 60_000);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  async function onFix(position: GeolocationPosition, forceUpload: boolean) {
    if (!sharingRef.current || document.visibilityState === "hidden") return;
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const rawSpeed = position.coords.speed;
    const speedKmh = rawSpeed == null || !Number.isFinite(rawSpeed) || rawSpeed < 0 ? null : rawSpeed * 3.6;
    const rawBearing = position.coords.heading;
    const bearingDeg = rawBearing == null || !Number.isFinite(rawBearing) || rawBearing < 0 ? null : rawBearing;
    const plan = planPing({
      speedKmh,
      distanceKmSinceAccepted: distanceKm(lastFix.current, { latitude, longitude }),
    });
    const elapsed = lastUploadAt.current === 0 ? Number.POSITIVE_INFINITY : Date.now() - lastUploadAt.current;
    const shouldUpload = forceUpload || elapsed >= plan.intervalMs || plan.uploadBecauseDistance;
    if (shouldUpload) {
      try {
        const body = await submitDriverLocation(shipmentId, {
          latitude,
          longitude,
          speedKmh,
          bearingDeg,
          observedAt: new Date(position.timestamp).toISOString(),
        });
        lastFix.current = { latitude, longitude };
        lastUploadAt.current = Date.now();
        setTracking(body.tracking);
        setShare("sharing");
        setNotice("Đã gửi vị trí lên máy chủ.");
      } catch (error) {
        if (lostSession(error, logout)) return;
        setShare("upload_error");
        setNotice(error instanceof ApiError ? error.message : "Không gửi được vị trí.");
        if (error instanceof ApiError && error.status === 409 && error.message.includes("không còn nhận")) stop();
      }
    }
    if (!sharingRef.current) return;
    timerRef.current = window.setTimeout(() => void sampleRef.current(false), nextCheckDelayMs(plan));
  }

  sampleRef.current = sample;

  function start() {
    if (!active || sharingRef.current) return;
    if (!navigator.geolocation) {
      setShare("unsupported");
      return;
    }
    sharingRef.current = true;
    setShare("requesting");
    setNotice("Trình duyệt sẽ hỏi quyền vị trí. Chỉ trang này, khi đang mở, mới gửi vị trí.");
    void sample(true);
  }

  return (
    <DetailBlock title="Chia sẻ vị trí">
      {!active ? <p className="text-sm leading-relaxed text-ink">Vị trí chỉ được gửi khi chuyến đang vận chuyển. Không có vị trí cũng không chặn xác nhận lấy hàng hoặc giao hàng.</p> : null}
      {active ? (
        <p className="text-sm leading-relaxed text-ink">
          {share === "sharing" ? "Đang chia sẻ vị trí trên trang này." : "Chưa chia sẻ vị trí."} Trình duyệt không bảo đảm gửi GPS khi ứng dụng ở nền hoặc đã đóng.
        </p>
      ) : null}
      {share === "denied" ? <p className="text-sm text-ink">Trình duyệt đã từ chối quyền vị trí. Xác nhận lấy hàng và giao hàng vẫn thực hiện được.</p> : null}
      {share === "timeout" ? <p className="text-sm text-ink">Hết thời gian chờ vị trí. Sẽ thử lại khi trang vẫn đang mở.</p> : null}
      {share === "unsupported" ? <p className="text-sm text-ink">Trình duyệt này không cung cấp vị trí.</p> : null}
      {share === "unavailable" ? <p className="text-sm text-ink">Thiết bị chưa có vị trí. Không tạo tọa độ giả.</p> : null}
      {share === "paused" ? <p className="text-sm text-ink">Đã tạm dừng vì trang không còn ở trước màn hình.</p> : null}
      {notice ? <p className="text-sm text-ink">{notice}</p> : null}
      {tracking?.location ? <p className="text-sm text-muted">Lần gửi thành công gần nhất: {eventTime(tracking.location.receivedAt)}.</p> : null}
      {active && share !== "sharing" && share !== "requesting" && share !== "paused" ? (
        <Button type="button" onClick={start}>
          Bắt đầu chia sẻ vị trí
        </Button>
      ) : null}
      {active && (share === "sharing" || share === "requesting" || share === "paused") ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            stop();
            setShare("idle");
            setNotice("Đã dừng chia sẻ vị trí trên trang này.");
          }}
        >
          Dừng chia sẻ vị trí
        </Button>
      ) : null}
    </DetailBlock>
  );
}
