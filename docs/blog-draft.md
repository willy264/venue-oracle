# Venue Oracle: Calibration Without Prediction Theater

## Problem

Prediction-market prices look like probabilities, but a venue that says 70% should resolve YES about 70% of the time. Venue Oracle measures that claim separately for Polymarket and Kalshi, by category and time-to-close. The original cross-venue question was not viable: the structured scan found zero verified pairs, so the product does not fabricate comparisons.

## Method

The replay uses resolved markets and public historical price sources. It takes the last available price at 7, 3, and 1 day before close, records the resolved outcome, and evaluates raw price against a calibration correction. V1 used a Laplace correction toward 0.5. With only 54 observations, that prior over-corrected: raw Brier was `0.0983` and corrected Brier was `0.2195`.

V2 was documented before scoring. It treats the raw market price as the prior and shrinks toward the observed rate for a venue/category/time-to-close bucket:

```text
corrected = raw + n/(n+20) * (bucketRate - bucketMeanPrice)
```

The final 20% of observations by snapshot time was held out. The replay scores each observation before storing its outcome. Bucket summaries and a capped sample of observations are written to Walrus Memory and recalled during replay decisions. Tatum remains the source for discovery, sampled live prices, outcomes where available, and Sui verification; public Polymarket CLOB and Kalshi candlesticks supply the bulk historical prices because Tatum history is credit-expensive. Live calls have empty `citedBlobIds`, so the product says that a call's bucket in Walrus Memory holds n past cases rather than claiming those memories were cited at live decision time.

## Result

V2 used 550 observations: 440 in the training prefix and 110 held out. On held-out data, raw Brier was `0.1955` with bootstrap 95% interval `[0.1705, 0.2239]`; corrected Brier was `0.1984` with interval `[0.1730, 0.2288]`. The corrected Brier score was slightly worse. Absolute calibration error improved from `0.1453` to `0.1022`. This is mixed evidence, not an accuracy improvement, and the app makes no predictive-edge claim.

## Evidence and integrity

The live board contains nine real Tatum-sampled records, not placeholders. Each record exposes its venue market ID and URL, Tatum price endpoint, snapshot timestamp, raw price, Walrus memory blob, and Sui testnet transaction digest. The nine commitments use Move package [`0xf12f...1363`](https://testnet.suivision.xyz/object/0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363) and were verified through Tatum testnet gRPC. `VO-LIVE-01` and `VO-LIVE-03` were committed with Tatum `rawPrice: 0` and are shown as `Price unavailable`. The full evidence is in [`results/live-calls.json`](../results/live-calls.json) and [`results/testnet-verification.json`](../results/testnet-verification.json).

All Venue Oracle memories are stored on Walrus mainnet until at least June 2027 (results/mainnet-memory-expiry.json).

## Limits

The historical corpus is uneven: only 12 Polymarket observations were usable compared with 538 Kalshi observations. Many public history requests lacked a usable point and were excluded rather than imputed. The held-out sample is modest, live calls are unresolved until their markets close, and the Walrus relayer receives plaintext public market data. A calibration improvement is not the same as better directional accuracy.

## Links

- Demo: https://venue-oracle.vercel.app
- Repository: https://github.com/willy264/venue-oracle
- Mainnet and replay blob evidence: [`results/latest-replay.json`](../results/latest-replay.json), [`results/latest-replay-v2.json`](../results/latest-replay-v2.json)
- Live blob and commitment evidence: [`results/live-calls.json`](../results/live-calls.json)
