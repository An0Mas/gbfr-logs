#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function readText(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requireVersion(label, version) {
  if (typeof version !== "string" || version.trim() === "") {
    throw new Error(`${label} is missing a version`);
  }

  return version;
}

function readPackageTomlVersion(relativePath) {
  let inPackageSection = false;

  for (const line of readText(relativePath).split(/\r?\n/)) {
    const section = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (section) {
      inPackageSection = section[1] === "package";
      continue;
    }

    if (!inPackageSection) {
      continue;
    }

    const version = line.match(/^\s*version\s*=\s*"([^"]+)"/);
    if (version) {
      return requireVersion(`${relativePath} [package].version`, version[1]);
    }
  }

  throw new Error(`${relativePath} [package].version was not found`);
}

function readCargoLockPackageVersion(relativePath, packageName) {
  const sections = readText(relativePath).split(/\r?\n(?=\[\[package\]\])/);

  for (const section of sections) {
    const name = section.match(/^\s*name\s*=\s*"([^"]+)"/m);
    if (!name || name[1] !== packageName) {
      continue;
    }

    const version = section.match(/^\s*version\s*=\s*"([^"]+)"/m);
    if (version) {
      return requireVersion(`${relativePath} package ${packageName}`, version[1]);
    }

    throw new Error(`${relativePath} package ${packageName} is missing a version`);
  }

  throw new Error(`${relativePath} package ${packageName} was not found`);
}

function collectVersions() {
  const packageJson = readJson("package.json");
  const packageLock = readJson("package-lock.json");
  const tauriConfig = readJson("src-tauri/tauri.conf.json");

  return [
    ["package.json version", requireVersion("package.json version", packageJson.version)],
    ["package-lock.json version", requireVersion("package-lock.json version", packageLock.version)],
    [
      "package-lock.json root package version",
      requireVersion('package-lock.json packages[""].version', packageLock.packages?.[""]?.version),
    ],
    ["src-tauri/Cargo.toml package version", readPackageTomlVersion("src-tauri/Cargo.toml")],
    [
      "src-tauri/tauri.conf.json package.version",
      requireVersion("src-tauri/tauri.conf.json package.version", tauriConfig.package?.version),
    ],
    ["Cargo.lock gbfr-logs package version", readCargoLockPackageVersion("Cargo.lock", "gbfr-logs")],
  ];
}

try {
  const versions = collectVersions();
  const expected = versions[0][1];
  const mismatches = versions.filter(([, version]) => version !== expected);

  if (mismatches.length > 0) {
    console.error(`Version sync check failed. Expected ${expected}.`);
    for (const [label, version] of versions) {
      const marker = version === expected ? " " : "!";
      console.error(`${marker} ${label}: ${version}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Version sync OK: ${expected}`);
    for (const [label, version] of versions) {
      console.log(`- ${label}: ${version}`);
    }
  }
} catch (error) {
  console.error("Version sync check failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
