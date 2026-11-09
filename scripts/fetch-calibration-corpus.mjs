import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) { const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, ""); }
let calls = 0;
let historyFailures = 0;
const corpusLimit = Number(process.env.VO_CORPUS_LIMIT ?? 80);
async function get(url) { await sleep(calls++ ? 150 : 0); const response = await fetch(url); const body = await response.text(); if (!response.ok) throw new Error(`${response.status} ${url}: ${body.slice(0, 160)}`); return JSON.parse(body); }
async function getPolyMarkets() {
  const rows = [];
  for (let offset = 0; offset < 2200; offset += 100) {
    let page;
    try { page = await get(`https://gamma-api.polymarket.com/markets?closed=true&limit=100&offset=${offset}`); } catch (error) { if (String(error.message).startsWith("422")) break; throw error; }
    rows.push(...page);
    if (page.length < 100) break;
  }
  return rows;
}
async function getKalshiMarkets() {
  const rows = [];
  let cursor = "";
  for (let i = 0; i < 30; i++) {
    const params = new URLSearchParams({ limit: "100" }); if (cursor) params.set("cursor", cursor);
    const page = await get(`https://api.elections.kalshi.com/trade-api/v2/historical/markets?${params}`);
    rows.push(...(page.markets ?? []).map((row) => ({ ...row, _source: "historical" }))); cursor = page.cursor ?? ""; if (!cursor || !(page.markets ?? []).length) break;
  }
  cursor = "";
  for (let i = 0; i < 20; i++) {
    const params = new URLSearchParams({ status: "settled", limit: "100" }); if (cursor) params.set("cursor", cursor);
    const page = await get(`https://api.elections.kalshi.com/trade-api/v2/markets?${params}`);
    rows.push(...(page.markets ?? []).map((row) => ({ ...row, _source: "settled" }))); cursor = page.cursor ?? ""; if (!cursor || !(page.markets ?? []).length) break;
  }
  for (const series of ["KXMLBGAME", "KXNFLGAME", "KXBTC15M", "KXETH15M"]) {
    let seriesCursor = "";
    for (let i = 0; i < 10; i++) {
      const params = new URLSearchParams({ status: "settled", series_ticker: series, limit: "100" }); if (seriesCursor) params.set("cursor", seriesCursor);
      const page = await get(`https://api.elections.kalshi.com/trade-api/v2/markets?${params}`);
      rows.push(...(page.markets ?? []).map((row) => ({ ...row, _source: "settled", _series: series })));
      seriesCursor = page.cursor ?? ""; if (!seriesCursor || !(page.markets ?? []).length) break;
    }
  }
  return rows;
}
function parseJson(value, fallback) { try { return typeof value === "string" ? JSON.parse(value) : value ?? fallback; } catch { return fallback; } }
function category(value, text) {
  if (value) return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
  const source = text.toLowerCase();
  if (/nba|nfl|mlb|nhl|game|match|sport/.test(source)) return "sports";
  if (/bitcoin|\bbtc\b|ethereum|\beth\b|crypto/.test(source)) return "crypto";
  if (/fed|fomc|cpi|inflation|jobs|unemployment|rate/.test(source)) return "macro";
  if (/election|president|senate|governor|nominee|primary/.test(source)) return "elections";
  return "unknown";
}
function liquidity(volume, liquidity) {
  const value = Number(liquidity ?? volume ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "unknown";
  if (value < 1000) return "low";
  if (value < 100000) return "medium";
  return "high";
}
function outcomePoly(row) {
  const outcomes = parseJson(row.outcomes, []); const prices = parseJson(row.outcomePrices, []);
  if (outcomes.length !== 2 || !/^yes$/i.test(outcomes[0]) || !/^no$/i.test(outcomes[1]) || prices.length < 2) return null;
  const yes = Number(prices[0]); if (yes >= 0.999) return 1; if (yes <= 0.001) return 0; return null;
}
function targetBucket(days) { return days === 7 ? "7d" : days === 3 ? "3d" : "1d"; }
function pickPrice(candles, targetSeconds, platform) {
  const normalized = candles.map((c) => ({ timestamp: Number(c.t ?? c.timestamp ?? c.end_period_ts) * (Number(c.t ?? c.timestamp ?? c.end_period_ts) > 100000000000 ? 0.001 : 1), price: platform === "polymarket" ? Number(c.p) : Number(c.price?.close_dollars), })).filter((c) => Number.isFinite(c.timestamp) && Number.isFinite(c.price) && c.timestamp <= targetSeconds).sort((a, b) => a.timestamp - b.timestamp);
  return normalized.at(-1) ?? null;
}
async function polyObservations(markets) {
  const selected = markets.filter((row) => outcomePoly(row) !== null && row.clobTokenIds && row.endDate && Number(row.volume ?? 0) > 0).sort((a, b) => new Date(b.endDate) - new Date(a.endDate)).slice(0, corpusLimit);
  const observations = [];
  for (const row of selected) {
    const tokens = parseJson(row.clobTokenIds, []); const close = new Date(row.endDate); const start = new Date(close.getTime() - 10 * 86400000); const end = new Date(close.getTime() + 86400000);
    try {
      const response = await get(`https://clob.polymarket.com/prices-history?market=${encodeURIComponent(tokens[0])}&startTs=${Math.floor(start.getTime() / 1000)}&endTs=${Math.floor(end.getTime() / 1000)}&fidelity=1440`);
      for (const days of [7, 3, 1]) { const target = new Date(close.getTime() - days * 86400000); const point = pickPrice(response.history ?? [], target.getTime() / 1000, "polymarket"); if (!point) continue; observations.push({ venue: "polymarket", marketId: row.conditionId ?? row.id, sourceId: tokens[0], category: category(row.category, row.question), snapshotAt: new Date(point.timestamp * 1000).toISOString(), closeAt: close.toISOString(), price: point.price, outcome: outcomePoly(row), liquidity: liquidity(row.volume, row.liquidity), timeBucket: targetBucket(days), provenance: "replay", source: "polymarket-clob-prices-history" }); }
    } catch { historyFailures++; /* Missing/retired CLOB history is excluded and counted below. */ }
  }
  return { selected: selected.length, observations };
}
async function kalshiObservations(markets) {
  const selected = markets.filter((row) => ["yes", "no"].includes(String(row.result).toLowerCase()) && row.ticker && row.close_time && !String(row.ticker).includes("CROSSCATEGORY")).sort((a, b) => new Date(b.close_time) - new Date(a.close_time)).slice(0, corpusLimit);
  const observations = [];
  for (const row of selected) {
    const close = new Date(row.close_time); const start = new Date(close.getTime() - 10 * 86400000); const end = new Date(close.getTime() + 86400000); const series = row.series_ticker ?? String(row.ticker).split("-").slice(0, 1)[0];
    try {
      const series = row._series ?? row.series_ticker ?? String(row.ticker).split("-")[0];
      const path = row._source === "settled" ? `series/${encodeURIComponent(series)}/markets/${encodeURIComponent(row.ticker)}/candlesticks` : `historical/markets/${encodeURIComponent(row.ticker)}/candlesticks`;
      const response = await get(`https://api.elections.kalshi.com/trade-api/v2/${path}?start_ts=${Math.floor(start.getTime() / 1000)}&end_ts=${Math.floor(end.getTime() / 1000)}&period_interval=1440`);
      for (const days of [7, 3, 1]) { const target = new Date(close.getTime() - days * 86400000); const point = pickPrice(response.candlesticks ?? [], target.getTime() / 1000, "kalshi"); if (!point) continue; observations.push({ venue: "kalshi", marketId: row.ticker, sourceId: series, category: category(row.category, row.title), snapshotAt: new Date(point.timestamp * 1000).toISOString(), closeAt: close.toISOString(), price: point.price, outcome: String(row.result).toLowerCase() === "yes" ? 1 : 0, liquidity: liquidity(row.volume_fp, null), timeBucket: targetBucket(days), provenance: "replay", source: "kalshi-public-candlesticks" }); }
    } catch { historyFailures++; /* Missing historical cutoff data is excluded and counted below. */ }
  }
  return { selected: selected.length, observations };
}
const [polyMarkets, kalshiMarkets] = await Promise.all([getPolyMarkets(), getKalshiMarkets()]);
const [poly, kalshi] = await Promise.all([polyObservations(polyMarkets), kalshiObservations(kalshiMarkets)]);
const observations = [...poly.observations, ...kalshi.observations].sort((a, b) => a.snapshotAt.localeCompare(b.snapshotAt) || a.marketId.localeCompare(b.marketId));
await mkdir(new URL("data/", root), { recursive: true }); await mkdir(new URL("research/", root), { recursive: true });
const versionSuffix = process.env.VO_CORPUS_VERSION === "v2" ? "-v2" : "";
await writeFile(new URL(`data/observations${versionSuffix}.json`, root), `${JSON.stringify(observations, null, 2)}\n`);
await writeFile(new URL(`research/corpus-fetch${versionSuffix}.json`, root), `${JSON.stringify({ observedAt: new Date().toISOString(), corpusLimit, discovery: { polymarketRows: polyMarkets.length, kalshiRows: kalshiMarkets.length }, selected: { polymarket: poly.selected, kalshi: kalshi.selected }, observations: { polymarket: poly.observations.length, kalshi: kalshi.observations.length, total: observations.length }, calls, historyFailures, historySources: { polymarket: "https://clob.polymarket.com/prices-history", kalshi: ["https://api.elections.kalshi.com/trade-api/v2/historical/markets/{ticker}/candlesticks", "https://api.elections.kalshi.com/trade-api/v2/series/{series_ticker}/markets/{ticker}/candlesticks"] } }, null, 2)}\n`);
console.log(JSON.stringify({ calls, corpusLimit, historyFailures, polymarketRows: polyMarkets.length, kalshiRows: kalshiMarkets.length, selectedPolymarket: poly.selected, selectedKalshi: kalshi.selected, observations: { polymarket: poly.observations.length, kalshi: kalshi.observations.length, total: observations.length } }, null, 2));
