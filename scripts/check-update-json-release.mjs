#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.cwd();
const defaultOwner = "An0Mas";
const defaultRepo = "gbfr-logs";
const platformKey = "windows-x86_64";
const supportedPlatformKeys = new Set([platformKey]);
const semverPattern =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const rfc3339Pattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/;

function usage() {
  return `Usage: npm run check:release -- [--tag <tag>] [--owner <owner>] [--repo <repo>] [--update-json <path>]

Checks that update.json points to the expected GitHub Release and that the release
contains the matching MSI, updater zip, and signature assets.

Defaults:
  --owner       ${defaultOwner}
  --repo        ${defaultRepo}
  --update-json update.json
  --tag         update.json version`;
}

function parseArgs(argv) {
  const options = {
    owner: defaultOwner,
    repo: defaultRepo,
    updateJsonPath: "update.json",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--tag" || arg === "--owner" || arg === "--repo" || arg === "--update-json") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value`);
      }

      if (arg === "--tag") {
        options.tag = value;
      } else if (arg === "--owner") {
        options.owner = value;
      } else if (arg === "--repo") {
        options.repo = value;
      } else {
        options.updateJsonPath = value;
      }

      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function readJsonFile(relativePath) {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), "utf8"));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isObjectRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTauriSemVer(value) {
  return semverPattern.test(value);
}

function isRfc3339DateTime(value) {
  const match = value.match(rfc3339Pattern);
  if (!match) {
    return false;
  }

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    offsetText,
    offsetHourText,
    offsetMinuteText,
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return false;
  }

  if (hour > 23 || minute > 59 || second > 59) {
    return false;
  }

  if (offsetText !== "Z" && (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59)) {
    return false;
  }

  return true;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseReleaseDownloadUrl(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    return { error: "update.json updater URL is not a valid URL" };
  }

  const segments = parsed.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const hasReleaseDownloadShape =
    parsed.hostname === "github.com" &&
    segments.length >= 6 &&
    segments[2] === "releases" &&
    segments[3] === "download";

  if (!hasReleaseDownloadShape) {
    return { error: "update.json updater URL must be a github.com release download URL" };
  }

  return {
    assetName: segments.slice(5).join("/"),
    owner: segments[0],
    repo: segments[1],
    tag: segments[4],
  };
}

function assetMapFor(release) {
  if (!Array.isArray(release?.assets)) {
    return new Map();
  }

  return new Map(release.assets.map((asset) => [asset.name, asset]));
}

function requireAsset(problems, assets, assetName, label) {
  const asset = assets.get(assetName);

  if (!asset) {
    problems.push(`GitHub Release is missing ${label} asset ${assetName}`);
    return undefined;
  }

  if (typeof asset.size === "number" && asset.size <= 0) {
    problems.push(`GitHub Release ${label} asset ${assetName} is empty`);
  }

  return asset;
}

