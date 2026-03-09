import { execSync } from "node:child_process";
import { loadConfig, updateMinimumCoverage } from "./config";
import { parseCoverageFromLcov } from "./lcov";

export interface RunRatchetOptions {
  failOnMissingLcov?: boolean;
  autoRatchet?: boolean;
  dryRun?: boolean;
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
    if (options.autoRatchet) {
      if (percentageRounded <= thresholdRounded) {
        return {
          ok: true,
          message: `Coverage check passed: ${percentageRounded}% ${result.metric} >= ${thresholdRounded}% required. Auto-ratchet skipped because minimumCoverage can only increase.`
        };
      }

      if (options.dryRun) {
        return {
          ok: true,
          message: `Coverage check passed: would auto-ratchet lcovSimpleRatchet.minimumCoverage from ${thresholdRounded} to ${percentageRounded} (dry-run).`
        };
      }

      if (!isGitWorkingTreeClean(cwd)) {
        return {
          ok: false,
          message: "Coverage check failed: --auto-ratchet requires a clean git working tree. Commit or stash changes, or use --dry-run."
        };
      }

      updateMinimumCoverage(cwd, percentageRounded);

      return {
        ok: true,
        message: `Coverage check passed: auto-ratcheted lcovSimpleRatchet.minimumCoverage from ${thresholdRounded} to ${percentageRounded}.`
      };
    }

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

function isGitWorkingTreeClean(cwd: string): boolean {
  try {
    const output = execSync("git status --porcelain", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8"
    }).trim();

    return output.length === 0;
  } catch {
    return false;
  }
}
