import { mkdir, writeFile, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const key = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
if (!key) throw new Error("Missing Tatum API key");
const base = "https://api.tatum.io/v4/data/prediction";
const headers = { "x-api-key": key };
let calls = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function get(path) {
  await sleep(calls++ ? 400 : 0);
  const response = await fetch(`${base}${path}`, { headers });
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}
async function page(path, pages = 5) {
  const rows = [];
  let cursor;
  for (let i = 0; i < pages; i++) {
    const separator = path.includes("?") ? "&" : "?";
    const response = await get(`${path}${cursor ? `${separator}cursor=${encodeURIComponent(cursor)}` : ""}`);
    rows.push(...(response.data ?? response.events ?? response.markets ?? []));
    cursor = response.pagination?.cursor;
    if (!cursor) break;
  }
  return rows;
}
function tally(rows, selector) {
  const result = {};
  for (const row of rows) {
    const key = selector(row) || "UNKNOWN";
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}
function outcome(row) {
  return row.resolution?.outcome ?? row.outcome ?? row.result ?? null;
}

const observedAt = new Date().toISOString();
const polymarketEvents = await page("/events?platform=polymarket&status=resolved&limit=100&includeMarkets=true");
const kalshiEvents = await page("/events?platform=kalshi&limit=100&includeMarkets=true");
const polymarketMarkets = polymarketEvents.flatMap((event) => event.markets ?? []);
const kalshiMarkets = kalshiEvents.flatMap((event) => event.markets ?? []);
const polymarketResolvedMarkets = polymarketMarkets.filter((market) => Boolean(outcome(market)) || ["resolved", "settled", "finalized"].includes(String(market.status).toLowerCase()));
const kalshiResolvedMarkets = kalshiMarkets.filter((market) => Boolean(outcome(market)) || ["resolved", "settled", "finalized"].includes(String(market.status).toLowerCase()));
const historySamples = [];
for (const market of [...polymarketResolvedMarkets.slice(0, 10), ...kalshiResolvedMarkets.slice(0, 10)]) {
  const close = market.closeTime ?? market.settleTime;
  if (!close) continue;
  const end = new Date(close);
  const start = new Date(end.getTime() - 30 * 86400000);
  const source = market.platform === "polymarket" ? "midpoint" : "candlesticks";
  try {
    const response = await get(`/markets/${encodeURIComponent(market.id)}/history?interval=1d&start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&source=${source}`);
    const row = response.data?.[0] ?? {};
    historySamples.push({ platform: market.platform, id: market.id, status: market.status, category: market.category ?? "", closeTime: close, source, candleCount: row.candles?.length ?? 0, partial: row.partial ?? null, availableFrom: row.availableFrom ?? null, outcome: outcome(market) });
  } catch (error) {
    historySamples.push({ platform: market.platform, id: market.id, status: market.status, category: market.category ?? "", closeTime: close, source, error: String(error.message ?? error) });
  }
}
const report = {
  observedAt,
  source: "Tatum Prediction API",
  calls,
  documentedCredits: { events: 100, markets: 100, history: 200 },
  events: {
    polymarket: { rows: polymarketEvents.length, statusCounts: tally(polymarketEvents, (row) => row.status), categories: tally(polymarketEvents, (row) => row.category), embeddedMarkets: polymarketMarkets.length },
    kalshi: { rows: kalshiEvents.length, statusCounts: tally(kalshiEvents, (row) => row.status), categories: tally(kalshiEvents, (row) => row.category), embeddedMarkets: kalshiMarkets.length },
  },
  resolvedMarkets: {
    polymarket: { rows: polymarketResolvedMarkets.length, outcomes: tally(polymarketResolvedMarkets, outcome), categories: tally(polymarketResolvedMarkets, (row) => row.category) },
    kalshi: { rows: kalshiResolvedMarkets.length, outcomes: tally(kalshiResolvedMarkets, outcome), categories: tally(kalshiResolvedMarkets, (row) => row.category) },
  },
  historySamples,
  candidatePairs: { scanned: 3920, matched: 0, csv: "data/candidate-pairs.csv" },
};
await mkdir(new URL("research/", root), { recursive: true });
await writeFile(new URL("research/gate1-depth.json", root), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
