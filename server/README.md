# COLDI API

Node.js API for the COLDI local workflow on `integration/coldi-v2.3-mvp`. Authentication is cookie-based. A signed-in shipper can publish a shipment. A carrier can search the open board, claim one published shipment, and assign a vehicle and driver. The assigned driver can confirm pickup, send a latest GPS sample while the trip is `IN_TRANSIT`, and then confirm delivery. The shipper and the winning carrier can use a private shipment thread.

This is not a production deployment and it is not the whole v2.3 MVP. These additions are on the integration branch. They are not merged into `main`. Browser acceptance has not been run for this branch.

The shipment event timeline began in commit `cd5045300ac4c788deba3c08053ed1a439481d95`. Core 08, the team setup guide, is `69ec1a198f0729efc10a3d534dd92d264b1738eb`. New `ASSIGNED` events on this branch also store the vehicle label and driver display name from that assignment. Older events without those fields stay readable and still follow the current records.

## Requirements

- Node.js 20.19 or newer
- npm
- MongoDB listening at the URI in `.env`

Docker is optional. A local MongoDB on `127.0.0.1:27017` is enough.

## Setup

```bash
cd server
npm install
cp .env.example .env
```

`.env.example` uses a local database without a username or password:

```text
mongodb://127.0.0.1:27017/coldi
```

Replace that URI locally if your database requires credentials. Do not commit `.env`.

### Optional local MongoDB with Docker

Docker is not required when MongoDB is already running.

```bash
docker compose up -d
```

This publishes MongoDB only on `127.0.0.1:27017` and stores data in a local volume. It does not set a database password.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with reload |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Lint `src` and `tests` |
| `npm test` | Run the test files named in `package.json` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run seed:demo` | Create or update the four local demo accounts |
| `npm run seed:fleet` | Link the demo driver to the demo carrier and ensure one demo vehicle |

`npm test` does not drop the development database `coldi`. Each workflow test file points `MONGODB_URI` at its own database name and refuses to continue if that name does not match. Health tests do not delete a database.

The integration branch test script adds GPS, chat, fleet, security, marketplace, marketplace form, and full lifecycle files to the Core 08 list. A clean worktree of commit `95d913284e854e8af4fd058e9310909b4873370c` reported 51 passed and 0 failed. That run used isolated test databases and did not seed demo accounts. It is not manual UI acceptance. The earlier timeline commit still reported 29 passed for its smaller script.

`npm run seed:demo` rewrites `passwordHash` and `role` for the four demo emails. Use it for a new local database or an intentional reset of those accounts. It does not delete shipments. `npm run seed:fleet` must run after it. This branch does not contain a password-reset script.

The development frontend origin expected by `.env.example` is `http://127.0.0.1:5173`.

## Health

`GET /api/health`

Connected database:

```json
{
  "status": "ok",
  "service": "coldi-api",
  "database": "connected"
}
```

HTTP 200.

Database unavailable:

```json
{
  "status": "degraded",
  "service": "coldi-api",
  "database": "unavailable"
}
```

HTTP 503. The process can stay up so this check remains reachable. `degraded` is not full readiness.

The response never includes the connection URI.

## Authentication

Sessions use an HTTP-only cookie named `coldi_session`. It lasts 12 hours, uses `SameSite=Lax`, and is marked `Secure` only when `NODE_ENV=production`. The signing secret is `AUTH_SECRET` from the local environment. Tokens are not stored in browser `localStorage`.

The React app and this API must share the host `127.0.0.1`. `localhost` and `127.0.0.1` are different sites, so a page opened at `http://localhost:5173` will not send the cookie to `http://127.0.0.1:4000`. `FRONTEND_ORIGIN` must stay `http://127.0.0.1:5173` for local development.

State-changing auth requests reject an `Origin` header that does not match `FRONTEND_ORIGIN`.

| Method | Path | Result |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Sets the cookie and returns `{ "user": { "id", "email", "role" } }` |
| `GET` | `/api/auth/me` | Returns the same user shape, or 401 |
| `POST` | `/api/auth/logout` | Clears the cookie |

Invalid login returns 401 `{ "error": { "code": "invalid_credentials", "message" } }` for both unknown emails and wrong passwords. The role in the database is the only role used. A role sent by the client is ignored.

### Demo accounts

Set the demo emails and passwords in `server/.env`, then run:

```bash
npm run seed:demo
```

The command refuses to run when `NODE_ENV=production`. It upserts by email, so running it again does not create duplicates. Suggested local emails:

- `shipper.demo@coldi.local` — SHIPPER
- `carrier.demo@coldi.local` — CARRIER
- `driver.demo@coldi.local` — DRIVER
- `admin.demo@coldi.local` — ADMIN

Passwords stay in the untracked `.env` file. The script does not print them.

### Known limitations

This authentication setup is for local MVP development. Logout clears the browser cookie, but a previously copied token may remain valid until it expires. Login rate limiting is not implemented. A production deployment needs a separate security review. The React app must currently use `http://127.0.0.1:5173`.

## Shipments

An authenticated SHIPPER can publish a shipment. The listed price is stored as a whole number of Vietnamese đồng (`listedPriceVnd`). This is the displayed freight amount, not a payment or settlement.

| Method | Path | Result |
| --- | --- | --- |
| `POST` | `/api/shipments` | `201` with the created shipment, status `PUBLISHED` |
| `GET` | `/api/shipments/mine` | The caller's shipments |
| `GET` | `/api/shipments/:id` | The shipment when the caller owns it |

