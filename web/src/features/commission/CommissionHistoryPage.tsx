import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { carrierTripPath, shipperShipmentPath } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { eventTime, money } from "@/features/workspace/format";
import { lostSession } from "@/features/workspace/sessionLoss";
import { EmptyPanel, PageHeader, StatusBadge } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getMyCommission, type CommissionEntry, type CommissionStatus } from "@/services/commissionService";

const statusLabels: Record<CommissionStatus, string> = {
  ABSENT: "Chưa phát sinh",
  ESTIMATED: "Ước tính",
  ACCRUED: "Đã ghi nhận",
  VOID: "Đã hủy",
  ON_HOLD: "Tạm giữ",
};

function statusTone(status: CommissionStatus): "open" | "waiting" | "assigned" | "neutral" {
  if (status === "ESTIMATED") return "waiting";
  if (status === "ACCRUED") return "assigned";
  if (status === "ON_HOLD") return "open";
  return "neutral";
}

export function CommissionHistoryPage() {
  usePageTitle("Lịch sử hoa hồng");
  const { logout, snapshot } = useAuth();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [banner, setBanner] = useState<string | null>(null);
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const carrier = snapshot.status === "authenticated" && snapshot.user.role === "CARRIER";

  useEffect(() => {
    let active = true;
    getMyCommission()
      .then((body) => {
        if (!active) return;
        setBanner(body.banner);
        setEntries(body.entries);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [logout]);

  return (
    <section className="space-y-6">
      <PageHeader title="Lịch sử hoa hồng" summary={carrier ? "Phí nền tảng của các chuyến bạn đã nhận." : "Hoa hồng của các đơn bạn đã đăng."} />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải hoa hồng.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được hoa hồng. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" ? (
        <>
          {banner ? <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm font-semibold text-ink">{banner}</p> : null}
          {entries.length === 0 ? (
            <EmptyPanel title="Chưa có hoa hồng đã khóa" body="Đơn cũ không có snapshot sẽ không được tính lại từ gói hiện tại." />
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const href = carrier ? carrierTripPath(entry.shipmentId) : shipperShipmentPath(entry.shipmentId);
                return (
                  <Link key={entry.shipmentId} to={href} className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-navy">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">{entry.shipmentId}</p>
                      <StatusBadge tone={statusTone(entry.status)}>{statusLabels[entry.status]}</StatusBadge>
                    </div>
                    <p className="mt-3 text-lg font-extrabold text-navy">{entry.feeVnd == null ? "Chưa có số tiền" : money(entry.feeVnd)}</p>
                    <p className="mt-1 text-sm text-muted">
                      {entry.status === "ACCRUED" ? "Đã ghi nhận mô phỏng" : "Ước tính"}
                      {entry.recordedAt ? ` · ${eventTime(entry.recordedAt)}` : entry.lockedAt ? ` · ${eventTime(entry.lockedAt)}` : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
