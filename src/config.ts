import fs from "node:fs";
import path from "node:path";
import { LcovSimpleRatchetConfig, ResolvedLcovSimpleRatchetConfig } from "./types";

interface PackageJsonWithConfig {
  lcovSimpleRatchet?: LcovSimpleRatchetConfig;
  [key: string]: unknown;
}

const DEFAULT_LCOV_PATH = "coverage/lcov.info";
const DEFAULT_RATCHET_ABOVE = 2;

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseRatchetAbove(value: unknown): number {
  if (value === undefined) {
    return DEFAULT_RATCHET_ABOVE;
  }

  let parsed: number;

  if (isNumber(value)) {
    parsed = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    const normalized = trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed;
    parsed = Number(normalized);
  } else {
    throw new Error("lcovSimpleRatchet.ratchetAbove must be a number or percentage string like \"2%\".");
  }

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error("lcovSimpleRatchet.ratchetAbove must be between 0 and 100.");
  }

  return parsed;
}

function getPackageJsonPath(cwd: string): string {
  return path.join(cwd, "package.json");
}

function readPackageJson(cwd: string): PackageJsonWithConfig {
  const packageJsonPath = getPackageJsonPath(cwd);

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json was not found at ${packageJsonPath}`);
  }

  const fileContent = fs.readFileSync(packageJsonPath, "utf8");
  return JSON.parse(fileContent) as PackageJsonWithConfig;
}

export function loadConfig(cwd: string = process.cwd()): ResolvedLcovSimpleRatchetConfig | null {
  const packageJson = readPackageJson(cwd);
  const config = packageJson.lcovSimpleRatchet;

  if (!config) {
    return null;
  }

  if (!isNumber(config.minimumCoverage) || config.minimumCoverage < 0 || config.minimumCoverage > 100) {
    throw new Error("lcovSimpleRatchet.minimumCoverage must be a number between 0 and 100.");
  }

  if (config.metric && config.metric !== "lines") {
    throw new Error('lcovSimpleRatchet.metric currently supports only "lines".');
  }

  const metric = config.metric ?? "lines";
  const lcovPath = config.lcovPath ?? DEFAULT_LCOV_PATH;
  const ratchetAbove = parseRatchetAbove(config.ratchetAbove);

  return {
    minimumCoverage: config.minimumCoverage,
    metric,
    lcovPath,
    ratchetAbove
  };
}

export function updateMinimumCoverage(cwd: string, minimumCoverage: number): void {
  const packageJson = readPackageJson(cwd);

  if (!packageJson.lcovSimpleRatchet) {
    throw new Error("Cannot update minimumCoverage: lcovSimpleRatchet config is missing in package.json.");
  }

  packageJson.lcovSimpleRatchet.minimumCoverage = minimumCoverage;

  const packageJsonPath = getPackageJsonPath(cwd);
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}
