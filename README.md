# GBFR Logs An0Mas

日本語 | [English](./README.en.md)

[![GitHub Release](https://img.shields.io/github/v/release/An0Mas/gbfr-logs)](https://github.com/An0Mas/gbfr-logs/releases)
[![GitHub Downloads](https://img.shields.io/github/downloads/An0Mas/gbfr-logs/total)](https://github.com/An0Mas/gbfr-logs/releases)
[![Discord](https://img.shields.io/discord/1218833963032776774?style=flat&label=discord&color=7289da)](https://discord.gg/GR4r9zrqJj)
[![GitHub License](https://img.shields.io/github/license/An0Mas/gbfr-logs)](./LICENSE)

<a href="https://www.buymeacoffee.com/an0mas" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

`GBFR Logs An0Mas` は、Granblue Fantasy: Relink 向けのオーバーレイDPSメーター / ログビューアーです。

このリポジトリは [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs) の非公式forkです。An0Mas版は upstream 版の `GBFR Logs` とは別アプリとしてインストールされ、アプリ名、識別子、更新先、データ保存先を An0Mas fork 用に分離しています。

## 注意

- 非公式forkのため、upstream 版と同じサポートや安定性は保証されません。
- ゲームのアップデートにより、メーターが動かない、クラッシュする、ログの意味が変わる可能性があります。
- An0Mas版の不具合は [An0Mas/gbfr-logs の Issues](https://github.com/An0Mas/gbfr-logs/issues) に報告してください。
- upstream 版に関する情報は [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs) を確認してください。

## ダウンロード / インストール

1. [An0Mas版のReleases](https://github.com/An0Mas/gbfr-logs/releases) を開きます。
2. 最新リリースの `.msi` インストーラーをダウンロードして実行します。
3. `.zip` と `.sig` はアップデーター検証用のファイルです。通常の手動インストールでは `.msi` を使ってください。
4. ゲームを起動した後に `GBFR Logs An0Mas` を起動します。

An0Mas版は `GBFR Logs An0Mas` としてインストールされます。upstream 版の `GBFR Logs` とは別アプリとして並存できます。

## データ移行

An0Mas版は upstream 版のデータベースを直接共有しません。既存のログや設定を移したい場合は、アプリ内の `Settings > Data Migration` を使って明示的にインポートしてください。

- 検出された upstream 版の `logs.db` をインポートできます。
- 任意の `logs.db` を手動選択してインポートできます。
- upstream 版の WebView localStorage にあるメーター設定を、可能な範囲でインポートできます。
- 設定JSONのエクスポート / インポートができます。

既存の An0Mas版データがある場合、DBインポート前にバックアップが作成されます。

## スクリーンショット

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

## よくある質問

### メーターを閉じたのに、まだ起動している

ウィンドウを閉じても、`GBFR Logs An0Mas` はタスクトレイに残ります。タスクトレイからログ画面を開き直したり、オーバーレイのクリック透過を切り替えたりできます。

### メーターが更新されない / 何も表示されない

ゲームを起動してから `GBFR Logs An0Mas` を起動してください。必要に応じて管理者権限での起動も試してください。

### アプリが起動しない

`GBFR Logs An0Mas` は Microsoft Edge WebView2 Runtime を使います。WebView2 Runtime が古い、または未インストールの場合は、Microsoftのページから Evergreen Bootstrapper をインストールしてください。

https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download

### ウイルス対策ソフトに検知される

このツールはゲームプロセスへDLLを注入し、ゲームメモリを読み取り、実行時にゲームコードへフックします。その性質上、ウイルス対策ソフトが誤検知することがあります。

信頼できると判断した場合のみ使用してください。必要に応じてインストール先をウイルス対策ソフトの除外設定に追加してください。

Windows Defender の除外設定:
https://support.microsoft.com/windows/add-an-exclusion-to-windows-security-811816c0-4dfd-af4a-47e4-c301afe13b26

### 更新方法

アプリ起動時に An0Mas fork の更新情報を確認します。手動で更新する場合は、[An0Mas版のReleases](https://github.com/An0Mas/gbfr-logs/releases) から最新の `.msi` をダウンロードして実行してください。

### アンインストール方法

Windowsの通常のアプリ一覧から `GBFR Logs An0Mas` をアンインストールできます。必要に応じて、An0Mas版のデータフォルダも削除してください。

- `%APPDATA%\com.an0mas.gbfr-logs`

upstream 版のデータフォルダとは別です。

### 言語を追加 / 編集したい

[src-tauri/lang/README.md](./src-tauri/lang/README.md) を参照してください。

### 不具合報告 / 要望

An0Mas版の不具合や要望は [An0Mas/gbfr-logs の Issues](https://github.com/An0Mas/gbfr-logs/issues) に作成してください。Discordコミュニティに参加する場合は [Discord server](https://discord.gg/GR4r9zrqJj) を利用できます。

## 開発者向け

- nightly Rust ([rustup.rs](https://rustup.rs/)) と [Node.js](https://nodejs.org/en/download) をインストールします。
- 依存関係は `npm ci` でインストールします。
- 開発起動は `npm run tauri dev` を使います。

主な構成:

- `src-hook/`: ゲームへ注入され、ダメージイベントを配信するライブラリ
- `src-tauri/`: hookプロセスと通信し、ログ解析を行うTauri/Rustバックエンド
- `protocol/`: hookとバックエンドで共有するメッセージプロトコル
- `src/`: Tauri WebView上で動くReactフロントエンド

## 支援

`GBFR Logs An0Mas` のfork運用を支援したい場合は、[Buy Me a Coffee](https://www.buymeacoffee.com/an0mas) から支援できます。

## Credits

このプロジェクトは以下のプロジェクトと貢献に基づいています。

- [false-spring/gbfr-logs](https://github.com/false-spring/gbfr-logs): upstream project
- [nyaoouo/GBFR-ACT](https://github.com/nyaoouo/GBFR-ACT): original reverse engineering work
- [Harkain](https://github.com/Harkains): skill name formatting and English translation work

## Disclaimer

このツールは Cygames が提供する Granblue Fantasy: Relink の体験を補助する目的の非公式ツールです。ゲームクライアントを変更・監視するため、ゲームアップデート後に動作しなくなる、クラッシュする、または不安定になる可能性があります。使用は自己責任で行ってください。
