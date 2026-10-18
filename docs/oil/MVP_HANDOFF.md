# World Oil Price — technical handoff

This note describes the implementation. It does not replace COLDI Business Documentation v2.10. OIL-01 through OIL-04 stay the business source. v2.10 was not edited.

## Provider verification

Checked on 18 October 2026, without an API key:

| Check | Result |
| --- | --- |
| `GET https://api.eia.gov/v2/petroleum/pri/spt/` | HTTP 403, body `API_KEY_MISSING` |
| `GET https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=invalid&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1` | JSON `API_KEY_INVALID` |
| Documentation | https://www.eia.gov/opendata/documentation.php — APIv2 requires `api_key`. Values are strings since v2.1.6. Pagination uses `offset` and `length`. A response is capped at 5,000 rows. |
| Registration | https://www.eia.gov/opendata/register.php |
| Brent public series page | `https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=D` returned HTTP 200. Title: Europe Brent Spot Price FOB (Dollars per Barrel). |
| WTI public series page | `https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RWTC&f=D` returned HTTP 302. |

No EIA key was present in the environment. A successful data row was not retrieved. Live price comparison is **BLOCKED**. Automated tests use a mock HTTP client. They are not a live integration pass.

The client does not switch to another provider. It does not seed sample prices.

## EIA mapping

Route: `https://api.eia.gov/v2/petroleum/pri/spt/data/`

| Benchmark | Series | Query |
| --- | --- | --- |
| BRENT | `RBRTE` | `frequency=daily`, `data[]=value`, `facets[series][]=RBRTE`, sort `period` descending, `offset=0`, `length=5` |
| WTI | `RWTC` | Same shape, series `RWTC` |

Accepted unit token: `$/BBL` only. A `product-name` must mention barrel, or be the EIA crude name for that series (`UK Brent Crude Oil` for RBRTE, `WTI Crude Oil` for RWTC). Diesel and other product names are rejected. `value` must be a string. A numeric JSON value is treated as a schema mismatch, not coerced. `period` must be a real `YYYY-MM-DD`. `response.frequency` must be `daily`.

`publishedAt` stays null. The spot row does not carry a verified publication timestamp, and `fetchedAt` is not copied into it.

Source links stored and returned are the public EIA series pages above. The API key is never copied into those URLs.

## Schemas

`OilPriceObservation`

- Identity: `(provider, seriesId, frequency, observedDate, revision)`, unique.
- `provider` is `EIA`. `frequency` is `daily`.
- `priceUsdPerBarrel` is a canonical decimal string. Leading zeros and trailing fractional zeros are removed. The value is not stored as a JavaScript number.
- `unit` is `barrel`. `currency` is `USD`.
- `fetchedAt` is written by COLDI. `publishedAt` is null.
- A new price for the same observation date inserts the next revision and marks the previous revision superseded. The same canonical price refreshes `fetchedAt` only.

`OilPriceSyncState`

- One document per series.
- `status`: `OK`, `ERROR`, or `NOT_ATTEMPTED` when no document exists.
- `lastSuccessfulAt` is left in place when a later attempt fails.

`OilSourceSchedule`

- Optional. Freshness uses a document only when `verified` is true.
- Nothing in this MVP inserts a verified calendar. Weekday assumptions are not seeded.

`OilSyncLock`

- Single lock id `eia-oil-sync`, with an owner and a 120 second expiry.
- A second worker skips the run instead of writing a competing observation.

## Sync

`syncOilPrices` runs only on the server. The browser calls `GET /api/market/oil-prices` and never calls EIA.

Each benchmark is fetched and stored on its own. A Brent success is kept when WTI fails, and the two observation dates are not forced to match.

Invalid rows are not written. A newer invalid row does not replace the last valid observation. An empty payload does not delete the cache.

Retries: two extra attempts after the first, only for HTTP 429, HTTP 5xx, network errors, and timeouts. `Retry-After` is honored only when it is between 0 and 5 seconds. Malformed JSON, schema mismatch, and credential errors are not retried. The default timeout is 8 seconds.

Missing `EIA_API_KEY` records `CREDENTIALS` and does not call the network.

The scheduler in `src/index.ts` starts only when MongoDB connected, `OIL_SYNC_ENABLED=true`, `EIA_API_KEY` is non-empty, and `OIL_SYNC_TIMES` lists 2 to 4 distinct `HH:mm` UTC times. Those times are an operator clock. They are not an EIA publication calendar. If any of that is missing, the process still serves the API and the sync state stays `NOT_ATTEMPTED` until a sync is actually attempted.

## Freshness

`evaluateFreshness` is pure.

- No valid observation: `UNAVAILABLE`.
- Observation without a verified calendar: `UNKNOWN`.
- Verified calendar: count expected weekdays after the observation date whose deadline is already past, skipping `excludedDates`. Two or more missed periods: `STALE`. Otherwise `FRESH`.
- `FRESH` means the verified schedule is not overdue. It does not mean a live trade.
- There is no 24 hour or 48 hour cutoff.
- Monday-to-Friday is not assumed unless a verified calendar says so.

Until a reviewed calendar is stored with `verified: true`, a cached price is shown as `UNKNOWN`.

## Read API

`GET /api/market/oil-prices`

- Public. No session required.
- No write route. `POST` falls through to 404.
- Query parameters are ignored. A client cannot supply an upstream URL.
- The handler does not call EIA.
- `Cache-Control: public, max-age=300` on success. A database failure returns HTTP 200 with both benchmarks `UNAVAILABLE` and does not include a stack or the API key.
- Prices are decimal strings or `null`. They are never `0`.
- `publishedAt` is `null`.

## Widget

`WorldOilPriceWidget` is embedded inside the fuel-market panel. Landing and Shipper Home show diesel then Brent/WTI. Carrier and Driver open a dedicated fuel page from the sidebar. Carrier Home no longer mounts a large oil widget.

The widget shows Brent and WTI independently, the observation date, the COLDI fetch time, an EIA link limited to `https://www.eia.gov` or `https://api.eia.gov`, the freshness label, and the disclaimer. Retry calls COLDI again. A failed request shows the unavailable state inside the widget and does not replace the surrounding page.

No change arrow is shown. No history page was added.

## Security and non-interference

The API key is read from the backend environment. URL construction uses it as a query parameter to EIA only. Sync errors pass through redaction before they are stored. The public JSON does not contain the key.

Oil sync does not write shipments, commission ledger events, or incidents. It does not change listed freight, package fees, claim, assignment, GPS, chat, pickup, or delivery.

## Tests

`server/tests/oilPrice.test.ts` covers parsing, freshness, revision, idempotent sync, lock skip, cache retention, guest read, rejected writes, secret redaction, and unchanged logistics counts. The database name is `coldi_oil_price_test`.

## OPEN

- EIA API key and the terms confirmation that comes with a successful authenticated call.
- A live Brent and WTI value checked against the EIA response.
- The exact UTC sync times. `OIL_SYNC_TIMES` is configuration, not an approved publication schedule.
- The verified EIA release calendar, including holidays and the publication deadline. Until that calendar is reviewed and stored, freshness remains `UNKNOWN`.
- Whether `publishedAt` can ever be populated from a field EIA actually returns.
- Rate-limit numbers. The public documentation describes the 5,000-row cap. A numeric quota was not published on the page checked here. The client still backs off on HTTP 429.
