import { Send } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { eventTime } from "@/features/workspace/format";
import { composerAction } from "./composer";
import { senderLabel, type ChatMessage } from "./types";

const POLL_MS = 5000;

export function ChatThread({
  title,
  viewer,
  carrierLabel,
  counterpart,
  route,
  writable,
  threadKey,
  load,
  send,
}: {
  title: string;
  viewer: "SHIPPER" | "CARRIER";
  carrierLabel: string;
  counterpart: string;
  route?: string;
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
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const pinToEnd = useRef(true);
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
    pinToEnd.current = true;
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

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node || !pinToEnd.current) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, state]);

  useLayoutEffect(() => {
    const node = composerRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 112)}px`;
  }, [draft, closed]);

  async function submit() {
    const text = draft;
    if (sending || closed || text.trim().length === 0) return;
    setSending(true);
    setNotice(null);
    try {
      const body = await send(text);
      pinToEnd.current = true;
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

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    const action = composerAction({
      key: event.key,
      shiftKey: event.shiftKey,
      isComposing: event.nativeEvent.isComposing,
      keyCode: event.nativeEvent.keyCode,
    });
    if (action !== "send") return;
    event.preventDefault();
    void submit();
  }

  return (
    <section id="tro-chuyen" className="overflow-hidden rounded-2xl border border-line bg-surface" aria-label={title}>
      <header className="border-b border-line px-4 py-3">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-ink">{counterpart}</p>
        {route ? <p className="mt-1 text-sm text-muted">{route}</p> : null}
        <p className="mt-1 text-xs leading-relaxed text-muted">Nhắn tin không giữ chỗ, không nhận chuyến và không đổi giá niêm yết.</p>
        {closed ? <p className="mt-2 text-sm text-ink">Cuộc trao đổi này không còn nhận tin nhắn mới.</p> : null}
      </header>
      <div
        ref={listRef}
        className="h-80 space-y-3 overflow-y-auto bg-canvas px-4 py-4"
        onScroll={() => {
          const node = listRef.current;
          if (!node) return;
          pinToEnd.current = node.scrollHeight - node.scrollTop - node.clientHeight <= 48;
        }}
      >
        {state === "loading" ? <p className="text-sm text-muted">Đang tải tin nhắn.</p> : null}
        {state === "error" ? (
          <p role="alert" className="text-sm text-ink">
            Không tải được tin nhắn.
          </p>
        ) : null}
        {state === "ready" && messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-ink">Chưa có tin nhắn.</p>
        ) : null}
        {messages.map((message) => {
          const mine = message.senderRole === viewer;
          return (
            <article key={message.id} className={`flex max-w-[85%] flex-col ${mine ? "ml-auto items-end" : "items-start"}`}>
              <p className={`mb-1 text-xs font-semibold ${mine ? "text-navy" : "text-muted"}`}>{senderLabel(message.senderRole, viewer, carrierLabel)}</p>
              <div className={`rounded-2xl px-3 py-2 ${mine ? "rounded-br-md bg-navy text-white" : "rounded-bl-md border border-line bg-surface text-ink"}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>{eventTime(message.createdAt)}</p>
              </div>
            </article>
          );
        })}
      </div>
      {notice ? (
        <p role="alert" className="border-t border-line px-4 py-2 text-sm text-ink">
          {notice}
        </p>
      ) : null}
      {closed ? null : (
        <form
          className="flex items-end gap-2 border-t border-line bg-surface p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="sr-only" htmlFor={`chat-${viewer}`}>
            Soạn tin
          </label>
          <textarea
            ref={composerRef}
            id={`chat-${viewer}`}
            value={draft}
            maxLength={2000}
            rows={1}
            placeholder="Nhập tin nhắn"
            className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-ink"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onComposerKey}
          />
          <button
            type="submit"
            aria-label="Gửi tin nhắn"
            disabled={sending || draft.trim().length === 0}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden="true" />
            {sending ? "Đang gửi" : "Gửi"}
          </button>
        </form>
      )}
    </section>
  );
}
