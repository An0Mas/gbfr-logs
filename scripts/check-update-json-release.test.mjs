import { describe, expect, it } from "vitest";

import { validateReleaseUpdate } from "./check-update-json-release.mjs";

const updateJson = {
  version: "1.8.1",
  notes: "An0Mas fork updater bootstrap release.",
  pub_date: "2026-05-29T22:13:30+00:00",
  platforms: {
    "windows-x86_64": {
      signature: "signature-content",
      url: "https://github.com/An0Mas/gbfr-logs/releases/download/1.8.1/GBFR.Logs_1.8.1_x64_en-US.msi.zip",
    },
  },
};

const release = {
  tag_name: "1.8.1",
  draft: false,
  assets: [
    {
      name: "GBFR.Logs_1.8.1_x64_en-US.msi",
      size: 100,
      browser_download_url: "https://github.com/An0Mas/gbfr-logs/releases/download/1.8.1/GBFR.Logs_1.8.1_x64_en-US.msi",
    },
    {
      name: "GBFR.Logs_1.8.1_x64_en-US.msi.zip",
      size: 100,
      browser_download_url:
        "https://github.com/An0Mas/gbfr-logs/releases/download/1.8.1/GBFR.Logs_1.8.1_x64_en-US.msi.zip",
    },
    {
      name: "GBFR.Logs_1.8.1_x64_en-US.msi.zip.sig",
      size: 100,
      browser_download_url:
        "https://github.com/An0Mas/gbfr-logs/releases/download/1.8.1/GBFR.Logs_1.8.1_x64_en-US.msi.zip.sig",
    },
  ],
};

function validate(overrides = {}) {
  return validateReleaseUpdate({
    expectedOwner: "An0Mas",
    expectedRepo: "gbfr-logs",
    expectedTag: "1.8.1",
    release,
    signatureAssetText: "signature-content",
    updateJson,
    ...overrides,
  });
}

describe("validateReleaseUpdate", () => {
  it("accepts a matching update.json and GitHub Release asset set", () => {
    expect(validate()).toEqual([]);
  });

  it("rejects an updater URL that points at the wrong release repo", () => {
    const problems = validate({
      updateJson: {
        ...updateJson,
        platforms: {
          "windows-x86_64": {
            ...updateJson.platforms["windows-x86_64"],
            url: "https://github.com/false-spring/gbfr-logs/releases/download/1.8.1/GBFR.Logs_1.8.1_x64_en-US.msi.zip",
          },
        },
      },
    });

    expect(problems).toContain("update.json updater URL points to false-spring/gbfr-logs, expected An0Mas/gbfr-logs");
  });

  it("requires MSI, updater zip, and signature release assets", () => {
    const problems = validate({
      release: {
        ...release,
        assets: release.assets.filter((asset) => !asset.name.endsWith(".sig")),
      },
    });

    expect(problems).toContain("GitHub Release is missing signature asset GBFR.Logs_1.8.1_x64_en-US.msi.zip.sig");
  });

  it("rejects a signature asset that does not match update.json", () => {
    const problems = validate({ signatureAssetText: "different-signature" });

    expect(problems).toContain("update.json signature does not match the .sig release asset");
  });

  it("rejects an update.json version that is not valid SemVer", () => {
    const problems = validate({
      expectedTag: "release-candidate",
      updateJson: {
        ...updateJson,
        version: "release-candidate",
        platforms: {
          "windows-x86_64": {
            ...updateJson.platforms["windows-x86_64"],
            url: "https://github.com/An0Mas/gbfr-logs/releases/download/release-candidate/GBFR.Logs_1.8.1_x64_en-US.msi.zip",
          },
        },
      },
      release: {
        ...release,
        tag_name: "release-candidate",
      },
    });

    expect(problems).toContain("update.json version release-candidate must be valid SemVer with an optional leading v");
  });

  it("rejects a pub_date that is parseable but not RFC3339", () => {
    const problems = validate({
      updateJson: {
        ...updateJson,
        pub_date: "June 23, 2026",
      },
    });

    expect(problems).toContain("update.json pub_date must be RFC3339 when present");
  });
});
