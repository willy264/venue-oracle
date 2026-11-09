# Task Ledger

| Task                                               | Status                            | Notes                                                                                                                                                   |
| -------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create project workspace                           | Done                              | Initial folders created on 2026-11-08                                                                                                                   |
| Inventory project credentials                      | Done                              | `TATUM_ID` and `SUI_ADDRESS` are present in local `.env`; values were not displayed                                                                     |
| Verify Tatum Prediction API                        | Failed for replay / changed       | 2,000 Polymarket + 1,920 Kalshi rows; 120 resolved Polymarket + 18 finalized Kalshi embedded markets; sampled history had zero candles                  |
| Re-check Tatum history on traded markets           | Done                              | Exactly 3 calls; 8, 8, and 7 daily candles returned                                                                                                     |
| Verify public replay-history APIs                  | Done                              | Polymarket CLOB: 8 points; Kalshi candlesticks: 7 points                                                                                                |
| Build structured historical review CSV             | Failed / awaiting owner input     | 2,100 Polymarket + 3,000 Kalshi rows; 0 candidates                                                                                                      |
| Scan current live boards for matched events        | Failed                            | 1,000 Polymarket + 928 Kalshi rows; 0 candidates                                                                                                        |
| Verify MemWal SDK and relayer behavior             | Done                              | Mainnet write/recall passed; blob ID logged                                                                                                             |
| Verify Tatum Sui gRPC integration                  | Done                              | Balance and MemWal account object reads passed                                                                                                          |
| Decide historical replay vs live-snapshot fallback | Changed                           | Historical gate failed; live-snapshot fallback selected; owner pair confirmation required before scored run                                             |
| Reuse Errata foundation packages and CI            | Done                              | Copied with tests; documented in `docs/DECISIONS.md`                                                                                                    |
| Run reused package checks                          | Done                              | Typecheck passed; core 34, memory 6, engine 9, chain 6 tests passed after removing accidental nested chain copy; Biome passes with warnings only |
| Owner confirms historical/live pairs               | Pending                           | Review CSVs contain no candidates; no scoring or memory writes allowed                                                                                  |
| Build deterministic engine                         | Blocked by pair-confirmation gate | Do not start scored run                                                                                                                                 |
| Pivot to per-venue calibration                     | Done                              | Owner decision recorded in `docs/EXPERIMENT.md`                                                                                                         |
| Fetch resolved calibration corpus                  | Done                              | 54 observations: 12 Polymarket, 42 Kalshi; public history sources                                                                                       |
| Fetch expanded v2 corpus                           | Done                              | 2,100 Polymarket + 8,072 Kalshi listings; 550 usable observations after 4,619 history calls and 2,039 bounded failures                                  |
| Run walk-forward replay and memory writes          | Done                              | 54 observation writes, 1 belief write, real blob IDs in `results/latest-replay.json`                                                                    |
| Run v2 held-out replay and summary memories        | Done with mixed result            | 550 observations, 440/110 time split, 9 summary writes, 20 individual writes; held-out raw Brier 0.1955 vs corrected 0.1984; calibration error improved |
| Evaluate learning curve                            | Done                              | Raw Brier 0.0983; corrected Brier 0.2195; negative result disclosed                                                                                     |
| Snapshot live markets and prepare calls            | Done                              | 6 Tatum price calls, 6 `vo-live` MemWal writes; blob IDs and SHA-256 call digests in `results/live-calls.json`                                          |
| Sui testnet commitment layer                       | Done                              | Move test 1/1; testnet package published; 6 live digests committed and verified through Tatum testnet gRPC                                              |
| Web app shell                                      | Done                              | Live Board, Learning Curve, Memory Inspector, Track Record, and Method pages deployed                                                                   |
| Vercel deployment                                  | Done                              | Public production URL: `https://web-psi-five-oie9hjjwqd.vercel.app`                                                                                     |
| Build web application                              | Done                              | Direct `next build --webpack` passed locally; Vercel production build also passed                                                                        |
| Mainnet memory writes                              | Done under standing approval      | Replay observation and belief writes completed; no secrets tracked                                                                                      |
| Move deployment or mainnet spending                | Not done                          | Testnet artifact failed before publish; no mainnet action attempted                                                                                     |
| Integrity audit and live evidence                  | Done                              | Six records confirmed as real Tatum samples; IDs, venue URLs, endpoints, timestamps, raw prices, blobs, and Sui tx digests are recorded and shown in UI |
| CI cleanup and duplicate removal                   | In progress                       | Removed `packages/chain/chain`; local checks pass; pending commit/push and GitHub run confirmation                                                         |
| Blog and submission drafts                         | Done as drafts                    | Added `docs/blog-draft.md`; updated README, CLAIMS, and `docs/SUBMISSION.md`; owner-only publication/submission untouched                              |

## Existing credential inventory

- Available in the local Venue Oracle `.env`: `TATUM_ID`, `SUI_ADDRESS`, Tatum mainnet/testnet API keys, `MEMWAL_ACCOUNT_ID`, `MEMWAL_AGENT_ID`, and `MEMWAL_SERVER_URL`.
- `walrus_address` also exists but is not used as a substitute for `SUI_ADDRESS`.
- No credential values have been displayed or added to tracked files.
- Gate blob ID: `vuYOO0YfNjxehASkXfL-EJLslooXGQolx7NjywAE8R4`.
- Gate MemWal namespace: `vo-gate-79cb7005baf8840c`.
- Sui object read: configured MemWal account object returned through Tatum gRPC.
- Sui Move commitment transactions: six testnet transactions verified through Tatum; no mainnet action attempted.
- Live calibration run: 6 calls, 6 completed `vo-live` memories, six testnet Sui txs; all evidence is recorded in `results/live-calls.json`.
- Sui tooling: pinned testnet binary `1.83.1` downloaded from the official GitHub release after `suiup` timed out.
- Sui testnet evidence: faucet `6Zfcj68SupgD5ZL9DF35UNTDRAQoaEYGJgWrgCrVPHGH`; publish `GecMo7gRiohB7wWmqsgSUajTvUGXzvpDrrZQKjDoPqXg`; package `0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363`; six commitment and Tatum verification digests are in `results/testnet-commitments.json` and `results/testnet-verification.json`.

## Remaining external setup

GitHub Actions still needs repository secrets before the scheduled workflow can be proven end to end. MPP and owner-only publication actions remain gated until the core workflow is verified.
