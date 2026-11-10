# Venue Oracle

Venue Oracle measures whether a prediction-market venue's probability is honest. For each venue, category, time-to-close, and liquidity bucket, it recalls resolved outcomes from Walrus Memory and computes a corrected probability for live markets.

## Current evidence

This repository contains a real historical replay and nine real live calibration records.

- Corpus: 54 observations, 12 Polymarket and 42 Kalshi.
- Replay baseline Brier: `0.0983137731`.
- First memory-corrected Brier: `0.2194999238` over 44 corrected observations.
- Result: negative. The baseline wins this run; the product publishes that result and does not claim an edge.
- V2 corpus: 550 observations, with 440 training-prefix observations and 110 time-held-out observations.
- V2 held-out Brier: raw `0.1955` (95% CI `[0.1705, 0.2239]`), corrected `0.1984` (95% CI `[0.1730, 0.2288]`); calibration error improved from `0.1453` to `0.1022`. Brier was slightly worse after correction, so this is mixed evidence and makes no accuracy-improvement claim.
- Mainnet MemWal verification: 343 memories across 20 namespaces. The app shows 9 live-call records from `vo-live`; full evidence is [`results/mainnet-memory-verification.json`](results/mainnet-memory-verification.json).
- Live calls: nine real Polymarket markets sampled through Tatum on 9–10 Nov 2026, closing 12–16 Nov. The closest v2 current-affairs bucket has n=4 and the sports bucket is below minimum, so all extra calls honestly abstain and retain raw prices. IDs, URLs, Tatum endpoints, snapshots, Walrus blobs, and Sui evidence are in [`results/live-calls.json`](results/live-calls.json).
- First sample: the original six long-dated records remain preserved and labelled in [`results/live-calls-first-sample.json`](results/live-calls-first-sample.json). The current set is 9 live calls: 6 sports and 3 US current-affairs calls; the current-affairs bucket has n=4 and all nine abstain.
- Testnet proof: nine current Sui commitments verified through Tatum testnet gRPC; evidence is in [`results/testnet-verification.json`](results/testnet-verification.json).
- Demo: https://venue-oracle.vercel.app

The web app has the Live Board, Learning Curve, Memory Inspector, Track Record, and Method views under `apps/web`.

## Data and lineage

Tatum is used for prediction-market discovery, sampled live prices, outcomes where available, and Sui gRPC reads. Historical price points for the replay use the public Polymarket CLOB price-history and Kalshi candlestick APIs because Tatum history is credit-expensive. This is disclosed in the app and research records. No cross-venue pair was fabricated: the original pairing scan found zero verified pairs, so the product pivoted to within-venue calibration.

Memories use venue/category namespaces and structured JSON tails. Replay is walk-forward: an observation's outcome is written only after the prediction is scored. The first calibration policy over-corrected the small mixed corpus; that is an explicit negative result.

## Run locally

1. Use Node 22 or newer and pnpm 10+.
2. Copy `.env.example` to `.env` and provide the local credentials.
3. Run unit tests with the repository's pnpm workspace.
4. Run `pnpm replay --small` only when mainnet-memory writes are intended; replay writes real historical observations and is not a simulation.
5. Start the web app from `apps/web` with `pnpm dev`.

The current machine's pnpm shim is broken, so the recorded test results were run with the available Errata toolchain where possible. See [`verification/test-report.md`](verification/test-report.md).

## Reuse and limits

The MemWal wrapper/outbox, Tatum gRPC transport, pacing, credit meter, proof helpers, CI, and configuration were reused from `../Errata`; the details are in [`docs/DECISIONS.md`](docs/DECISIONS.md). The relayer receives plaintext public market data. The matcher and historical corpus still need broader human review, and the current category sample is small.

## Submission status

The blog, social post, video, and hackathon form remain owner-only actions. The draft checklist is in [`docs/SUBMISSION.md`](docs/SUBMISSION.md).
