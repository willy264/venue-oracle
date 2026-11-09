# Decisions

## 2026-11-09 - Reuse Errata foundation

Reused from `../Errata` with tests intact:

- `packages/core`: canonical encoding, hashing, schemas, and deterministic helpers used by the reused packages.
- `packages/memory`: MemWal wrapper, bulk outbox, idempotency handling, job polling, and restore logic.
- `packages/chain`: native Tatum Sui gRPC transport, pacing, retry behavior, and credit-ledger interfaces.
- `biome.json`, `tsconfig.json`, `turbo.json`, `pnpm-workspace.yaml`, CI workflow, and secret-scan/proof scripts.

The reused package names remain `@errata/*` to preserve their tested import surface. Venue Oracle product code will depend on them and disclose the reuse in the README.

## 2026-11-09 - Gate evidence

- The live MemWal gate wrote and recalled a synthetic connectivity record in namespace `vo-gate-79cb7005baf8840c` with blob ID `vuYOO0YfNjxehASkXfL-EJLslooXGQolx7NjywAE8R4`.
- Tatum Sui gRPC returned a SUI balance response for `SUI_ADDRESS` and returned the MemWal account object for the configured account ID.
- The MemWal blob ID is not a Sui object ID or transaction digest. It is evidence of durable memory, not a replacement for the separate Sui commitment transaction.
- A 20-page live scan retrieved 2,000 Polymarket and 1,920 Kalshi market records. The deterministic matcher found zero candidates within one day and with title similarity at least 0.20. No pair was marked verified.
- No product result, market pair, or user was fabricated.

## 2026-11-09 - Verification status

- Reused core and memory suites pass: 5 test files, 40 tests.
- Secret scan passes over 49 Git-visible files.
- Chain tests are not yet accepted as passing because the local pnpm shim failed and the temporary junction setup lacks all protobuf runtime packages. A clean workspace install is still required.

## 2026-11-09 - Calibration pivot and replay

- Cross-venue pairing was abandoned after 0 historical and 0 live pairs; the product now calibrates each venue independently.
- The corpus contains 54 real observations from resolved markets: 12 Polymarket and 42 Kalshi, using public pre-close history and explicit outcomes.
- Mainnet MemWal received 54 observation memories and 1 calibration-belief memory. Every successful observation has a real blob ID in `results/latest-replay.json`.
- Walk-forward result: raw venue Brier `0.0983137731`; corrected Brier `0.2194999238`; corrected predictions were used for 44 observations. The learned result is worse and is disclosed as negative evidence.
