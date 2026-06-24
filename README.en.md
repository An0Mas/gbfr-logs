# GBFR Logs An0Mas

[日本語](./README.md) | English

[![GitHub Release](https://img.shields.io/github/v/release/An0Mas/gbfr-logs)](https://github.com/An0Mas/gbfr-logs/releases)
[![GitHub Downloads](https://img.shields.io/github/downloads/An0Mas/gbfr-logs/total)](https://github.com/An0Mas/gbfr-logs/releases)
[![Discord](https://img.shields.io/discord/1218833963032776774?style=flat&label=discord&color=7289da)](https://discord.gg/GR4r9zrqJj)
[![GitHub License](https://img.shields.io/github/license/An0Mas/gbfr-logs)](./LICENSE)

<a href="https://www.buymeacoffee.com/an0mas" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

`GBFR Logs An0Mas` is an overlay DPS meter and log viewer for Granblue Fantasy: Relink.

This repository is an unofficial fork of [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs). The An0Mas build is installed as a separate app from the upstream `GBFR Logs` app, with its own app name, identifier, updater endpoint, and data directory.

## Notice

- This is an unofficial fork, so upstream support and stability are not guaranteed.
- Game updates may break parsing, cause crashes, or change the meaning of logged data.
- Report An0Mas build issues in [An0Mas/gbfr-logs Issues](https://github.com/An0Mas/gbfr-logs/issues).
- For upstream information, see [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs).

## Download / Install

1. Open the [An0Mas releases page](https://github.com/An0Mas/gbfr-logs/releases).
2. Download and run the latest `.msi` installer.
3. The `.zip` and `.sig` files are updater verification assets. Use the `.msi` for normal manual installs.
4. Start `GBFR Logs An0Mas` after the game is already running.

The An0Mas build installs as `GBFR Logs An0Mas` and can live side-by-side with the upstream `GBFR Logs` app.

## Data Migration

The An0Mas build does not directly share the upstream database. If you want to migrate existing logs or settings, use `Settings > Data Migration` inside the app.

- Import the detected upstream `logs.db`.
- Import a selected `logs.db` manually.
- Import meter settings from upstream WebView localStorage when available.
- Export or import settings JSON.

If An0Mas data already exists, the app creates a backup before replacing the database during import.

## Screenshots

### DPS Overlay

![Meter](./docs/screenshots/meter.png)

### Skill Tracking

![Meter](./docs/screenshots/skill-tracking.png)

### Historical Logs

![Logs](./docs/screenshots/log-history.png)

### DPS Charts

![Charts](./docs/screenshots/charting.png)

### SBA Tracking

![SBA Tracking](./docs/screenshots/sba-tracking.png)

### Equipment Tracking

![Equipment Loadouts](./docs/screenshots/equipment-tracking.png)

### Multi-language Support

![Simplified Chinese](./docs/screenshots/simplified-chinese.png)

## Settings / Customization

![Settings](./docs/screenshots/settings.png)

## Frequently Asked Questions

### I closed the meter, but it is still running

When you close the windows, `GBFR Logs An0Mas` continues to run in the task tray. You can reopen the logs window later or toggle overlay clickthrough from the tray.

### The meter is not updating or displaying anything

Start the game first, then start `GBFR Logs An0Mas`. If needed, try running the app as administrator.

### The app is not launching

`GBFR Logs An0Mas` uses Microsoft Edge WebView2 Runtime. If WebView2 Runtime is missing or outdated, install the Evergreen Bootstrapper from Microsoft:

https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download

### My antivirus flags the installer or app

This tool injects a DLL into the game process, reads game memory, and hooks game code at runtime. Antivirus software may flag that behavior as suspicious.

Only use the app if you trust it. If needed, add the install folder to your antivirus exclusion list.

Windows Defender exclusions:
https://support.microsoft.com/windows/add-an-exclusion-to-windows-security-811816c0-4dfd-af4a-47e4-c301afe13b26

### How do I update?

The app checks the An0Mas fork updater feed on launch. You can also update manually by downloading the latest `.msi` from the [An0Mas releases page](https://github.com/An0Mas/gbfr-logs/releases) and running it.

### How do I uninstall?

Uninstall `GBFR Logs An0Mas` through the normal Windows apps list. If needed, remove the An0Mas data directory too:

- `%APPDATA%\com.an0mas.gbfr-logs`

This is separate from the upstream data directory.

### How do I add or edit a language?

Read [src-tauri/lang/README.md](./src-tauri/lang/README.md) for language support details.

### My issue is not listed, or I have a suggestion

Create an issue in [An0Mas/gbfr-logs Issues](https://github.com/An0Mas/gbfr-logs/issues). You can also join the [Discord server](https://discord.gg/GR4r9zrqJj) for the broader community.

## For Developers

- Install nightly Rust ([rustup.rs](https://rustup.rs/)) and [Node.js](https://nodejs.org/en/download).
- Install dependencies with `npm ci`.
- Run the dev app with `npm run tauri dev`.

Main project areas:

- `src-hook/`: injected game hook library that broadcasts damage events
- `src-tauri/`: Tauri/Rust backend that communicates with the hooked process and parses logs
- `protocol/`: shared message protocol for the hook and backend
- `src/`: React frontend running inside the Tauri WebView

## Support

If you want to support maintenance of the An0Mas fork, you can use [Buy Me a Coffee](https://www.buymeacoffee.com/an0mas).

## Credits

This project is based on the following projects and contributions:

- [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs): upstream project
- [nyaoouo/GBFR-ACT](https://github.com/nyaoouo/GBFR-ACT): original reverse engineering work
- [Harkain](https://github.com/Harkains): skill name formatting and English translation work

## Disclaimer

This is an unofficial tool intended to improve the Granblue Fantasy: Relink experience provided by Cygames. It modifies and observes the running game client, so it may stop working, crash, or become unstable after game updates. Use it at your own risk.