export function validateReleaseUpdate({
  expectedOwner,
  expectedRepo,
  expectedTag,
  release,
  signatureAssetText,
  updateJson,
}) {
  const problems = [];
  const version = updateJson?.version;
  const tag = expectedTag ?? version;
  const platforms = updateJson?.platforms;
  const platform = isObjectRecord(platforms) ? platforms[platformKey] : undefined;
  const signature = platform?.signature;
  const updaterUrl = platform?.url;

  if (!isNonEmptyString(version)) {
    problems.push("update.json version is missing");
  } else if (!isTauriSemVer(version)) {
    problems.push(`update.json version ${version} must be valid SemVer with an optional leading v`);
  }

  if (!isNonEmptyString(tag)) {
    problems.push("release tag is missing; pass --tag or set update.json version");
  } else if (isNonEmptyString(version) && version !== tag) {
    problems.push(`update.json version ${version} does not match expected tag ${tag}`);
  }

  if (!isNonEmptyString(updateJson?.pub_date)) {
    problems.push("update.json pub_date is missing");
  } else if (!isRfc3339DateTime(updateJson.pub_date)) {
    problems.push("update.json pub_date must be RFC3339 when present");
  }

  if (!isObjectRecord(platforms)) {
    problems.push("update.json platforms must be an object");
  } else {
    for (const key of Object.keys(platforms)) {
      if (!supportedPlatformKeys.has(key)) {
        problems.push(`update.json contains unsupported platform ${key}; only ${platformKey} is supported`);
      }
    }
  }

  if (!platform) {
    problems.push(`update.json platforms.${platformKey} is missing`);
  }

  if (!isNonEmptyString(signature)) {
    problems.push(`update.json platforms.${platformKey}.signature is missing`);
  }

  if (!isNonEmptyString(updaterUrl)) {
    problems.push(`update.json platforms.${platformKey}.url is missing`);
  }

  const parsedUrl = isNonEmptyString(updaterUrl) ? parseReleaseDownloadUrl(updaterUrl) : undefined;
  if (parsedUrl?.error) {
    problems.push(parsedUrl.error);
  }

  if (parsedUrl && !parsedUrl.error) {
    if (parsedUrl.owner !== expectedOwner || parsedUrl.repo !== expectedRepo) {
      problems.push(
        `update.json updater URL points to ${parsedUrl.owner}/${parsedUrl.repo}, expected ${expectedOwner}/${expectedRepo}`
      );
    }

    if (isNonEmptyString(tag) && parsedUrl.tag !== tag) {
      problems.push(`update.json updater URL tag ${parsedUrl.tag} does not match expected tag ${tag}`);
    }

    if (!parsedUrl.assetName.endsWith(".msi.zip")) {
      problems.push(`update.json updater URL asset ${parsedUrl.assetName} must end with .msi.zip`);
    }
  }

  if (!release || typeof release !== "object") {
    problems.push("GitHub Release response is missing");
    return problems;
  }

  if (isNonEmptyString(tag) && release.tag_name !== tag) {
    problems.push(`GitHub Release tag ${release.tag_name ?? "<missing>"} does not match expected tag ${tag}`);
  }

  if (release.draft) {
    problems.push("GitHub Release is a draft; updater assets are not public");
  }

  const assets = assetMapFor(release);
  const updaterAssetName = parsedUrl && !parsedUrl.error ? parsedUrl.assetName : undefined;

  if (updaterAssetName) {
    const msiAssetName = updaterAssetName.endsWith(".zip")
      ? updaterAssetName.slice(0, -".zip".length)
      : `${updaterAssetName}.msi`;
    const signatureAssetName = `${updaterAssetName}.sig`;

    requireAsset(problems, assets, msiAssetName, "MSI installer");
    requireAsset(problems, assets, updaterAssetName, "updater zip");
    requireAsset(problems, assets, signatureAssetName, "signature");

    if (
      isNonEmptyString(signature) &&
      signatureAssetText !== undefined &&
      signatureAssetText.trim() !== signature.trim()
    ) {
      problems.push("update.json signature does not match the .sig release asset");
    }
  }

  return problems;
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: requestHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchText(url, token) {
  const response = await fetch(url, {
    headers: requestHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`GitHub asset request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function requestHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "gbfr-logs-release-check",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function findSignatureAsset(updateJson, release) {
  const updaterUrl = updateJson?.platforms?.[platformKey]?.url;
  const parsedUrl = isNonEmptyString(updaterUrl) ? parseReleaseDownloadUrl(updaterUrl) : undefined;

  if (!parsedUrl || parsedUrl.error) {
    return undefined;
  }

  return assetMapFor(release).get(`${parsedUrl.assetName}.sig`);
}

async function main() {
  if (typeof fetch !== "function") {
    throw new Error("This script requires Node 18+ fetch support. CI uses Node 20.");
  }

  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return;
  }

  const updateJson = readJsonFile(options.updateJsonPath);
  const tag = options.tag ?? updateJson.version;
  const token = process.env.GITHUB_TOKEN;
  const releaseApiUrl = `https://api.github.com/repos/${options.owner}/${options.repo}/releases/tags/${encodeURIComponent(
    tag
  )}`;

  const release = await fetchJson(releaseApiUrl, token);
  const signatureAsset = findSignatureAsset(updateJson, release);
  const signatureAssetText = signatureAsset?.browser_download_url
    ? await fetchText(signatureAsset.browser_download_url, token)
    : undefined;

  const problems = validateReleaseUpdate({
    expectedOwner: options.owner,
    expectedRepo: options.repo,
    expectedTag: tag,
    release,
    signatureAssetText,
    updateJson,
  });

  if (problems.length > 0) {
    console.error("Release update check failed.");
    for (const problem of problems) {
      console.error(`! ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  const updaterUrl = updateJson.platforms[platformKey].url;
  const assetNames = release.assets.map((asset) => asset.name).sort();

  console.log(`Release update check OK: ${tag}`);
  console.log(`- update.json: ${options.updateJsonPath}`);
  console.log(`- updater URL: ${updaterUrl}`);
  console.log("- release assets:");
  for (const assetName of assetNames) {
    console.log(`  - ${assetName}`);
  }
}

function isDirectRun() {
  return (
    import.meta.url.startsWith("file:") &&
    process.argv[1] &&
    fileURLToPath(import.meta.url) === resolve(process.argv[1])
  );
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error("Release update check failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
