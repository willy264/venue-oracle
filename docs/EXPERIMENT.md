# Venue Calibration Experiment

## Question

When a venue prices an event at probability `p`, how often does that event happen, conditioned on venue, category, time to close, liquidity, and a 10-point price band?

## Sources

- Discovery, live prices, and outcomes: Tatum Prediction API.
- Polymarket historical prices: public CLOB `/prices-history`.
- Kalshi historical prices: public candlestick endpoint.
- Memory: Walrus MemWal mainnet, through the reused server-side wrapper.

Replay history is labeled historical replay. Live observations are labeled live and are never mixed into replay scoring.

## Buckets

- Venue: `polymarket` or `kalshi`.
- Category: normalized source category, or `unknown` when the source does not provide one.
- Time to close: `7d`, `3d`, `1d`, or `other` using the nearest available historical candle at or before the target.
- Liquidity: `low`, `medium`, or `high`, derived from source volume/liquidity fields and recorded with the observation.
- Price band: 10-point probability bands `[0.0, 0.1) ... [0.9, 1.0]`.

Minimum sample size for a specific bucket is `5` prior observations. A bucket with fewer observations falls back in order to the same venue/category, same venue, then the raw venue price. Every fallback is recorded.

## Walk-forward rule

Observations are sorted by snapshot timestamp. For each observation, recall may use only observations resolved before that observation's snapshot time. The current observation is scored before its outcome memory is written. No future or same-event outcome may influence its corrected probability.

## Metrics

- Baseline: raw venue probability.
- Learned: corrected probability from prior observations in the selected bucket.
- Brier score: mean `(p - outcome)^2`; lower is better.
- Calibration error: absolute difference between mean predicted probability and observed frequency in each evaluated price band, reported with sample counts.
- Results must publish no-edge and negative results, not only improvements.

## Memory protocol

Each resolved market observation is written as one readable sentence with a compact JSON tag. Writes use `rememberBulk` with an idempotency key. Namespaces are `vo-replay-<runId>-<venue>-<category>`.

Calibration belief memories are written only after a bucket has enough evidence and its corrected estimate changes materially. They cite predecessor blob IDs. No memory is used in scoring until the write belongs to an earlier resolved observation in the walk-forward order.

## Disclosures

- Replay writes historical market observations to Walrus Memory during the run.
- Venue definitions, settlement rules, data retention, and liquidity fields differ; unresolved differences are excluded or flagged.
- Small samples fall back to raw prices and are reported as such.
- A negative or statistically inconclusive result remains a valid result.
