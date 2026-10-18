import { useCallback, useEffect, useState } from "react";
import { ChatThread } from "@/features/workspace/chat/ChatThread";
import type { ChatConversation } from "@/features/workspace/chat/types";
import { getShipperMessages, listShipmentConversations, openShipperConversation, sendShipperMessage } from "@/services/shipmentService";
import { ApiError } from "@/services/apiClient";
import { Button } from "@/components/ui/button";

export function ShipperChat({ shipmentId, claimed = false, route }: { shipmentId: string; claimed?: boolean; route?: string }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const selected = conversations.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    let active = true;
    listShipmentConversations(shipmentId)
      .then((body) => {
        if (!active) return;
        setConversations(body.conversations);
        setSelectedId((current) => body.conversations.some((item) => item.id === current) ? current : body.conversations[0]?.id ?? null);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [shipmentId, reloadKey]);

  const load = useCallback(
    (after: number) => {
      if (!selected) return Promise.reject(new Error("missing"));
      return getShipperMessages(shipmentId, selected.id, after);
    },
    [selected, shipmentId],
  );

  const send = useCallback(
    (body: string) => {
      if (!selected) return Promise.reject(new Error("missing"));
      return sendShipperMessage(shipmentId, selected.id, body);
    },
    [selected, shipmentId],
  );

  async function openWithCarrier() {
    setOpening(true);
    setOpenError(null);
    try {
      const body = await openShipperConversation(shipmentId);
      setSelectedId(body.conversation.id);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setOpenError(error instanceof ApiError ? error.message : "Không mở được cuộc trao đổi.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <section className="space-y-3">
      {selected ? null : (
        <>
          <h2 className="text-base font-bold text-ink">Trao đổi với nhà xe</h2>
          <p className="text-sm text-muted">Nhắn tin không nhận chuyến và không đổi trạng thái đơn. Chỉ thấy cuộc trao đổi của đơn này.</p>
        </>
      )}
      {state === "loading" ? <p className="text-sm text-muted">Đang tải cuộc trao đổi.</p> : null}
      {state === "error" ? (
        <div role="alert" className="space-y-2">
          <p className="text-sm text-ink">Không tải được cuộc trao đổi.</p>
          <button type="button" className="min-h-11 text-sm font-semibold text-navy underline-offset-4 hover:underline" onClick={() => setReloadKey((value) => value + 1)}>
            Thử lại
          </button>
        </div>
      ) : null}
      {state === "ready" && conversations.length === 0 ? (
        claimed ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-4 py-4">
            <p className="text-sm text-ink">Nhà xe đã nhận đơn. Bạn có thể nhắn tin trước.</p>
            <Button type="button" className="mt-3" disabled={opening} onClick={() => void openWithCarrier()}>
              {opening ? "Đang mở" : "Nhắn tin với nhà xe"}
            </Button>
            {openError ? <p role="alert" className="mt-2 text-sm text-ink">{openError}</p> : null}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-surface px-4 py-4 text-sm text-ink">Chưa có nhà xe nào nhắn tin về đơn này.</p>
        )
      ) : null}
      {conversations.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Cuộc trao đổi theo nhà xe">
          {conversations.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === selectedId}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold ${item.id === selectedId ? "bg-navy text-white" : "border border-line bg-surface text-ink"}`}
              onClick={() => setSelectedId(item.id)}
            >
              {item.carrierLabel}
            </button>
          ))}
        </div>
      ) : null}
      {selected ? (
        <ChatThread
          key={selected.id}
          title="Trao đổi với nhà xe"
          viewer="SHIPPER"
          carrierLabel={selected.carrierLabel}
          counterpart={selected.carrierLabel}
          route={route}
          writable={selected.writable}
          threadKey={selected.id}
          load={load}
          send={send}
        />
      ) : null}
    </section>
  );
}
