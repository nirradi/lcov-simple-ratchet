# lcov-simple-ratchet

[![CI](https://github.com/nirradi/lcov-simple-ratchet/actions/workflows/ci.yml/badge.svg)](https://github.com/nirradi/lcov-simple-ratchet/actions/workflows/ci.yml)

Simple LCOV coverage gate for CI pipelines (great for Nx and similar setups).

After your tests generate `coverage/lcov.info`, run this tool to fail CI if line coverage is below your configured minimum.

## Install

```bash
npm install --save-dev lcov-simple-ratchet
```

## Configuration

Add this to your `package.json`:

```json
{
  "lcovSimpleRatchet": {
    "minimumCoverage": 80,
    "ratchetAbove": "2%",
    "metric": "lines",
    "lcovPath": "coverage/lcov.info"
  }
}
```

### Config fields

- `minimumCoverage` (required): Number between `0` and `100`
- `ratchetAbove` (optional): Number or percentage string, default `2` (or `"2%"`)
- `metric` (optional): currently only `"lines"` is supported
- `lcovPath` (optional): defaults to `coverage/lcov.info`

## Usage

```bash
npx lcov-simple-ratchet
```

Strict mode for missing LCOV file:

```bash
npx lcov-simple-ratchet --fail-on-missing-lcov
```

Auto-ratchet `minimumCoverage` when coverage exceeds the ratchet window:

```bash
npx lcov-simple-ratchet --auto-ratchet
```

Preview auto-ratchet changes without writing `package.json`:

```bash
npx lcov-simple-ratchet --auto-ratchet --dry-run
```

By default, if `coverage/lcov.info` is missing, the command passes (useful for Nx affected runs where some packages have no tests executed).

The command exits with code `1` when:

- Coverage is below `minimumCoverage`, or
- Coverage is at least `minimumCoverage + ratchetAbove` (default manual ratchet behavior).

When `--auto-ratchet` is used and coverage is at least `minimumCoverage + ratchetAbove`, the command updates `lcovSimpleRatchet.minimumCoverage` instead of failing, with guardrails:

- Only ratchets upward.
- Requires a clean git working tree (unless using `--dry-run`).
- `--dry-run` reports the proposed update and does not write files.

That second rule forces an intentional config update when coverage improves significantly.

Also by default, if `lcovSimpleRatchet` is not configured in `package.json`, the command passes.

## CI / Nx example

Run this after your test step:

```json
{
  "scripts": {
    "test:ci": "nx test my-app --codeCoverage",
    "coverage:gate": "lcov-simple-ratchet",
    "ci": "npm run test:ci && npm run coverage:gate"
  }
}
```

## Self-ratcheting CI (this repo)

This package also dog-foods itself in GitHub Actions:

```bash
npm ci
npm run build
npm run test:coverage:lcov
npm run ratchet
```

The repo config in `package.json` uses:

- `minimumCoverage`: `80`
- `ratchetAbove`: `2`
- `metric`: `"lines"`
- `lcovPath`: `"coverage/lcov.info"`

## Testing this package

Accepted approach for open source CLIs like this:

- Keep **unit/integration tests inside the package** (fast, stable, and run on every PR).
- Keep consumer-repo E2E checks (like `test-example`) as optional demonstrations.

Run local tests:

```bash
npm test
```

Run local build + tests:

```bash
npm run build && npm test
```

## License

MIT
