import { eventTime } from "@/features/workspace/format";
import { DetailBlock } from "@/features/workspace/ui";
import type { ShipmentTimeline as Timeline } from "@/models/publishedShipment";

export function ShipmentTimeline({ timeline }: { timeline: Timeline | undefined }) {
  return (
    <DetailBlock title="Lịch sử sự kiện">
      {!timeline ? <p className="text-sm text-ink">Chưa nhận được lịch sử sự kiện.</p> : null}
      {timeline?.note ? <p className="text-sm leading-relaxed text-muted">{timeline.note}</p> : null}
      {timeline && timeline.events.length === 0 ? <p className="text-sm text-ink">Chưa có mốc nào được ghi lại.</p> : null}
      {timeline && timeline.events.length > 0 ? (
        <ol className="max-h-96 space-y-4 overflow-y-auto pr-1">
          {timeline.events.map((event) => (
            <li key={event.id} className="border-l-2 border-line pl-4">
              <p className="text-sm font-semibold text-ink">{event.label}</p>
              <p className="mt-1 text-sm text-muted">
                <time dateTime={event.occurredAt}>{eventTime(event.occurredAt)}</time>
                {" · "}
                {event.actorLabel}
              </p>
              <p className="mt-1 text-sm text-ink">Trạng thái đơn: {event.statusAfterLabel}</p>
              {event.detail ? <p className="mt-1 text-sm leading-relaxed text-muted">{event.detail}</p> : null}
              {event.recorded ? null : <p className="mt-1 text-xs leading-relaxed text-muted">Mốc đọc từ dữ liệu đã lưu, không phải bản ghi sự kiện mới.</p>}
            </li>
          ))}
        </ol>
      ) : null}
    </DetailBlock>
  );
}
