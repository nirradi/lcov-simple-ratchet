import { loadConfig } from "./config";
import { parseCoverageFromLcov } from "./lcov";

export interface RunRatchetOptions {
  failOnMissingLcov?: boolean;
}

function isMissingLcovError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("LCOV file was not found");
}

export function runRatchet(cwd: string = process.cwd(), options: RunRatchetOptions = {}): { ok: boolean; message: string } {
  const config = loadConfig(cwd);

  if (!config) {
    return {
      ok: true,
      message: "Coverage check skipped: no lcovSimpleRatchet config found in package.json."
    };
  }

  let result;

  try {
    result = parseCoverageFromLcov(config.lcovPath, config.metric, cwd);
  } catch (error) {
    if (isMissingLcovError(error) && !options.failOnMissingLcov) {
      return {
        ok: true,
        message: "Coverage check skipped: lcov.info was not found."
      };
    }

    throw error;
  }

  const percentageRounded = Number(result.percentage.toFixed(2));
  const thresholdRounded = Number(config.minimumCoverage.toFixed(2));
  const improvement = Number((percentageRounded - thresholdRounded).toFixed(2));

  if (percentageRounded < thresholdRounded) {
    return {
      ok: false,
      message: `Coverage check failed: ${percentageRounded}% ${result.metric} < ${thresholdRounded}% required.`
    };
  }

  if (improvement >= config.ratchetAbove) {
    return {
      ok: false,
      message: `Coverage check failed: ${percentageRounded}% ${result.metric} improved by ${improvement}% (>= ${config.ratchetAbove}% ratchetAbove). Please raise lcovSimpleRatchet.minimumCoverage to at least ${percentageRounded}.`
    };
  }

  return {
    ok: true,
    message: `Coverage check passed: ${percentageRounded}% ${result.metric} >= ${thresholdRounded}% required and within ${config.ratchetAbove}% ratchet window.`
  };
}
