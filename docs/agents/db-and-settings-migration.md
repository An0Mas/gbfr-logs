# DB And Settings Migration Guidance

Read this file before changing DB paths, Settings import, migration, backup, replacement, or AppData behavior.

## Database Paths

- An0Mas DB path is `%APPDATA%\com.an0mas.gbfr-logs\logs.db`.
- Upstream legacy DB may exist at `C:\Program Files\GBFR Logs\logs.db`.
- Do not make An0Mas read/write the upstream DB directly as its live database.

## Migration Rules

- Migration should be explicit from Settings and should copy data into the An0Mas DB.
- Returning to upstream should be explicit from Settings and should copy the An0Mas DB into the original `GBFR Logs` DB path.
- Existing An0Mas DB imports should preserve a backup before replacement.
- Never replace an existing An0Mas DB until the backup file has been created and its path is known.
- Prefer importing into a temporary DB file first, then replace the live An0Mas DB only after migration and validation succeed.
- After DB import, migrations must run on the copied DB.
- When exporting back to upstream, preserve a backup of the upstream DB before replacement, include `logs.db-wal` and `logs.db-shm` sidecars when present, and do not run An0Mas migrations against the upstream DB path after replacement.
- Do not make the upstream DB the live An0Mas DB during export-back behavior.
- For settings migration, treat upstream WebView localStorage import as best effort and keep JSON export/import available as fallback.
- When copying or replacing SQLite DB files, account for possible `logs.db-wal` and `logs.db-shm` files, or ensure the app/database is closed and checkpointed before copying.

## Verification

- State the backup path and fallback path when DB import or replacement is involved.
- Verify migration execution and import/replace behavior for DB migration changes.
- Verify export-back behavior creates an upstream backup before replacing the upstream DB and leaves the An0Mas DB readable.
- After migration, verify schema version and that existing user data remains readable.
- Include manual Settings flow notes when UI behavior is involved.
- If a release depends on migration behavior, test Settings > Data Migration before publishing.

## Stop Conditions

Stop and ask before proceeding if a DB or settings migration may overwrite, replace, or delete an existing An0Mas DB.
