# COLDI API

Minimal Node.js backend for the COLDI core MVP. This service does not implement authentication or shipment workflows yet.

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

## Future boundaries

Later APIs will follow the approved COLDI flow: a shipper publishes a shipment, a carrier claims it, that carrier assigns a vehicle and driver, and the assigned driver confirms pickup and delivery.

Only one carrier can successfully claim a published shipment. A claim does not assign a vehicle or driver. Phone or chat contact does not reserve a shipment. GPS does not confirm business milestones. Completion does not mean payment.

Those endpoints are not part of this foundation. Responses should stay independent of MongoDB document shape. Do not add shipment fields or statuses until the approved COLDI documents define them.
