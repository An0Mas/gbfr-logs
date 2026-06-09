# AGENTS.md

This file contains repository-specific instructions for Codex agents working on the An0Mas fork of `gbfr-logs`.

## Scope And Priority

- These rules apply to this repository and override global AGENTS.md only for repo-specific details.
- Respond in Japanese unless the user asks otherwise.
- Do not print secrets, private key contents, tokens, `.env` values, or local credential material.
- Do not undo user changes or run destructive Git commands unless the user explicitly asks for that exact operation.
- `origin` is `https://github.com/An0Mas/gbfr-logs.git`; `upstream` is `https://github.com/false-spring/gbfr-logs.git`.
- Treat `upstream` as read-only unless the user explicitly changes that policy.

## Repo Identity

- This fork ships as `GBFR Logs An0Mas`, side-by-side with upstream `GBFR Logs`.
- Keep the Tauri bundle identifier as `com.an0mas.gbfr-logs` unless the user explicitly requests another app identity.
- Do not switch updater endpoints, README release links, or release assets back to `false-spring/gbfr-logs` unless the task is explicitly about upstream sync.
- The README still contains upstream-oriented links; verify intended target before editing user-facing release/install text.

## Work And Git Flow

- Use feature branches for code/config/doc changes; do not commit directly to `main` unless the user explicitly asks.
- Use PRs for AI-authored code/config changes.
- Keep generated build artifacts out of Git unless the repo already tracks them for that purpose.
- Put temporary logs, scratch notes, and installation logs under `C:\AI_Work\.ai-work\codex-work\<YYYYMMDD>-<task>`, not in the repo.
- Before changing release, updater, DB migration, hook/protocol, or parser behavior, check the existing code paths and the Vault project note if available.

## Standard Verification

Use the smallest set that matches the change risk, and report skipped checks with reasons.

- Frontend/type/lint:
  - `npm run tsc`
  - `npm run lint`
  - `npm run build`
- Tests:
  - Prefer `npx vitest run` locally. `npm test` maps to `vitest` and can stay in watch mode.
- Rust:
  - `cargo check --verbose`
  - For hook/protocol/parser changes: `cargo build --release --package hook`, `cargo build --verbose`, and `cargo test --verbose`
- Packaging:
  - Release candidates require signed `npx tauri build`.
- Formatting:
  - `npm run format-check` is used by CI, but on this Windows workspace it may report Prettier/line-ending noise even when `git diff --exit-code` is clean. Investigate before treating it as a code change.

## Version Management

When changing the app version, keep these files in sync:

- `package.json`
- `package-lock.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `Cargo.lock` entry for the `gbfr-logs` package

Do not update `update.json` as part of the normal version bump. Update it only after the GitHub Release asset URL and updater signature are final.

Before release, confirm:

- `package.json` version equals `src-tauri/Cargo.toml` version.
- `src-tauri/tauri.conf.json` `package.version` equals the intended release version.
- `Cargo.lock` contains the same `gbfr-logs` package version.
- Git tag, GitHub Release tag, asset names, and `update.json` version all refer to the same release.
- `update.json` URL exactly matches the uploaded updater zip asset name.

## Tauri Updater And Signing

- Updater endpoint must remain `https://raw.githubusercontent.com/An0Mas/gbfr-logs/main/update.json` for An0Mas releases.
- The updater public key lives in `src-tauri/tauri.conf.json`.
- The updater private key must not be committed or printed. If signing locally, load it only into the current process environment.
- Release assets must include:
  - MSI installer
  - updater `.msi.zip`
  - updater `.msi.zip.sig`
- The `.sig` must correspond to the exact updater zip uploaded to the release.
- If asset filenames are renamed during upload, update `update.json` with the actual GitHub asset URL, not the local path assumption.

## Release Checklist

Use this order for An0Mas releases:

1. Start from clean `main` matching `origin/main`.
2. Confirm version files are synchronized.
3. Run required verification for the touched areas.
4. Run signed `npx tauri build`.
5. Confirm generated MSI, updater zip, and signature exist under `target\release\bundle\msi`.
6. Install the MSI locally before publishing.
7. Confirm Windows shows upstream `GBFR Logs` and `GBFR Logs An0Mas` as separate apps.
8. Confirm install locations are separate:
   - Upstream: `C:\Program Files\GBFR Logs\`
   - An0Mas: `C:\Program Files\GBFR Logs An0Mas\`
9. Launch `GBFR Logs An0Mas` once and confirm it creates `%APPDATA%\com.an0mas.gbfr-logs\logs.db`.
10. Confirm upstream `C:\Program Files\GBFR Logs\logs.db` was not modified by An0Mas startup.
11. Test Settings > Data Migration before publishing an update that changes DB/settings migration behavior.
12. Create or update the GitHub Release on `An0Mas/gbfr-logs`.
13. Upload MSI, updater zip, and signature.
14. Only after assets are uploaded, update `update.json` with the new version, pub date, signature, and final updater zip URL.
15. Verify updater behavior from an installed older An0Mas build when practical.

## Database And Settings Migration

- An0Mas DB path is `%APPDATA%\com.an0mas.gbfr-logs\logs.db`.
- Upstream legacy DB may exist at `C:\Program Files\GBFR Logs\logs.db`.
- Do not make An0Mas read/write the upstream DB directly as its live database.
- Migration should be explicit from Settings and should copy data into the An0Mas DB.
- Existing An0Mas DB imports should preserve a backup before replacement.
- After DB import, migrations must run on the copied DB.
- For settings migration, treat upstream WebView localStorage import as best effort and keep JSON export/import available as fallback.

## New Game Or Patch Support

- Game update work usually touches `src-hook`, `protocol`, `src-tauri/src/parser`, and UI/log display code.
- First compare upstream `false-spring/gbfr-logs` and any known reverse-engineering references before inventing new protocol behavior.
- Prefer preserving existing protocol/event shapes when new data can be represented without breaking stored logs.
- If parser or protocol changes affect persisted logs, add or update DB migrations and include migration verification.

## Reporting

For substantive work, final reports should include:

- Purpose
- Changes
- Impact
- Verification results
- Skipped checks with reasons
- Release/updater status when relevant

For release work, explicitly state whether `update.json` was changed, whether assets were uploaded, and whether updater verification was performed.
