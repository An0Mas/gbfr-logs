# Release And Updater Guidance

Read this file before changing versions, release assets, updater behavior, signing, GitHub Releases, or `update.json`.

## Version Management

When changing the app version, keep these files in sync:

- `package.json`
- `package-lock.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `Cargo.lock` entry for the `gbfr-logs` package

Do not update `update.json` as part of the normal version bump. Update it only after the GitHub Release asset URL and updater signature are final.

Because the updater endpoint reads `update.json` from `main`, do not merge or push `update.json` changes to `main` until release assets and signatures are final and the update is intended to be visible to users.

Prefer separating version-bump changes from publish, asset upload, and `update.json` changes unless the user explicitly requests a full release.

Do not rewrite, delete, or force-update release tags unless the user explicitly asks for that exact operation.

Before changing `update.json`, record the previous values so the update can be rolled back if verification fails.

Before release, confirm:

- `package.json` version equals `src-tauri/Cargo.toml` version.
- `src-tauri/tauri.conf.json` `package.version` equals the intended release version.
- `Cargo.lock` contains the same `gbfr-logs` package version.
- `npm run check:version` passes for version file synchronization.
- Git tag, GitHub Release tag, asset names, and `update.json` version all refer to the same release.
- `update.json` URL exactly matches the uploaded updater zip asset name.
- `update.json` shape, pub date, and timestamp format match the updater configuration.

## Tauri Updater And Signing

- Updater endpoint must remain `https://raw.githubusercontent.com/An0Mas/gbfr-logs/main/update.json` for An0Mas releases.
- The updater public key lives in `src-tauri/tauri.conf.json`.
- The updater private key must not be committed or printed.
- If signing locally, load the private key only into the current process environment.
- Release assets must include:
  - MSI installer
  - updater `.msi.zip`
  - updater `.msi.zip.sig`
- The `.sig` must correspond to the exact updater zip uploaded to the release.
- When copying the signature into `update.json`, use the signature generated for the exact updater zip uploaded to the release.
- If asset filenames are renamed during upload, update `update.json` with the actual GitHub asset URL, not the local path assumption.
- Do not mark a GitHub Release as latest or publish a draft release until assets, signature, and `update.json` target are consistent.

## Release Checklist

Use this order for An0Mas releases:

1. Run `git fetch origin`, then start from clean `main` matching `origin/main`.
2. Confirm version files are synchronized.
3. Run required verification for the touched areas.
4. Run signed `npx tauri build`.
5. Confirm generated MSI, updater zip, and signature exist under the MSI bundle path printed by `npx tauri build`, currently `target\release\bundle\msi`.
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
15. Merge or push `update.json` to `main` only when the update is intended to be visible to users.
16. Verify updater behavior from an installed older An0Mas build when practical.

## Reporting

For release work, explicitly state whether `update.json` was changed, whether assets were uploaded, and whether updater verification was performed.
