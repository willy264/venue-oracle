# Venue Oracle

Venue Oracle is a deterministic data application for the Total Recall hackathon.
It compares Polymarket and Kalshi prices for the same event, identifies meaningful disagreements, and recommends which venue to trust based on how similar historical disagreements resolved.

## Core idea

When the two venues disagree, Venue Oracle recalls prior disagreements stored in Walrus Memory, filters them by category, price gap, time to close, and liquidity, then computes a transparent venue lean and blended probability. The decision engine is deterministic; this is not an autonomous AI-agent product.

## Main evidence

- A walk-forward replay predicts each resolved market before writing its outcome memory.
- The replay compares memory-assisted predictions with a 50/50 baseline using Brier scores.
- Belief updates are stored as a visible lineage in Walrus Memory.
- Each live recommendation is hashed and committed on Sui, then verified through Tatum Sui gRPC so it cannot be rewritten in hindsight.

## Planned stack

- Next.js App Router web app with server-side integrations
- TypeScript, pnpm, Vitest
- Walrus MemWal for outcome, live-call, and belief memories
- Tatum Prediction API for market data
- Tatum Sui gRPC for commitment verification
- A small Sui Move commitment package

## Important constraints

- Research and verification must precede product implementation.
- API endpoints, package versions, and field names must be confirmed in live documentation and logged in `docs/VERIFIED.md`.
- No fabricated markets, users, replay results, blob IDs, or transaction IDs.
- Secrets remain in `.env`; only `.env.example` is committed.
- Mainnet writes, mainnet spending, Move deployment, publishing, public-repo changes, social posts, blog publication, and form submission require explicit human approval.

## Research gate

Before implementation, confirm one of the following:

1. Historical prices and resolved outcomes are available for matched Polymarket/Kalshi markets; or
2. The product uses a clearly disclosed live-snapshot fallback.

Also confirm that at least 30 verified matched pairs are feasible, one approved MemWal round trip succeeds, and one Tatum Sui gRPC call succeeds.
