# Game Hook And Porting Guidance

Read this file before game update work, hook changes, protocol changes, parser changes, or persisted log compatibility changes.

## Change Surface

Game update work usually touches:

- `src-hook`
- `protocol`
- `src-tauri/src/parser`
- UI or log display code under `src`

## Investigation Order

- First compare upstream `false-spring/gbfr-logs` and any known reverse-engineering references before inventing new protocol behavior.
- Start with the game-dependent `src-hook` layer before changing UI behavior.
- Prefer preserving existing protocol/event shapes when new data can be represented without breaking stored logs.
- If new combat behavior changes the meaning of existing Damage, DPS, SBA, stun, or skill breakdown fields, state the compatibility impact explicitly.

## Persisted Logs And Migrations

- If parser or protocol changes affect persisted logs, add or update DB migrations and include migration verification.
- If the change needs DB or Settings migration behavior, also read `docs/agents/db-and-settings-migration.md`.

## Verification

- Run `cargo check --verbose` and `cargo test --verbose` for parser, protocol, or hook changes.
- For hook changes, include relevant hook/protocol builds such as `cargo build --release --package hook` and `cargo build --verbose`.
- Use sample log or game capture replay when available.
- Report parser/protocol compatibility and persisted log impact.
