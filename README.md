# lcov-simple-ratchet

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
    "metric": "lines",
    "lcovPath": "coverage/lcov.info"
  }
}
```

### Config fields

- `minimumCoverage` (required): Number between `0` and `100`
- `metric` (optional): currently only `"lines"` is supported
- `lcovPath` (optional): defaults to `coverage/lcov.info`

## Usage

```bash
npx lcov-simple-ratchet
```

If the measured coverage is below `minimumCoverage`, the command exits with code `1`.

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
