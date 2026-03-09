import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
});
