# PKG-BIZ-01 — Approved pricing policy delta

Status: **APPROVED**. This is the versioned policy-change record for the next business-documentation release after v2.10.

Business Documentation v2.10 is not edited by this record.

## Approved published prices

No annual Enterprise package is approved.

| Plan | Billing | Published price | Commission | Vehicle quota |
|---|---|---|---|---|
| Shipper Free | None | 0 VND | 5% (500 bps) | Not a carrier plan |
| Shipper Pro Monthly | Month | 799.000 VND | 4% (400 bps) | Not a carrier plan |
| Shipper Pro Annual | Year | 7.990.000 VND | 3,5% (350 bps) | Not a carrier plan |
| Shipper Enterprise | Month | 6.990.000 VND | 2,5% (250 bps) | No vehicle quota |
| Carrier Free | None | 0 VND | 5% (500 bps) | 2 ACTIVE |
| Carrier Pro Monthly | Month | 799.000 VND | 4% (400 bps) | 10 ACTIVE |
| Carrier Pro Annual | Year | 9.990.000 VND | 3,5% (350 bps) | 10 ACTIVE |
| Carrier Business | Month | 2.990.000 VND | 3% (300 bps) | 30 ACTIVE |
| Carrier Enterprise | Month | 7.990.000 VND | 2% (200 bps) | 100 ACTIVE |

Free, Pro Monthly, and Pro Annual prices, periods, commission, and vehicle entitlements stay as previously approved.

## How the prices apply

- The server catalog is the source for the public price, commission, billing period, and vehicle quota.
- A new eligible subscription stores these published terms.
- An existing subscription keeps the price, commission, vehicle cap, plan version, and billing period already stored on that subscription.
- A published plan version is immutable. A later catalog approval appends a new revision and does not rewrite an older revision.
- A commission snapshot and ledger event already stored for a shipment stay unchanged.
- The website does not collect payment. `paymentCollected` remains false. Demo activation, where the server allows it, is not a settlement.
- Guest visitors can read `/goi-dich-vu`. That page does not activate a package.
- Shipper Enterprise does not receive a carrier vehicle quota.

## Not decided here

Image retention, production payment, and a production mid-term switch between paid plans remain outside this approval.
