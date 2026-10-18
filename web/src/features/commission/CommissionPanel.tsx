import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { useAuth } from "@/features/auth/useAuth";
import { eventTime, money } from "@/features/workspace/format";
import { lostSession } from "@/features/workspace/sessionLoss";
import { DetailBlock, FactLine, StatusBadge } from "@/features/workspace/ui";
import { ApiError } from "@/services/apiClient";
import { getCommissionShipment, type CommissionEntry, type CommissionStatus } from "@/services/commissionService";

const planNames: Record<string, string> = {
  "shipper-free": "Free",
  "shipper-pro-monthly": "Pro tháng",
  "shipper-pro-annual": "Pro năm",
  "shipper-enterprise": "Enterprise",
  "carrier-free": "Free",
  "carrier-pro-monthly": "Pro tháng",
  "carrier-pro-annual": "Pro năm",
  "carrier-business": "Business",
  "carrier-enterprise": "Enterprise",
};

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

function rateText(rateBps: number): string {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(rateBps / 100)}%`;
}

function planText(code: string): string {
  return planNames[code] ?? code;
}

export function CommissionPanel({ shipmentId }: { shipmentId: string }) {
  const { logout, snapshot } = useAuth();
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [banner, setBanner] = useState<string | null>(null);
  const [entry, setEntry] = useState<CommissionEntry | null>(null);
  const historyPath = snapshot.status === "authenticated" && snapshot.user.role === "CARRIER" ? paths.carrierCommission : paths.shipperCommission;
  const carrier = snapshot.status === "authenticated" && snapshot.user.role === "CARRIER";

  useEffect(() => {
    let active = true;
    getCommissionShipment(shipmentId)
      .then((body) => {
        if (!active) return;
        setBanner(body.banner);
        setEntry(body.shipment);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active || lostSession(error, logout)) return;
        setState(error instanceof ApiError && (error.status === 404 || error.status === 403) ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [logout, shipmentId]);

  if (state === "loading") return <p className="text-sm text-muted">Đang tải hoa hồng.</p>;
  if (state === "missing") return <p className="text-sm text-ink">Không có hoa hồng của bạn trên chuyến này.</p>;
  if (state === "error" || !entry) {
    return (
      <p role="alert" className="text-sm text-ink">
        Không tải được hoa hồng. Hãy tải lại trang.
      </p>
    );
  }

  const pending = entry.status !== "ACCRUED" && (entry.outboxStatus === "PENDING" || entry.outboxStatus === "ERROR");

  return (
    <DetailBlock title="Hoa hồng">
      {banner ? <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm font-semibold text-ink">{banner}</p> : null}
      {entry.legacy ? (
        <p className="text-sm leading-relaxed text-ink">Đơn này không có snapshot hoa hồng. Hệ thống không tính lại từ gói hiện tại.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={statusTone(entry.status)}>{statusLabels[entry.status]}</StatusBadge>
            <p className="text-sm text-muted">{entry.status === "ACCRUED" ? "Đã ghi nhận mô phỏng — chưa thu tiền." : "Ước tính — chưa ghi nhận thành khoản phải thu."}</p>
          </div>
          <FactLine term="Giá gốc" value={entry.baseFreightVnd == null ? "Chưa có" : money(entry.baseFreightVnd)} />
          <FactLine term="Gói đã khóa" value={entry.planCode ? planText(entry.planCode) : "Chưa có"} />
          <FactLine term="Tỷ lệ đã khóa" value={entry.rateBps == null ? "Chưa có" : rateText(entry.rateBps)} />
          <FactLine term={carrier ? "Phí nền tảng" : "Hoa hồng"} value={entry.feeVnd == null ? "Chưa có" : money(entry.feeVnd)} />
          <FactLine term={carrier ? "Dự kiến nhận sau phí" : "Tổng chi phí ước tính"} value={entry.settlementVnd == null ? "Chưa có" : money(entry.settlementVnd)} />
          {entry.lockedAt ? <FactLine term="Khóa lúc" value={eventTime(entry.lockedAt)} /> : null}
          {pending ? <p className="text-sm leading-relaxed text-ink">Ghi nhận hoa hồng chưa hoàn tất. Hệ thống sẽ thử lại mà không nhân đôi.</p> : null}
        </>
      )}
      <Link to={historyPath} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Lịch sử hoa hồng
      </Link>
    </DetailBlock>
  );
}
