# UI Data Map

Every displayed market, probability, blob ID, digest, and package ID is read from committed evidence.

| UI surface                              | Source                                                               |
| --------------------------------------- | -------------------------------------------------------------------- |
| Current live cards                      | `results/live-calls.json`                                            |
| First-sample track record rows          | `results/live-calls-first-sample.json`                               |
| Current Sui proof links                 | `results/testnet-verification.json` and `results/live-calls.json`    |
| Replay headline and reliability diagram | `results/latest-replay-v2.json`                                      |
| Memory links                            | `results/live-calls.json` and `results/live-calls-first-sample.json` |
| Package ID                              | `results/live-calls.json` and `results/testnet-verification.json`    |

The current live set contains six real Polymarket sports markets sampled through Tatum on 9 Nov 2026 and closing 14–16 Nov. The v2 corpus has no Polymarket sports bucket meeting the minimum replay sample, so the live engine abstains and shows raw prices unchanged. This is a measured no-edge result, not a tuned correction.
