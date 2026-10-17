import { eventTime } from "@/features/workspace/format";
import { DetailBlock } from "@/features/workspace/ui";
import type { ShipmentTimeline as Timeline } from "@/models/publishedShipment";

export function ShipmentTimeline({ timeline, technical = true }: { timeline: Timeline | undefined; technical?: boolean }) {
  const legacy = Boolean(timeline && (timeline.completeness === "partial" || timeline.events.some((event) => !event.recorded)));

  return (
    <DetailBlock title="Lịch sử sự kiện">
      {!timeline ? <p className="text-sm text-ink">Chưa nhận được lịch sử sự kiện.</p> : null}
      {timeline && timeline.events.length === 0 ? <p className="text-sm text-ink">Chưa có mốc nào được ghi lại.</p> : null}
      {legacy ? <p className="text-sm leading-relaxed text-muted">Các mốc này lấy từ dữ liệu đã lưu, không phải nhật ký ghi tại từng thời điểm.</p> : null}
      {technical && timeline?.note ? (
        <details className="text-sm text-muted">
          <summary className="cursor-pointer font-semibold text-ink">Vì sao không đủ mốc</summary>
          <p className="mt-2 leading-relaxed">{timeline.note}</p>
        </details>
      ) : null}
      {timeline && timeline.events.length > 0 ? (
        <ol className="space-y-5">
          {timeline.events.map((event) => (
            <li key={event.id} className="border-l-2 border-line pl-4">
              <p className="text-sm font-semibold text-ink">{event.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                <time dateTime={event.occurredAt}>{eventTime(event.occurredAt)}</time>
                {" · "}
                {event.actorLabel}
              </p>
              <p className="mt-2 text-sm text-ink">{event.statusAfterLabel}</p>
              {event.detail ? <p className="mt-1 text-sm leading-relaxed text-muted">{event.detail}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </DetailBlock>
  );
}
