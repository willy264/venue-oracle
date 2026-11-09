# Verification Report

Gate checks have run, but product tests have not.

- PASS: MemWal mainnet write, wait, and recall; blob ID recorded in `research/gate-live.json`.
- PASS: Tatum Sui gRPC balance and MemWal account-object reads.
- PASS: Tatum market discovery requests; no candidate pair found in the scanned corpus.
- INCOMPLETE: Tatum history coverage for a resolved matched corpus.
- FAIL: Gate 1 historical replay corpus; 0 candidate pairs and 0 candles in successful sampled history responses.
- CHANGED: Data plan moved to the disclosed live-snapshot fallback; no scored run has started.
- PASS: Exactly three Tatum history rechecks returned 8, 8, and 7 daily candles.
- PASS: Public Polymarket and Kalshi history probes returned 8 and 7 real history points.
- FAIL: Structured historical listing produced 0 owner-review candidates.
- FAIL: Structured live listing produced 0 snapshot candidates.
- PASS: Calibration corpus contains 54 real replay observations.
- PASS: Walk-forward replay completed with 54 MemWal observation writes and 1 belief write.
- NEGATIVE RESULT: Raw Brier 0.0983 beat corrected Brier 0.2195; memory calibration did not improve this corpus.
- PASS: Live calibration sampled 3 Polymarket and 3 Kalshi markets through Tatum, wrote 6 completed `vo-live` memories, and recorded deterministic SHA-256 call digests.
- PENDING: Sui commitment transactions and Tatum verification; no transaction has been sent yet.
- PASS: Reused `core` and `memory` test suites, 5 files and 40 tests.
- PASS: Heuristic secret scan over 49 Git-visible files.
- BLOCKED: Reused `chain` suite needs a normal pnpm workspace install; the current pnpm shim is broken and the temporary dependency links do not expose all protobuf runtime packages.

## Required evidence

- [x] Research gate decision recorded
- [x] MemWal round trip recorded with a real `blob_id`
- [x] Tatum Sui gRPC call recorded
- [ ] Unit tests pass
- [ ] Typecheck, lint, and build pass
- [ ] Move tests pass
- [ ] Integration tests pass when credentials are available
