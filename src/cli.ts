#!/usr/bin/env node
import { runRatchet } from "./index";

function main(): void {
  try {
    const result = runRatchet();

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
