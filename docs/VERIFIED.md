# Verified Interfaces

Verification date: 2026-11-09 (Lagos)

Direct public history verification: 2026-11-09 (Lagos)

## Tatum Prediction API

Source: https://docs.tatum.io/reference/getpredictionmarkets

- `GET /v4/data/prediction/markets`
- Supported platform values observed: `polymarket`, `kalshi`.
- Cursor pagination uses `pagination.cursor`; cursors are passed back verbatim.
- Market discovery costs 100 credits per call.
- Polymarket accepts `status`, `category`, `tag`, `search`, and `minVolume` only when `platform=polymarket`.
- The response includes market IDs, questions, status, open/close/settle times, outcomes, volume, liquidity, and resolution fields.

Source: https://docs.tatum.io/reference/getpredictionevents

- `GET /v4/data/prediction/events`
- Event discovery costs 100 credits per call.
- `includeMarkets=true` embeds nested markets.
- Event-level Kalshi liquidity is not exposed; it must be derived from orderbook depth if needed.

Source: https://docs.tatum.io/reference/getpredictionmarketpricehistory

- `GET /v4/data/prediction/markets/{id}/history`
- History costs 200 credits per call.
- `interval`, `start`, and `end` are required.
- Supported intervals: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`, `1w`.
- `source=candlesticks` is trade-based; `source=midpoint` is supported for Polymarket and provides broader quote coverage with zero volume.
- A live probe of the sampled records returned empty candle arrays, so historical replay coverage is not yet established.

Gate 1 depth evidence is in `research/gate1-depth.json`: 500 Polymarket events yielded 120 resolved embedded markets; 500 Kalshi events yielded 18 finalized embedded markets. Ten history requests per platform produced zero candles in successful responses.

Source: https://docs.tatum.io/docs/plans-limits

- Free plan documents 100,000 credits and a 3 requests/second limit.

## Walrus Memory

Source: https://docs.wal.app/walrus-memory/sdk/api-reference

- `remember()` returns an asynchronous job ID.
- `waitForRememberJob()` returns a `blob_id` after durable completion.
- `rememberBulk()` supports up to 20 items.
- `recall({ query, limit, namespace, maxDistance, sort, scoringWeights })` is the preferred object form.
- Recall results contain `blob_id`, plaintext `text`, and cosine `distance`.

Live evidence is in `research/gate-live.json`.

## Tatum Sui gRPC

Source: https://docs.tatum.io/reference/rpc-sui

- Mainnet gRPC host: `sui-mainnet-grpc.gateway.tatum.io:443`.
- The reused native transport sends the API key as gRPC metadata `x-api-key`.
- The live check succeeded for Sui balance and MemWal account-object retrieval.

## Direct replay-history sources

Source: https://docs.polymarket.com/api-reference/markets/get-prices-history

- Public CLOB endpoint: `GET https://clob.polymarket.com/prices-history`.
- Reads require no authentication.
- `market` is the Polymarket outcome token ID; `startTs`, `endTs`, `interval`, and `fidelity` are supported.
- Live probe returned 8 history points for each of two traded tokens.

Source: https://docs.kalshi.com/openapi.yaml

- Public endpoint: `GET /trade-api/v2/series/{series_ticker}/markets/{ticker}/candlesticks`.
- Reads require no authentication.
- Required query fields are `start_ts`, `end_ts`, and `period_interval`; valid intervals are 1, 60, and 1440 minutes.
- Settled markets outside the live cutoff use `/historical/markets/{ticker}/candlesticks` according to the OpenAPI description.
- Live probe returned 7 candlesticks for `KXELONMARS-99`.

Probe evidence is in `research/public-history-probe.json`.
