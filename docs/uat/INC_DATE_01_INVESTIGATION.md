# INC-DATE-01 — Incident occurrence time

Status: **INVESTIGATED. No new business rule.**

Observed during browser UAT on shipment `#EA4009` / incident `lủng lốp`:

- Shipment created 18/10/2026.
- Incident `Xảy ra lúc` displayed 16/10/2026.
- The report itself was created 18/10/2026.

## What the code does

- The field is optional. The create form sends `occurredAt` only when the input is non-empty.
- An omitted value, `null`, or `""` is stored as `null`. It is not replaced by the shipment time or the report time.
- A non-empty value is parsed with `new Date(value)`. `datetime-local` has no timezone, so the browser treats it as the browser's local time and the client sends the UTC instant via `toISOString()`.
- The only automatic rejection is an occurrence more than five minutes in the future. An occurrence earlier than the shipment is accepted. That matches the current approved behavior: the reporter may know when it happened.
- `Báo lúc` is the server report time. `Xảy ra lúc` is the optional occurrence instant. The detail page reads those two fields separately.
- Display now formats the stored instant in `Asia/Ho_Chi_Minh` as `HH:mm, dd/MM/yyyy`. The stored value is not rewritten.

## Conclusion

The 16/10/2026 occurrence is consistent with a value entered in the optional field, then shown back. There is not a parser that invents 16/10 from an empty input or from the shipment created date. No code change forbids an earlier occurrence, because that rule has not been approved.

Product Owner re-UAT can confirm by creating one incident with the occurrence field left empty (`Xảy ra lúc` should be `Chưa có`) and one with an explicit earlier time.
