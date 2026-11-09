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
- PASS: v2 corpus scanned 2,100 Polymarket and 8,072 Kalshi listings; 1,447 and 3,068 resolved candidates; 550 usable observations from 4,619 public-history calls.
- DISCLOSED: 2,039 history requests failed or lacked usable history and were excluded; no values were imputed.
- PASS: v2 replay completed on 550 observations with a 440/110 time-held-out split; 9 bucket-summary and 20 capped individual MemWal writes returned blob IDs.
- MIXED RESULT: v2 held-out raw Brier 0.1955 vs corrected 0.1984; raw calibration error 0.1453 vs corrected 0.1022. No predictive edge claimed.
- PASS: Walk-forward replay completed with 54 MemWal observation writes and 1 belief write.
- NEGATIVE RESULT: Raw Brier 0.0983 beat corrected Brier 0.2195; memory calibration did not improve this corpus.
- PASS: Live calibration sampled 3 Polymarket and 3 Kalshi markets through Tatum, wrote 6 completed `vo-live` memories, and recorded deterministic SHA-256 call digests.
- PENDING: Sui commitment transactions and Tatum verification; no transaction has been sent yet.
- PASS: Engine plus reused `core` and `memory` suites, 6 files and 44 tests.
- PASS: Heuristic secret scan over 49 Git-visible files.
- PASS: Current heuristic secret scan over 89 Git-visible files.
- BLOCKED: Reused `chain` suite needs a normal pnpm workspace install; the current pnpm shim is broken and the temporary dependency links do not expose all protobuf runtime packages.
- PASS: Direct GitHub release download supplied Sui `1.83.1`; Move unit test passes 1/1. The CLI warning is non-fatal (`public entry` is redundant).
- ADDED: Next.js web shell pages for live board, learning curve, memory inspector, track record, and method disclosures.
- BLOCKED: Web production build could not complete because the local npm install left an incomplete Next package and the pnpm shim is unavailable.

## Required evidence

- [x] Research gate decision recorded
- [x] MemWal round trip recorded with a real `blob_id`
- [x] Tatum Sui gRPC call recorded
- [ ] Unit tests pass
- [ ] Typecheck, lint, and build pass
- [ ] Move tests pass
- [ ] Integration tests pass when credentials are available

## Final handoff state

- The repository is not submission-ready: Sui testnet publish/commit/verification and Vercel deployment remain incomplete.
- No blog, social post, video upload, public-repo push, or form submission was performed.
- No mainnet SUI or USDC was spent.
