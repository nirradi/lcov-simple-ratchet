import fs from "node:fs";
import path from "node:path";
import { CoverageResult, CoverageMetric } from "./types";

const LF_PREFIX = "LF:";
const LH_PREFIX = "LH:";

function parseNumberAfterPrefix(line: string, prefix: string): number | null {
  if (!line.startsWith(prefix)) {
    return null;
  }

  const value = Number(line.slice(prefix.length));
  return Number.isFinite(value) ? value : null;
}

export function parseCoverageFromLcov(
  lcovPath: string,
  metric: CoverageMetric,
  cwd: string = process.cwd()
): CoverageResult {
  if (metric !== "lines") {
    throw new Error(`Unsupported metric: ${metric}`);
  }

  const resolvedPath = path.isAbsolute(lcovPath) ? lcovPath : path.join(cwd, lcovPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`LCOV file was not found at ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, "utf8");
  const lines = content.split(/\r?\n/);

  let found = 0;
  let covered = 0;

  for (const line of lines) {
    const foundValue = parseNumberAfterPrefix(line, LF_PREFIX);
    if (foundValue !== null) {
      found += foundValue;
      continue;
    }

    const coveredValue = parseNumberAfterPrefix(line, LH_PREFIX);
    if (coveredValue !== null) {
      covered += coveredValue;
    }
  }

  if (found === 0) {
    throw new Error(`No line coverage data (LF/LH) found in ${resolvedPath}`);
  }

  const percentage = (covered / found) * 100;

  return {
    metric,
    covered,
    found,
    percentage
  };
}
