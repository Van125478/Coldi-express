import { useCallback, useEffect, useState } from "react";
import { ChatThread } from "@/features/workspace/chat/ChatThread";
import type { ChatConversation } from "@/features/workspace/chat/types";
import { getShipperMessages, listShipmentConversations, sendShipperMessage } from "@/services/shipmentService";

export function ShipperChat({ shipmentId }: { shipmentId: string }) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
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

  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-ink">Trao đổi với nhà xe</h2>
      <p className="text-sm text-muted">Nhắn tin không nhận chuyến và không đổi trạng thái đơn. Chỉ thấy cuộc trao đổi của đơn này.</p>
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
        <p className="rounded-2xl border border-dashed border-line bg-surface px-4 py-4 text-sm text-ink">Chưa có nhà xe nào nhắn tin về đơn này.</p>
      ) : null}
      {conversations.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {conversations.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`min-h-11 rounded-full px-4 text-sm font-semibold ${item.id === selectedId ? "bg-navy text-white" : "border border-line text-ink"}`}
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
          title={selected.carrierLabel}
          viewer="SHIPPER"
          carrierLabel={selected.carrierLabel}
          writable={selected.writable}
          threadKey={selected.id}
          load={load}
          send={send}
        />
      ) : null}
    </section>
  );
}
