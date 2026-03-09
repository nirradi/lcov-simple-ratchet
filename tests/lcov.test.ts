import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseCoverageFromLcov } from "../src/lcov";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lcov-ratchet-lcov-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("parseCoverageFromLcov", () => {
  it("parses LF/LH totals from lcov.info", () => {
    const dir = createTempDir();
    const coverageDir = path.join(dir, "coverage");
    fs.mkdirSync(coverageDir, { recursive: true });

    fs.writeFileSync(
      path.join(coverageDir, "lcov.info"),
      ["TN:", "SF:src/a.ts", "LF:10", "LH:9", "end_of_record", "SF:src/b.ts", "LF:5", "LH:2", "end_of_record", ""].join("\n")
    );

    const result = parseCoverageFromLcov("coverage/lcov.info", "lines", dir);

    expect(result.found).toBe(15);
    expect(result.covered).toBe(11);
    expect(result.percentage).toBeCloseTo(73.3333, 3);
  });

  it("throws when file is missing", () => {
    const dir = createTempDir();

    expect(() => parseCoverageFromLcov("coverage/lcov.info", "lines", dir)).toThrow(/LCOV file was not found/);
  });
});
