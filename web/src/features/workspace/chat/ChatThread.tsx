import { useEffect, useRef, useState } from "react";
import { eventTime } from "@/features/workspace/format";
import { senderLabel, type ChatMessage } from "./types";

const POLL_MS = 5000;

export function ChatThread({
  title,
  viewer,
  carrierLabel,
  writable,
  threadKey,
  load,
  send,
}: {
  title: string;
  viewer: "SHIPPER" | "CARRIER";
  carrierLabel: string;
  writable: boolean;
  threadKey: string;
  load: (after: number) => Promise<{ messages: ChatMessage[]; writable: boolean }>;
  send: (body: string) => Promise<{ message: ChatMessage }>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [closed, setClosed] = useState(!writable);
  const afterRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const scope = `${threadKey}:${writable}`;
  const [seenScope, setSeenScope] = useState(scope);
  if (seenScope !== scope) {
    setSeenScope(scope);
    setMessages([]);
    setState("loading");
    setClosed(!writable);
  }

  useEffect(() => {
    let active = true;
    let timer = 0;
    afterRef.current = 0;
    async function tick() {
      if (!active) return;
      if (document.visibilityState === "hidden") {
        timer = window.setTimeout(() => void tick(), POLL_MS);
        return;
      }
      try {
        const page = await load(afterRef.current);
        if (!active) return;
        setClosed(!page.writable);
        setMessages((current) => {
          const seen = new Set(current.map((item) => item.id));
          const added = page.messages.filter((item) => !seen.has(item.id));
          const next = afterRef.current === 0 && current.length === 0 ? page.messages : [...current, ...added];
          const last = next[next.length - 1];
          if (last) afterRef.current = last.sequence;
          return next;
        });
        setState("ready");
        setNotice(null);
      } catch {
        if (!active) return;
        setState((current) => (current === "loading" ? "error" : current));
        setNotice("Không tải được tin nhắn.");
      }
      if (active) timer = window.setTimeout(() => void tick(), POLL_MS);
    }
    void tick();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [load, threadKey, writable]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function submit() {
    const text = draft;
    if (sending || text.trim().length === 0) return;
    setSending(true);
    setNotice(null);
    try {
      const body = await send(text);
      setDraft("");
      setMessages((current) => (current.some((item) => item.id === body.message.id) ? current : [...current, body.message]));
      afterRef.current = Math.max(afterRef.current, body.message.sequence);
      setState("ready");
    } catch {
      setNotice("Không gửi được tin nhắn. Nội dung vẫn còn trong ô soạn.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="tro-chuyen" className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">Nhắn tin không giữ chỗ, không nhận chuyến và không đổi giá niêm yết.</p>
      {state === "loading" ? <p className="mt-3 text-sm text-muted">Đang tải tin nhắn.</p> : null}
      {state === "error" ? (
        <p role="alert" className="mt-3 text-sm text-ink">
          Không tải được tin nhắn.
        </p>
      ) : null}
      {state === "ready" && messages.length === 0 ? <p className="mt-3 text-sm text-ink">Chưa có tin nhắn.</p> : null}
      <div ref={listRef} className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => {
          const mine = message.senderRole === viewer;
          return (
            <article key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-2 ${mine ? "ml-auto bg-navy text-white" : "bg-canvas text-ink"}`}>
              <p className={`text-xs font-semibold ${mine ? "text-white/80" : "text-navy"}`}>{senderLabel(message.senderRole, viewer, carrierLabel)}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
              <p className={`mt-1 text-xs ${mine ? "text-white/70" : "text-muted"}`}>{eventTime(message.createdAt)}</p>
            </article>
          );
        })}
      </div>
      {closed ? <p className="mt-3 text-sm text-ink">Cuộc trao đổi này không còn nhận tin nhắn mới.</p> : null}
      {notice ? (
        <p role="status" className="mt-3 text-sm text-ink">
          {notice}
        </p>
      ) : null}
      {closed ? null : (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="block text-sm font-semibold text-ink" htmlFor={`chat-${viewer}`}>
            Soạn tin
          </label>
          <textarea
            id={`chat-${viewer}`}
            value={draft}
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" disabled={sending || draft.trim().length === 0} className="min-h-11 rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60">
            {sending ? "Đang gửi" : "Gửi tin nhắn"}
          </button>
        </form>
      )}
    </div>
  );
}
