# Task Ledger

| Task | Status | Notes |
|---|---|---|
| Create project workspace | Done | Initial folders created on 2026-11-08 |
| Inventory project credentials | Done | `TATUM_ID` and `SUI_ADDRESS` are present in local `.env`; values were not displayed |
| Verify Tatum Prediction API | Failed for replay / changed | 2,000 Polymarket + 1,920 Kalshi rows; 120 resolved Polymarket + 18 finalized Kalshi embedded markets; sampled history had zero candles |
| Re-check Tatum history on traded markets | Done | Exactly 3 calls; 8, 8, and 7 daily candles returned |
| Verify public replay-history APIs | Done | Polymarket CLOB: 8 points; Kalshi candlesticks: 7 points |
| Build structured historical review CSV | Failed / awaiting owner input | 2,100 Polymarket + 3,000 Kalshi rows; 0 candidates |
| Scan current live boards for matched events | Failed | 1,000 Polymarket + 928 Kalshi rows; 0 candidates |
| Verify MemWal SDK and relayer behavior | Done | Mainnet write/recall passed; blob ID logged |
| Verify Tatum Sui gRPC integration | Done | Balance and MemWal account object reads passed |
| Decide historical replay vs live-snapshot fallback | Changed | Historical gate failed; live-snapshot fallback selected; owner pair confirmation required before scored run |
| Reuse Errata foundation packages and CI | Done | Copied with tests; documented in `docs/DECISIONS.md` |
| Run reused package checks | Partial | Core/memory: 40 tests pass; chain awaits clean pnpm install |
| Owner confirms historical/live pairs | Pending | Review CSVs contain no candidates; no scoring or memory writes allowed |
| Build deterministic engine | Blocked by pair-confirmation gate | Do not start scored run |
| Pivot to per-venue calibration | Done | Owner decision recorded in `docs/EXPERIMENT.md` |
| Fetch resolved calibration corpus | Done | 54 observations: 12 Polymarket, 42 Kalshi; public history sources |
| Fetch expanded v2 corpus | Done | 2,100 Polymarket + 8,072 Kalshi listings; 550 usable observations after 4,619 history calls and 2,039 bounded failures |
| Run walk-forward replay and memory writes | Done | 54 observation writes, 1 belief write, real blob IDs in `results/latest-replay.json` |
| Run v2 held-out replay and summary memories | Done with mixed result | 550 observations, 440/110 time split, 9 summary writes, 20 individual writes; held-out raw Brier 0.1955 vs corrected 0.1984; calibration error improved |
| Evaluate learning curve | Done | Raw Brier 0.0983; corrected Brier 0.2195; negative result disclosed |
| Snapshot live markets and prepare calls | Done | 6 Tatum price calls, 6 `vo-live` MemWal writes; blob IDs and SHA-256 call digests in `results/live-calls.json` |
| Sui testnet commitment layer | In progress | Direct GitHub release workaround succeeded; Move unit test passes; testnet publish pending |
| Web app shell | Done | Live Board, Learning Curve, Memory Inspector, Track Record, and Method pages added |
| Build web application | Done with local build gap | Five Next pages committed; local Next package is incomplete and production build remains unverified |
| Mainnet memory writes | Done under standing approval | Replay observation and belief writes completed; no secrets tracked |
| Move deployment or mainnet spending | Not done | Testnet artifact failed before publish; no mainnet action attempted |
| Final submission docs | Done as drafts | README, CLAIMS, demo, and submission checklist committed; owner-only publication/submission untouched |

## Existing credential inventory

- Available in the local Venue Oracle `.env`: `TATUM_ID`, `SUI_ADDRESS`, Tatum mainnet/testnet API keys, `MEMWAL_ACCOUNT_ID`, `MEMWAL_AGENT_ID`, and `MEMWAL_SERVER_URL`.
- `walrus_address` also exists but is not used as a substitute for `SUI_ADDRESS`.
- No credential values have been displayed or added to tracked files.
- Gate blob ID: `vuYOO0YfNjxehASkXfL-EJLslooXGQolx7NjywAE8R4`.
- Gate MemWal namespace: `vo-gate-79cb7005baf8840c`.
- Sui object read: configured MemWal account object returned through Tatum gRPC.
- Sui Move commitment transactions: none yet; testnet package path and tests are still required before any approved spend.
- Live calibration run: 6 calls, 6 completed `vo-live` memories, no Sui tx yet; all call digests are recorded in `results/live-calls.json`.
- Sui tooling: `suiup 0.1.1` installed; testnet binary download failed twice with HTTP 504. No spend and no transaction occurred.

## Hours left

Known blocker: restore Sui testnet CLI artifact, run Move tests, publish testnet, commit one live call, verify through Tatum, then deploy the web app. No remote is configured.
