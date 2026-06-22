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

## Environment-Limited Work

- If the agent is not running on Windows, do not claim Windows-only verification was completed.
- Run platform-independent checks where possible, and report Windows-only checks as skipped with exact reasons.
- Do not install toolchains, rewrite lockfiles, or change project configuration to bypass environment limits without user approval.
- Release, updater, MSI install, and AppData behavior need final Windows verification before merge or publish.

## Toolchain And Dependencies

- Prefer repository-pinned and CI-pinned toolchains when they exist.
- CI currently uses Node 20. The Rust CI job installs current nightly, while repo-local cargo commands are expected to respect `rust-toolchain.toml`.
- Use `npm ci` instead of `npm install` unless dependency updates are intended.
- Do not update Node, npm, Rust, Tauri, dependencies, or lockfiles unless the task requires it.
- Do not rewrite lockfiles as a side effect of local tooling differences.
- If local tool versions differ from CI or release expectations, mention that in the final report.

## Repo Identity

- This fork ships as `GBFR Logs An0Mas`, side-by-side with upstream `GBFR Logs`.
- Keep the Tauri bundle identifier as `com.an0mas.gbfr-logs` unless the user explicitly requests another app identity.
- Do not switch updater endpoints, README release links, or release assets back to `false-spring/gbfr-logs` unless the task is explicitly about upstream sync.
- README and other user-facing release/install text may contain upstream-oriented links; verify intended target before editing.

## Project Map

- Frontend UI: `src/`
- Tauri desktop app, database, and parser: `src-tauri/`
- Game hook: `src-hook/`
- Shared event protocol: `protocol/`
- Updater configuration: `src-tauri/tauri.conf.json` and `update.json`
- Version files: `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and `Cargo.lock`
- CI workflow: `.github/workflows/ci.yaml`
- Release bundles: `target\release\bundle\msi` or the MSI bundle path printed by the Tauri build

## Read When

- Verification commands fail, checks are ambiguous, or CI behavior changes: read `docs/agents/verification.md`.
- Version, release, updater, signing, release assets, or `update.json` are involved: read `docs/agents/release-and-updater.md` before editing.
- DB paths, Settings import, migration, backup, replacement, or AppData behavior are involved: read `docs/agents/db-and-settings-migration.md` before editing.
- Game updates, hook changes, protocol changes, parser changes, or persisted log compatibility are involved: read `docs/agents/game-hook-porting.md` before editing.

## Work And Git Flow

- Use feature branches for code/config/doc changes; do not commit directly to `main` unless the user explicitly asks.
- Use PRs for AI-authored code/config changes.
- If PR creation or push is unavailable, report the branch, commit, diff summary, and blocker instead of changing the merge strategy.
- Keep generated build artifacts out of Git unless the repo already tracks them for that purpose.
- Put temporary logs, scratch notes, and installation logs outside the repository in a local scratch/work directory.
- Before changing release, updater, DB migration, hook/protocol, or parser behavior, check the existing code paths and repository documentation first.

## Initial Triage

Before making changes:

- For read-only review tasks, inspect the requested files first; `git status` is required before editing.
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
- Before editing, pushing, publishing, or creating PRs, the intended target is ambiguous between `origin` and `upstream`.
- A DB or settings migration may overwrite, replace, or delete an existing An0Mas DB.
- A release asset, updater signature, Git tag, GitHub Release, or `update.json` value does not match the expected version.
- The task would publish assets, update `update.json`, mark a GitHub Release as latest, or otherwise expose an update to users.
- A signing key is missing, mismatched, or would require printing private key material.

## CI And GitHub Actions

- Do not modify GitHub Actions workflows unless the task explicitly requires it.
- If CI behavior changes, explain the expected impact on build, test, release, and updater workflows.
- Do not add secrets, tokens, certificates, or signing material to workflow files.

## Task Risk Levels

| Change type                  | Must run                                                                                  | Optional or conditional                                                | Must report                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Docs-only                    | Read the relevant docs and edit minimal files                                             | App build/test only if generated docs or checked examples are affected | Skipped checks and why they are safe to skip                        |
| Frontend UI                  | `docs/agents/verification.md`; normally `npm run tsc`, `npm run lint`, `npm run build`    | `npx vitest run`; screenshots or manual UI notes when behavior changes | UI impact and skipped test rationale                                |
| Parser/protocol/hook         | `docs/agents/game-hook-porting.md`; Rust checks from `docs/agents/verification.md`        | Sample log or game capture replay when available                       | Parser/protocol compatibility and persisted log impact              |
| DB migration/settings import | `docs/agents/db-and-settings-migration.md`; migration/import behavior check when possible | Manual Settings flow notes when UI is involved                         | Data loss risk, backup path, and fallback path                      |
| Release/updater              | `docs/agents/release-and-updater.md`                                                      | Updater check from an installed older An0Mas build when practical      | `update.json`, asset upload, signature, install, and updater status |
| CI/GitHub Actions            | `docs/agents/verification.md` and workflow diff review                                    | CI dry-run or GitHub Actions log review when available                 | Expected build, test, release, and updater workflow impact          |

## Implementation Style

- Prefer small, focused changes over broad refactors.
- Preserve existing architecture, naming, and file ownership unless the task explicitly requests redesign.
- Follow nearby patterns before introducing new abstractions.
- Do not add dependencies unless the user approves or the benefit is clearly justified.
- For UI changes, keep behavior and wording consistent with existing components.

## Definition Of Done

A task is not complete until:

- Relevant files and docs were inspected before editing.
- The chosen task risk level was followed.
- The diff was reviewed and unrelated file changes were avoided.
- Required verification ran, or skipped checks were reported with exact reasons and remaining risk.
- Release, updater, DB, migration, and app identity impact was stated when relevant.
- No secrets, signing material, generated release artifacts, or unrelated build outputs were added.

## Reporting

For substantive work, final reports should include:

- Purpose
- Changes
- Impact
- Verification results
- Skipped checks with reasons
- Release/updater status when relevant

For release work, explicitly state whether `update.json` was changed, whether assets were uploaded, and whether updater verification was performed.
