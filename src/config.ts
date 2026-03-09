import fs from "node:fs";
import path from "node:path";
import { LcovSimpleRatchetConfig } from "./types";

interface PackageJsonWithConfig {
  lcovSimpleRatchet?: LcovSimpleRatchetConfig;
}

const DEFAULT_LCOV_PATH = "coverage/lcov.info";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function loadConfig(cwd: string = process.cwd()): Required<LcovSimpleRatchetConfig> {
  const packageJsonPath = path.join(cwd, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json was not found at ${packageJsonPath}`);
  }

  const fileContent = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(fileContent) as PackageJsonWithConfig;
  const config = packageJson.lcovSimpleRatchet;

  if (!config) {
    throw new Error(
      "Missing lcovSimpleRatchet config in package.json. Expected: { \"lcovSimpleRatchet\": { \"minimumCoverage\": 80 } }"
    );
  }

  if (!isNumber(config.minimumCoverage) || config.minimumCoverage < 0 || config.minimumCoverage > 100) {
    throw new Error("lcovSimpleRatchet.minimumCoverage must be a number between 0 and 100.");
  }

  if (config.metric && config.metric !== "lines") {
    throw new Error('lcovSimpleRatchet.metric currently supports only "lines".');
  }

  const metric = config.metric ?? "lines";
  const lcovPath = config.lcovPath ?? DEFAULT_LCOV_PATH;

  return {
    minimumCoverage: config.minimumCoverage,
    metric,
    lcovPath
  };
}
