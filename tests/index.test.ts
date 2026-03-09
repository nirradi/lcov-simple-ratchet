import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { runRatchet } from "../src/index";

const tempDirs: string[] = [];

function createFixture(minimumCoverage: number, covered: number, found: number, ratchetAbove?: number | string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lcov-ratchet-run-"));
  tempDirs.push(dir);

  const lcovSimpleRatchet: Record<string, number | string> = {
    minimumCoverage
  };

  if (ratchetAbove !== undefined) {
    lcovSimpleRatchet.ratchetAbove = ratchetAbove;
  }

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name: "fixture",
        version: "1.0.0",
        lcovSimpleRatchet
      },
      null,
      2
    )
  );

  const coverageDir = path.join(dir, "coverage");
  fs.mkdirSync(coverageDir, { recursive: true });
  fs.writeFileSync(path.join(coverageDir, "lcov.info"), ["TN:", "SF:src/example.ts", `LF:${found}`, `LH:${covered}`, "end_of_record", ""].join("\n"));

  return dir;
}

function readMinimumCoverage(dir: string): number {
  const packageJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) as {
    lcovSimpleRatchet: { minimumCoverage: number };
  };

  return packageJson.lcovSimpleRatchet.minimumCoverage;
}

function initializeGitRepo(dir: string): void {
  execSync("git init", { cwd: dir, stdio: "ignore" });
  execSync("git config user.email test@example.com", { cwd: dir, stdio: "ignore" });
  execSync("git config user.name 'Test User'", { cwd: dir, stdio: "ignore" });
  execSync("git add .", { cwd: dir, stdio: "ignore" });
  execSync("git commit -m 'initial'", { cwd: dir, stdio: "ignore" });
}

function createConfigOnlyFixture(minimumCoverage: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lcov-ratchet-run-"));
  tempDirs.push(dir);

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name: "fixture",
        version: "1.0.0",
        lcovSimpleRatchet: {
          minimumCoverage
        }
      },
      null,
      2
    )
  );

  return dir;
}

function createNoConfigFixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lcov-ratchet-run-"));
  tempDirs.push(dir);

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name: "fixture",
        version: "1.0.0"
      },
      null,
      2
    )
  );

  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("runRatchet", () => {
  it("returns ok=true when coverage meets threshold and stays within ratchet window", () => {
    const dir = createFixture(79, 8, 10);

    const result = runRatchet(dir);

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Coverage check passed");
  });

  it("returns ok=false when coverage is below threshold", () => {
    const dir = createFixture(90, 8, 10);

    const result = runRatchet(dir);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Coverage check failed");
  });

  it("returns ok=false when coverage exceeds ratchetAbove window", () => {
    const dir = createFixture(70, 8, 10);

    const result = runRatchet(dir);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Please raise lcovSimpleRatchet.minimumCoverage");
  });

  it("auto-ratchets minimumCoverage when threshold is exceeded and git tree is clean", () => {
    const dir = createFixture(70, 8, 10);
    initializeGitRepo(dir);

    const result = runRatchet(dir, { autoRatchet: true });

    expect(result.ok).toBe(true);
    expect(result.message).toContain("auto-ratcheted");
    expect(readMinimumCoverage(dir)).toBe(80);
  });

  it("does not write package.json in dry-run mode", () => {
    const dir = createFixture(70, 8, 10);

    const result = runRatchet(dir, { autoRatchet: true, dryRun: true });

    expect(result.ok).toBe(true);
    expect(result.message).toContain("dry-run");
    expect(readMinimumCoverage(dir)).toBe(70);
  });

  it("fails auto-ratchet when git tree is dirty", () => {
    const dir = createFixture(70, 8, 10);
    initializeGitRepo(dir);

    fs.appendFileSync(path.join(dir, "package.json"), "\n");

    const result = runRatchet(dir, { autoRatchet: true });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("clean git working tree");
    expect(readMinimumCoverage(dir)).toBe(70);
  });

  it("returns ok=true when config is missing", () => {
    const dir = createNoConfigFixture();

    const result = runRatchet(dir);

    expect(result.ok).toBe(true);
    expect(result.message).toContain("no lcovSimpleRatchet config found");
  });

  it("returns ok=true when lcov file is missing by default", () => {
    const dir = createConfigOnlyFixture(70);

    const result = runRatchet(dir);

    expect(result.ok).toBe(true);
    expect(result.message).toContain("lcov.info was not found");
  });

  it("throws when lcov file is missing and failOnMissingLcov is enabled", () => {
    const dir = createConfigOnlyFixture(70);

    expect(() => runRatchet(dir, { failOnMissingLcov: true })).toThrow(/LCOV file was not found/);
  });
});
