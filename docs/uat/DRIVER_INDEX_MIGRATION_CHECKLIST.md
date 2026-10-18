# Driver identity index migration

Status: **READY AS A CONTROLLED SCRIPT. NOT RUN on `coldi` or `coldi_demo_local`.**

New driver accounts can exist without an email. A legacy unique email index that is not sparse allows only one document with a missing email. Fresh test databases already use the sparse indexes. The Development database must be migrated only when the Product Owner authorizes it.

Command, from `server/`:

```text
USER_INDEX_MIGRATION_CONFIRM=<exact database name> npm run migrate:user-identity-indexes
```

Production also requires `USER_INDEX_MIGRATION_ALLOW_PRODUCTION=yes`. The database name `coldi` is refused even with that flag. `admin`, `local`, and `config` are refused. `coldi_demo_local` runs only when `USER_INDEX_MIGRATION_CONFIRM=coldi_demo_local`.

The script does not rewrite user documents and does not read or replace password hashes.

## Before running

1. Stop writes to user accounts for the maintenance window. Creating a driver during the index swap can fail or race the unique check. A short window is enough; the application process can stay up, but driver creation should wait until verification finishes.
2. Back up the MongoDB database.
3. Confirm the connected database name in the shell before setting the confirm variable.
4. Inspect indexes on `users`. Expect a unique `email_1` that may not be sparse, and possibly no `username_1`.
5. Count duplicate non-empty emails and duplicate non-empty usernames. The script aborts with no index change when either count is greater than zero. Resolve those groups before retrying.

## What the script changes

- Builds the schema indexes: sparse unique `email_1`, sparse unique `username_1`, and the existing `carrierId` index.
- If duplicate values are found, it returns before `syncIndexes`.
- If index creation fails after a drop, it attempts to recreate the previous non-`_id` indexes.
- After success it checks that both identity indexes are unique and sparse.

## After running

1. Confirm `email_1` and `username_1` are unique and sparse.
2. Log in with an existing carrier, shipper, driver email account, and admin account.
3. Create two drivers that have usernames and passwords and no email. Both creates must succeed. A repeated username must be rejected.
4. Reset one of those drivers' passwords as the owning carrier and log in with the new password.
5. Confirm an existing shipment, vehicle, and incident record is unchanged.

## If a step fails

- Do not drop indexes by hand on `coldi` or `coldi_demo_local`.
- If the script aborted for duplicates, the indexes are unchanged. Fix the duplicate users, then run it again.
- If the database is missing the unique email index after a failed run, restore the database from the backup taken in the preflight. Then retry only after the duplicate check is clean.
- The script is safe to run again once the indexes already match the schema.

This checklist was exercised on disposable database `coldi_identity_migration_test` only.
