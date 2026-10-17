import { useCallback, useState } from "react";
import { ChatThread } from "@/features/workspace/chat/ChatThread";
import type { ChatConversation } from "@/features/workspace/chat/types";
import { getCarrierMessages, openCarrierConversation, sendCarrierMessage } from "@/services/shipmentService";

export function CarrierChat({ shipmentId, route }: { shipmentId: string; route?: string }) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [openState, setOpenState] = useState<"closed" | "opening" | "ready" | "error">("closed");

  const load = useCallback(
    (after: number) => {
      if (!conversation) return Promise.reject(new Error("missing"));
      return getCarrierMessages(conversation.id, after);
    },
    [conversation],
  );

  const send = useCallback(
    (body: string) => {
      if (!conversation) return Promise.reject(new Error("missing"));
      return sendCarrierMessage(conversation.id, body);
    },
    [conversation],
  );

  async function open() {
    setOpenState("opening");
    try {
      const body = await openCarrierConversation(shipmentId);
      setConversation(body.conversation);
      setOpenState("ready");
    } catch {
      setOpenState("error");
    }
  }

  if (openState !== "ready" || !conversation) {
    return (
      <div id="tro-chuyen" className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-base font-bold text-ink">Nhắn chủ hàng</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">Tin nhắn chỉ giữa nhà xe này và chủ hàng của đơn. Gửi tin không nhận chuyến.</p>
        {openState === "error" ? (
          <p role="alert" className="mt-3 text-sm text-ink">
            Không mở được cuộc trao đổi.
          </p>
        ) : null}
        <button type="button" className="mt-3 min-h-11 rounded-xl border border-line px-4 text-sm font-semibold text-navy" onClick={() => void open()}>
          {openState === "opening" ? "Đang mở" : "Mở trao đổi"}
        </button>
      </div>
    );
  }

  return (
    <ChatThread
      title="Nhắn chủ hàng"
      viewer="CARRIER"
      carrierLabel={conversation.carrierLabel}
      counterpart="Chủ hàng"
      route={route}
      writable={conversation.writable}
      threadKey={conversation.id}
      load={load}
      send={send}
    />
  );
}
