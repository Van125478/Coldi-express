# Controlled Development update

Status: **READY FOR CONTROLLED DEVELOPMENT UPDATE. DO NOT EXECUTE while the Product Owner is away.**

This plan is for a later fast-forward of `C:\Coldi-Development`. It does not pull, restart, seed, or migrate anything.

## Target

- Project: `C:\Coldi-Development`
- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:4000`
- Database: `coldi_demo_local`

Leave `C:\Coldi` and the `coldi` database untouched.

## Preflight when the Product Owner is present

1. Confirm the Development working tree is clean. Do not stash or discard local work.
2. Record the current branch and full HEAD.
3. Record the new `origin/main` SHA after the approved pull requests have merged.
4. Confirm Development can fast-forward to that SHA. If it has diverged, stop.
5. Read the configuration diff. Expected new settings are in `.env.example`:
   - `CARGO_IMAGE_DIR` as an absolute directory outside the repository. Production must fail closed when it is missing. Development may keep the temporary directory until this is set.
   - No public image URL and no committed uploads.
6. Do not run `npm run migrate:user-identity-indexes` until the backup and checklist in `DRIVER_INDEX_MIGRATION_CHECKLIST.md` are accepted. Creating a second email-less driver on the current Development database can fail until that migration runs.
7. A restart of the frontend and backend is required after the code update so the running processes load the new build. Do not restart during the current incident UAT.
8. Do not drop, seed, or truncate `coldi_demo_local`. Do not change demo passwords. Keep existing shipments, vehicles, drivers, chats, incidents, and any already uploaded files.
9. Smoke test after restart: carrier search `COLDI Demo` with temperature `Đông`, one historical shipment card without a huge empty image, a new shipment image upload, driver username login, and the existing incident `lủng lốp` still openable with its timeline intact.
10. Recovery: if the new processes fail, check out the recorded previous SHA and start the previous processes. Restore the database only from the backup taken before the index migration, and only if that migration was actually run.

Development was still on the pre-commission line when this plan was written. The eventual fast-forward needs commission PR #10 plus the later approved fix pull requests. Do not assume those features are on port 5173 until this update is done.
