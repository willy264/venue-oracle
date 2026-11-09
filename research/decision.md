# Research Gate Decision

Date: 2026-11-09 (Lagos)

## Gate 1 Status

- **Done:** MemWal mainnet write/recall, Tatum Sui gRPC, Tatum endpoint/credit verification, and candidate CSV generation.
- **Failed:** Historical replay corpus gate. The current API sample does not provide enough verified matched pairs or usable price-history candles.
- **Changed:** Product data plan is the live-snapshot fallback. No scored replay is authorized until the owner confirms a real pair set or supplies another verified corpus.

## Revised Gate 1 Follow-up

- **Done:** Tatum history recheck on exactly three traded markets returned 8, 8, and 7 daily candles. Evidence: `research/tatum-history-recheck.json`.
- **Done:** Public Polymarket CLOB and Kalshi candlestick endpoints returned real history without authentication. Evidence: `research/public-history-probe.json`.
- **Done:** Structured family listing completed: 2,100 Polymarket closed rows and 3,000 Kalshi historical rows.
- **Failed:** Structured historical matcher found 0 candidates across sports-game-winner, crypto-threshold, macro-release, and election families.
- **Failed:** Live structured matcher found 0 candidates across 1,000 Polymarket and 928 Kalshi active rows.
- **Changed:** Public venue history is approved for replay history, but no replay or live snapshot can begin until an owner-confirmed pair exists.

## Result

**Gate R is not passed for historical replay.** The current Tatum data scan does not yet prove a viable historical prices-plus-outcomes corpus or even 30 matched pairs. Venue Oracle must use the disclosed live-snapshot fallback unless a second, documented matching/data source is verified.

## Evidence

- Tatum market discovery: 2,000 Polymarket rows and 1,920 Kalshi rows across 20 cursor pages per platform.
- Tatum event-depth probe: 500 Polymarket events (120 resolved embedded markets) and 500 Kalshi events (18 finalized embedded markets) across the sampled pages.
- Resolved Polymarket categories observed: Sports 30, Crypto 24, Business 13, US-current-affairs 12, NFTs 11, Pop-Culture 10, Ukraine & Russia 10, Global Politics 4, Chess 2, Coronavirus 2, Art 1, Science 1.
- Finalized Kalshi categories observed: Sports 14, Science and Technology 2, Companies 1, Entertainment 1.
- Resolved outcomes were present in the sampled records; Polymarket included multi-outcome values in addition to YES/NO, while Kalshi samples were YES/NO.
- Twenty history requests (10 Polymarket midpoint and 10 Kalshi candlestick) returned HTTP 200 or a documented 404 for one stale ID, but zero candles for every successful response.
- Candidate matcher: normalized title-token similarity, close-time difference at most one day, and similarity threshold 0.20.
- Candidate result: zero candidates. The review CSV is [candidate-pairs.csv](../data/candidate-pairs.csv); it contains only its header and no fabricated pairs.
- History endpoint and costs are recorded in [VERIFIED.md](../docs/VERIFIED.md).
- A sampled history request returned HTTP 200 but an empty candle array. Historical availability remains UNKNOWN for the required resolved matched corpus.
- MemWal mainnet write and recall passed with blob ID `vuYOO0YfNjxehASkXfL-EJLslooXGQolx7NjywAE8R4`; see [gate-live.json](./gate-live.json).
- Tatum Sui gRPC passed for balance and the configured MemWal account object.

## Consequence

Do not claim replay improvement, matched-pair counts, or historical significance. The next implementation step is a live-snapshot collector that stores current Polymarket/Kalshi snapshots, waits for real settlements, and labels all resulting memories as live snapshots. The historical replay path can be reopened only after a real, documented corpus is found.
