# Claims and Evidence

| Claim | Evidence | Status |
|---|---|---|
| Venue Oracle calibrates each venue independently | `packages/engine`, `docs/EXPERIMENT.md` | Implemented |
| Replay uses real resolved observations | `data/observations.json`, `research/corpus-fetch.json` | Verified |
| Historical observations were written to Walrus Memory | `results/latest-replay.json` | Verified: 54 observation writes and one belief write |
| Memory improved the first run | `results/latest-replay.json` | False for this run; raw Brier beat corrected Brier |
| Six live calls are committed on Sui | `results/live-calls.json` | Not yet; hashes exist, transactions pending Move CLI recovery |
| Sui verification through Tatum works | `research/gate-live.json` | Mainnet read verified; commitment verification pending transaction |
| Cross-venue matching works | `data/candidate-pairs.csv` | False; zero pairs found and the feature was removed from the core |

All replay numbers are historical replay evidence, not a guarantee about future markets.
