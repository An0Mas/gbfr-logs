# Verification Guidance

Read this file when verification commands fail, checks are ambiguous, CI behavior changes, or a task's risk level points here from `AGENTS.md`.

## Standard Verification

Use the smallest set that matches the change risk, and report skipped checks with reasons.

Frontend/type/lint:

- `npm run tsc`
- `npm run lint`
- `npm run build`

Tests:

- Prefer `npx vitest run` locally.
- `npm test` maps to `vitest` and can stay in watch mode.

Rust:

- `cargo check --verbose`
- For hook, protocol, or parser changes: `cargo build --release --package hook`, `cargo build --verbose`, and `cargo test --verbose`.

Packaging:

- Release candidates require signed `npx tauri build`.

Formatting:

- `npm run format-check` is used by CI.
- On Windows worktrees it may report Prettier or line-ending noise even when `git diff --exit-code` is clean. Investigate before treating it as a code change.

## Verification Failure Handling

- Do not ignore failed verification commands or replace them with easier checks.
- First record the exact command, failure summary, and whether it looks like a code issue, environment issue, known repository issue, or transient failure.
- Narrow diagnosis is allowed: check the working directory, tool availability, tool versions, PATH, file locks, relevant logs, and known repository notes.
- If the failure is in the task scope, make the smallest relevant fix and rerun the same failing command.
- If the failure appears environment-related, report the blocker and ask before installing tools, changing PATH, updating toolchains, or changing project files.
- Ask before broad fixes such as dependency updates, lockfile rewrites, mass formatting, CI workflow changes, test weakening, lint suppression, or release/updater/DB behavior changes.
- If a fallback or skipped check is unavoidable, label it as a fallback, explain why the standard check failed, and state what should be rerun before merge or release.

## CI And GitHub Actions

- Do not modify GitHub Actions workflows unless the task explicitly requires it.
- If CI behavior changes, explain the expected impact on build, test, release, and updater workflows.
- Do not add secrets, tokens, certificates, or signing material to workflow files.
