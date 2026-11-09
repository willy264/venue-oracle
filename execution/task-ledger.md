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
| Build web application | Blocked by research gate | Not started |
| Mainnet memory writes | Awaiting explicit approval | Never perform automatically |
| Move deployment or mainnet spending | Awaiting explicit approval | Never perform automatically |

## Existing credential inventory

- Available in the local Venue Oracle `.env`: `TATUM_ID`, `SUI_ADDRESS`, Tatum mainnet/testnet API keys, `MEMWAL_ACCOUNT_ID`, `MEMWAL_AGENT_ID`, and `MEMWAL_SERVER_URL`.
- `walrus_address` also exists but is not used as a substitute for `SUI_ADDRESS`.
- No credential values have been displayed or added to tracked files.
- Gate blob ID: `vuYOO0YfNjxehASkXfL-EJLslooXGQolx7NjywAE8R4`.
- Gate MemWal namespace: `vo-gate-79cb7005baf8840c`.
- Sui object read: configured MemWal account object returned through Tatum gRPC.
- Sui Move commitment transactions: none yet; testnet package path and tests are still required before any approved spend.

## Hours left

Unknown until the deadline and available credentials are confirmed.
