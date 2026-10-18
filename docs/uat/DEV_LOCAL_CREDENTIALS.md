# Local demo credentials

Status: guidance only. This file contains no passwords.

The unified Development app reads `C:\Coldi-Development\server\.env`. That file stays gitignored and was not edited by this change. Copy the variable names below into that file locally when a password needs to be set. Do not commit the filled file.

## Where to look

| Account | Email variable | Password variable |
|---|---|---|
| Shipper | `DEMO_SHIPPER_EMAIL` | `DEMO_SHIPPER_PASSWORD` |
| Carrier | `DEMO_CARRIER_EMAIL` | `DEMO_CARRIER_PASSWORD` |
| Driver | `DEMO_DRIVER_EMAIL` | `DEMO_DRIVER_PASSWORD` |
| Admin | `DEMO_ADMIN_EMAIL` | `DEMO_ADMIN_PASSWORD` |

Placeholders for the same names are grouped at the bottom of `server/.env.example`.

The server does not create these accounts on startup and does not reset their passwords on restart. `npm run seed:demo` is manual.

## Seed behavior

- Database `coldi` is always refused.
- Database `coldi_demo_local` is refused unless `DEMO_CREDENTIAL_SYNC_DATABASE` equals that exact name.
- An existing account keeps its password.
- A missing account is created once.
- `DEMO_CREDENTIAL_SYNC=confirm` updates an existing password only when `DEMO_CREDENTIAL_SYNC_DATABASE` equals the connected database name.
- The script does not print passwords.

This delivery did not run the seed and did not change `coldi` or `coldi_demo_local`.

## Username drivers on an existing database

New driver accounts use a sparse unique index on `email` and `username`. A database created before that index still has a non-sparse unique email index. Username-only drivers will fail to be created there until the index is rebuilt.

`npm run migrate:user-identity-indexes` rebuilds indexes only. It does not update user documents or password hashes. It runs only when `USER_INDEX_MIGRATION_CONFIRM` equals the connected database name. Production also requires `USER_INDEX_MIGRATION_ALLOW_PRODUCTION=yes`.

This delivery did not run that command. Product Owner re-UAT of new driver accounts on `coldi_demo_local` needs an explicit decision to run it against that database first.
