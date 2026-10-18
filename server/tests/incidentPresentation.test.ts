import assert from "node:assert/strict";
import test from "node:test";
import { formatIncidentWhen, timelineStatusText } from "../../web/src/features/incidents/incidentPresentation.ts";

test("incident timestamps keep a separator between the clock and the date", () => {
  assert.equal(formatIncidentWhen(null), "Chưa có");
  assert.equal(formatIncidentWhen("not-a-date"), "Chưa có");
  assert.equal(formatIncidentWhen("2026-10-18T13:01:00.000Z"), "20:01, 18/10/2026");
});

test("the first incident event shows creation instead of a same-status arrow", () => {
  assert.equal(
    timelineStatusText({
      action: "CREATED",
      statusBeforeLabel: "Chờ tiếp nhận",
      statusAfterLabel: "Chờ tiếp nhận",
    }),
    "Trạng thái ban đầu: Chờ tiếp nhận",
  );
  assert.equal(
    timelineStatusText({
      action: "ACKNOWLEDGED",
      statusBeforeLabel: "Chờ tiếp nhận",
      statusAfterLabel: "Đã tiếp nhận",
    }),
    "Chờ tiếp nhận → Đã tiếp nhận",
  );
  assert.equal(
    timelineStatusText({
      action: "COMMENT",
      statusBeforeLabel: "Đang xử lý",
      statusAfterLabel: "Đang xử lý",
    }),
    "Giữ trạng thái Đang xử lý",
  );
});
