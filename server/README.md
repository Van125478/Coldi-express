# COLDI API

Minimal Node.js backend for the COLDI core MVP. Authentication is cookie-based. Shipment workflows are not implemented yet.

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
| `npm test` | Run health tests without connecting to MongoDB |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run seed:demo` | Create or update local demo accounts |

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

`shipperId` comes from the session. `status`, `shipperId`, `carrierId`, and `driverId` are rejected if the client sends them. The visitor label for `PUBLISHED` is “Đang tìm xe”.

An authenticated CARRIER lists open shipments at `GET /api/carrier/shipments`, oldest first. `POST /api/carrier/shipments/:id/claim` claims one shipment with a conditional MongoDB update. Success sets `MATCHED` and `carrierId` from the session. A second claim receives 409. The visitor label for `MATCHED` is “Đã có nhà xe nhận chuyến”. The Master Const status table also says “Đã ghép xe”, and the guest journey says “Đã có xe nhận chuyến”. Those guest pages are unchanged. Claim does not assign a vehicle or driver.

## Future boundaries

Vehicle assignment, driver assignment, GPS, and payment are not implemented. Only one carrier can successfully claim a published shipment. A claim does not assign a vehicle or driver. Phone or chat contact does not reserve a shipment. GPS does not confirm business milestones. Completion does not mean payment.

Responses stay independent of MongoDB document shape. Quantity, weight, and pickup time are mentioned in the product flow, but the approved documents do not define their validation rules, so they are not stored yet.
