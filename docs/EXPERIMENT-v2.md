# Venue Oracle Calibration Experiment v2

## Status

This document is committed before the v2 corpus fetch and scoring run. It preserves v1's result: 54 observations, raw Brier `0.0983137731`, memory-corrected Brier `0.2194999238`. V1's diagnosis is that the corpus was too small and the Laplace prior pulled probabilities toward `0.5`, which is an inappropriate correction for already-calibrated market prices.

## Question

For each venue, category, and time-to-close bucket, does historical outcome frequency improve the venue's raw probability on markets held out by time? If not, the raw price remains the product's answer and the result is published as no edge.

## Corpus

Fetch all usable resolved markets returned by the already scanned Polymarket and Kalshi listings. Historical prices come from the public Polymarket CLOB price-history and Kalshi candlestick endpoints. The fetch report records listing counts, selected counts, observations, API failures, missing history, invalid outcomes, and duplicate exclusions. Tatum remains the discovery, live-price, outcome, and Sui-verification source.

Snapshots are the last public price at or before 7d, 3d, and 1d before close. Markets without an explicit binary outcome, close time, usable history point, or positive price are excluded and counted rather than imputed.

## V2 method

The raw venue price is the prior: `corrected = raw` until a bucket has evidence. The correction shrinks toward the observed bucket rate rather than toward `0.5`:

```text
bucketMeanPrice = mean(prior raw prices)
bucketRate = mean(prior outcomes)
w = n / (n + k)
corrected = raw + w * (bucketRate - bucketMeanPrice)
```

`k = 20` is fixed for this run. Buckets are venue x normalized category x time-to-close. Price is a continuous regression adjustment inside the bucket, not a hard price-band filter. A bucket needs at least 5 prior observations; otherwise the correction abstains and equals raw. Liquidity is retained as a reported feature but is not used as a hard v2 bucket because v1 coverage was sparse.

## Evaluation

Observations are sorted by snapshot time. The final 20% by time is held out and never contributes to a prior used for another held-out prediction. The training prefix is still walk-forward: each observation is scored before its outcome updates the prior. Metrics are Brier score and absolute calibration error, comparing raw and corrected probabilities. Coverage, abstention count, bootstrap 95% intervals, and per-venue/category results are reported. A result that is neutral or worse is retained and labelled honestly.

## Walrus Memory protocol

Each replay bucket writes a compact summary memory containing venue, category, time bucket, n, mean raw price, outcome rate, correction weight, and the previous summary blob ID. Summary memories are recalled from Walrus at decision time; the local prior is only a deterministic replay cache and is not the source of truth for the decision. To respect measured MemWal limits, individual observation memories are capped at 100 representative records, while bucket summaries are written in batches of at most 20 with idempotency keys.

Namespaces use `vo-v2-replay-<runId>-<venue>-<category>` for summaries and `vo-v2-observations-<runId>` for the capped observation sample. Belief updates cite their predecessor summary blob IDs.

## Disclosures

This is historical replay written now to Walrus Memory. It is not simulated market data. The v1 negative result remains in `results/` and is not overwritten. V2 will publish its full counts and whatever result it produces, including no edge or negative performance.
