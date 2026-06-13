# AGENTS.md

This file contains repository-specific instructions for Codex agents working on the An0Mas fork of `gbfr-logs`.

## Scope And Priority

- These rules apply to this repository and override global AGENTS.md only for repo-specific details.
- Respond in Japanese unless the user asks otherwise.
- Do not print secrets, private key contents, tokens, `.env` values, or local credential material.
- Do not undo user changes or run destructive Git commands unless the user explicitly asks for that exact operation.
- `origin` is `https://github.com/An0Mas/gbfr-logs.git`; `upstream` is `https://github.com/false-spring/gbfr-logs.git`.
- Treat `upstream` as read-only unless the user explicitly changes that policy.

## Environment Assumptions

- Primary development and release verification are done on Windows.
- Paths in this document use Windows-style paths unless otherwise noted.
- Release packaging, MSI install checks, updater checks, and AppData checks must be verified on Windows.

## Toolchain And Dependencies

- Prefer repository-pinned and CI-pinned toolchains when they exist.
- Use `npm ci` instead of `npm install` unless dependency updates are intended.
- Do not update Node, npm, Rust, Tauri, dependencies, or lockfiles unless the task requires it.
- If local tool versions differ from CI or release expectations, mention that in the final report.

## Repo Identity

- This fork ships as `GBFR Logs An0Mas`, side-by-side with upstream `GBFR Logs`.
- Keep the Tauri bundle identifier as `com.an0mas.gbfr-logs` unless the user explicitly requests another app identity.
- Do not switch updater endpoints, README release links, or release assets back to `false-spring/gbfr-logs` unless the task is explicitly about upstream sync.
- README and other user-facing release/install text may contain upstream-oriented links; verify intended target before editing.

## Work And Git Flow

- Use feature branches for code/config/doc changes; do not commit directly to `main` unless the user explicitly asks.
- Use PRs for AI-authored code/config changes.
- If PR creation or push is unavailable, report the branch, commit, diff summary, and blocker instead of changing the merge strategy.
- Keep generated build artifacts out of Git unless the repo already tracks them for that purpose.
- Put temporary logs, scratch notes, and installation logs outside the repository in a local scratch/work directory.
- Before changing release, updater, DB migration, hook/protocol, or parser behavior, check the existing code paths and repository documentation first.

## Initial Triage

Before making changes:

- Run `git status --short --branch`.
- Run `git remote -v` when branch targets, PRs, releases, updater URLs, or upstream sync are involved.
- Confirm `origin` points to `An0Mas/gbfr-logs` before pushing or creating PRs.
- Identify the task risk level from this document and choose the verification plan before editing.
- Read the relevant nearby code and docs before applying edits.
- If required verification cannot run because of environment limits, capture the exact blocker before substituting checks.

## Before Editing

- If existing user changes are present, identify them and do not overwrite them.
- Do not assume generated files, lockfiles, release assets, or `update.json` should change unless the task requires it.

## Stop And Ask

Stop and ask the user before proceeding if:

- A task would change app identity, bundle identifier, updater endpoint, signing keys, release owner, or release repository.
- The intended target is ambiguous between `origin` and `upstream`.
- A DB or settings migration may overwrite, replace, or delete an existing An0Mas DB.
- A release asset, updater signature, Git tag, GitHub Release, or `update.json` value does not match the expected version.
- The task would publish assets, update `update.json`, mark a GitHub Release as latest, or otherwise expose an update to users.
- A signing key is missing, mismatched, or would require printing private key material.

## CI And GitHub Actions

- Do not modify GitHub Actions workflows unless the task explicitly requires it.
- If CI behavior changes, explain the expected impact on build, test, release, and updater workflows.
- Do not add secrets, tokens, certificates, or signing material to workflow files.

## Task Risk Levels

- Docs-only: read relevant docs, edit minimal files, and skip app build/test unless generated docs or checked examples are affected.
- Frontend UI: run `npm run tsc`, `npm run lint`, and `npm run build`.
- Parser/protocol/hook: run `cargo check --verbose`, `cargo test --verbose`, and relevant hook/protocol builds.
- DB migration: verify backup behavior, migration execution, and import/replace behavior with manual notes or tests.
- Release/updater: follow the Release Checklist exactly and do not publish without explicit user approval.

## Implementation Style

- Prefer small, focused changes over broad refactors.
- Preserve existing architecture, naming, and file ownership unless the task explicitly requests redesign.
- Follow nearby patterns before introducing new abstractions.
- Do not add dependencies unless the user approves or the benefit is clearly justified.
- For UI changes, keep behavior and wording consistent with existing components.

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
  - `npm run format-check` is used by CI, but on Windows worktrees it may report Prettier/line-ending noise even when `git diff --exit-code` is clean. Investigate before treating it as a code change.

## Verification Failure Handling

- Do not ignore failed verification commands or replace them with easier checks.
- First record the exact command, failure summary, and whether it looks like a code issue, environment issue, known repository issue, or transient failure.
- Narrow diagnosis is allowed: check the working directory, tool availability, tool versions, PATH, file locks, relevant logs, and known repository notes.
- If the failure is in the task scope, make the smallest relevant fix and rerun the same failing command.
- If the failure appears environment-related, report the blocker and ask before installing tools, changing PATH, updating toolchains, or changing project files.
- Ask before broad fixes such as dependency updates, lockfile rewrites, mass formatting, CI workflow changes, test weakening, lint suppression, or release/updater/DB behavior changes.
- If a fallback or skipped check is unavoidable, label it as a fallback, explain why the standard check failed, and state what should be rerun before merge or release.

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