`shipperId` comes from the session. `status`, `shipperId`, `carrierId`, `vehicleId`, and `driverId` are rejected if the client sends them. The visitor label for `PUBLISHED` is “Đang tìm xe”.

A new shipment also stores the pickup and delivery warehouse, contact name, phone, optional email, civil date, and time window, plus cargo weight in tons, volume in cubic metres, and package count. Older shipments can omit those fields. The API returns null for a missing value and does not invent one. Carrier responses include the warehouse, phone, schedule, weight, volume, and package count. They omit notification emails and `shipperId`. Phone numbers are shown because the approved load board includes direct contact. No national numbering plan, maximum cargo capacity, degree threshold, or past-date policy is approved. The checks in use are basic: a real calendar date, a time window whose end is later than its start, a delivery date on or after the pickup date, a positive measure with at most three decimal places and at most 100000, and an integer package count from 1 to 1000000. The 100000 ceiling is a storage guard, not a vehicle rule. Map lookup, the B2B address book, suggested vehicle prices, loading services, mandatory POD, declared value, VAT, and credit terms are not implemented.

An authenticated CARRIER lists open shipments at `GET /api/carrier/shipments`, oldest first. `POST /api/carrier/shipments/:id/claim` claims one shipment with a conditional MongoDB update. Success sets `MATCHED` and `carrierId` from the session. A second claim receives 409. The visitor label for an unassigned `MATCHED` shipment is “Đã có nhà xe nhận chuyến”. The Master Const status table also says “Đã ghép xe”, and the guest journey says “Đã có xe nhận chuyến”. Those guest pages are unchanged. Claim does not assign a vehicle or driver.

After a successful claim, the winning carrier lists that shipment at `GET /api/carrier/shipments/claimed`. Eligible resources are `GET /api/carrier/fleet/vehicles` and `GET /api/carrier/fleet/drivers`. A vehicle belongs to one carrier. A driver is eligible only when the user role is `DRIVER` and `carrierId` is that carrier. `POST /api/carrier/shipments/:id/assign` checks those records, then updates the shipment with one conditional MongoDB update. The filter requires the session carrier, status `MATCHED`, and no existing `vehicleId` or `driverId`. The canonical status stays `MATCHED`. When both resources are stored, the operating label is “Chờ lấy hàng”. A second assignment receives 409 and does not replace the first pair. Assignment does not confirm pickup or delivery.

The vehicle and driver documents are not modified by assignment. Only the shipment document changes, so the write does not use a multi-document transaction. `npm run seed:fleet` prepares one local demo vehicle and links the demo driver to the demo carrier. It refuses production and does not print passwords. Run `npm run seed:demo` first.

Reassignment, vehicle compliance, and a full driver profile are still open questions in the v2.3 decisions document, so they are not implemented. The same vehicle or driver may be named on more than one claimed shipment because exclusivity was not specified.

## Driver milestones

An authenticated DRIVER does not browse the load board and cannot claim. These routes are in the pushed commit:

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/driver/shipments` | Trips assigned to the session driver that already have a vehicle |
| `GET` | `/api/driver/shipments/:id` | One of those trips, or 404 |
| `POST` | `/api/driver/shipments/:id/pickup` | From assigned `MATCHED` to `IN_TRANSIT`, with a server pickup time |
| `POST` | `/api/driver/shipments/:id/delivery` | From `IN_TRANSIT` with a pickup time to `DELIVERY_CONFIRMED` |

Another driver, a shipper, or a carrier cannot call these routes successfully. A second pickup or delivery does not move the milestone backward and does not replace the stored time. Delivery does not set `COMPLETED` and does not record a payment.

## Shipment timeline

In the timeline commit, a successful publish, claim, assignment, pickup, or delivery appends one event on the same shipment document. Failed authorization and losing concurrent updates do not append a success event. Detail reads for the owning shipper, the authorized carrier, and the assigned driver return that history.

Event types in that commit are `PUBLISHED`, `CLAIMED`, `ASSIGNED`, `PICKUP_CONFIRMED`, and `DELIVERY_CONFIRMED`. A shipment saved before these fields existed is not rewritten. Its read shows only milestones that already have a stored time, and it says claim and assignment times are not inferred.

The original timeline commit is `cd5045300ac4c788deba3c08053ed1a439481d95`. On this integration branch, a new `ASSIGNED` event also stores `assignedVehicleLabel` and `assignedDriverName` from the server vehicle and driver records. A later fleet rename does not change that sentence. An older event without those fields still uses the current name, so that sentence is not an immutable historical snapshot. Neither case was checked in a browser for this branch.

## Boundaries still open

Only one carrier can successfully claim a published shipment. A claim does not assign a vehicle or driver. Phone or chat contact does not reserve a shipment. GPS stores one latest sample and does not confirm pickup or delivery. There is no geographic map provider. Chat retention and whether a losing carrier should keep reading an old thread are not settled. Fleet editing does not create driver accounts or verify vehicle compliance. Audit rows are written after a successful business update and can be missing if the process stops before the insert. There is no organization tenant. The open load board scans at most 500 shipments and returns at most 100. Delivery does not set `COMPLETED` and does not record a payment.

Responses stay independent of MongoDB document shape. Weight, volume, package count, and the pickup and delivery windows are stored as entered. No approved rule converts units, calculates a price, or rejects a date in the past.
