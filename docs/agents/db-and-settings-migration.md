# DB And Settings Migration Guidance

Read this file before changing DB paths, Settings import, migration, backup, replacement, or AppData behavior.

## Database Paths

- An0Mas DB path is `%APPDATA%\com.an0mas.gbfr-logs\logs.db`.
- Upstream legacy DB may exist at `C:\Program Files\GBFR Logs\logs.db`.
- Do not make An0Mas read/write the upstream DB directly as its live database.

## Migration Rules

- Migration should be explicit from Settings and should copy data into the An0Mas DB.
- Existing An0Mas DB imports should preserve a backup before replacement.
- After DB import, migrations must run on the copied DB.
- For settings migration, treat upstream WebView localStorage import as best effort and keep JSON export/import available as fallback.

## Verification

- State the backup path and fallback path when DB import or replacement is involved.
- Verify migration execution and import/replace behavior for DB migration changes.
- Include manual Settings flow notes when UI behavior is involved.
- If a release depends on migration behavior, test Settings > Data Migration before publishing.

## Stop Conditions

Stop and ask before proceeding if a DB or settings migration may overwrite, replace, or delete an existing An0Mas DB.
