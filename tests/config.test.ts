import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lcov-ratchet-config-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("loadConfig", () => {
  it("loads valid config and applies defaults", () => {
    const dir = createTempDir();

    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "fixture",
          version: "1.0.0",
          lcovSimpleRatchet: {
            minimumCoverage: 82
          }
        },
        null,
        2
      )
    );

    const config = loadConfig(dir);

    expect(config.minimumCoverage).toBe(82);
    expect(config.metric).toBe("lines");
    expect(config.lcovPath).toBe("coverage/lcov.info");
  });

  it("throws when config is missing", () => {
    const dir = createTempDir();

    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "fixture", version: "1.0.0" }, null, 2));

    expect(() => loadConfig(dir)).toThrow(/Missing lcovSimpleRatchet config/);
  });

  it("throws when minimumCoverage is invalid", () => {
    const dir = createTempDir();

    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "fixture",
          version: "1.0.0",
          lcovSimpleRatchet: {
            minimumCoverage: 101
          }
        },
        null,
        2
      )
    );

    expect(() => loadConfig(dir)).toThrow(/minimumCoverage must be a number between 0 and 100/);
  });
});
