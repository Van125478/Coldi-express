import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type ClaimConfirmProps = {
  open: boolean;
  pending: boolean;
  cargo: string;
  route: string;
  price?: string;
  temperature?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClaimConfirm({ open, pending, cargo, route, price, temperature, onCancel, onConfirm }: ClaimConfirmProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1E293B]/40 p-4 sm:items-center">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-confirm-title"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 outline-none"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !pending) onCancel();
        }}
      >
        <h2 id="claim-confirm-title" className="text-lg font-bold text-ink">
          Xác nhận nhận chuyến
        </h2>
        <p className="mt-3 text-base font-semibold text-ink">{route}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink">{cargo}</p>
        {temperature ? <p className="mt-1 text-sm text-muted">{temperature}</p> : null}
        {price ? <p className="mt-2 text-lg font-extrabold text-navy">{price}</p> : null}
        <p className="mt-3 text-sm leading-relaxed text-ink">Nhận chuyến khóa đơn cho nhà xe này. Chưa gán xe hay tài xế. Gọi điện và nhắn tin không giữ chỗ.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Để sau
          </Button>
          <Button type="button" disabled={pending} onClick={onConfirm}>
            {pending ? "Đang nhận chuyến" : "Xác nhận nhận chuyến"}
          </Button>
        </div>
      </div>
    </div>
  );
}
