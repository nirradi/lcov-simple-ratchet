#!/usr/bin/env node
import { runRatchet } from "./index";

function parseArgs(argv: string[]): { failOnMissingLcov: boolean; autoRatchet: boolean; dryRun: boolean } {
  return {
    failOnMissingLcov: argv.includes("--fail-on-missing-lcov"),
    autoRatchet: argv.includes("--auto-ratchet"),
    dryRun: argv.includes("--dry-run")
  };
}

function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = runRatchet(process.cwd(), options);

    if (!result.ok) {
      console.error(result.message);
      process.exitCode = 1;
      return;
    }

    console.log(result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`lcov-simple-ratchet error: ${message}`);
    process.exitCode = 1;
  }
}

main();
