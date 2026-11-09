import { mkdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const envText = await (await import("node:fs/promises")).readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const apiKey = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
if (!apiKey) throw new Error("Missing Tatum API key");
const api = "https://api.tatum.io/v4/data/prediction";
const headers = { "x-api-key": apiKey };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let calls = 0;

async function get(path) {
  await sleep(calls++ ? 400 : 0);
  const response = await fetch(`${api}${path}`, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function listMarkets(platform, filters, pages = 20) {
  const all = [];
  let cursor;
  for (let page = 0; page < pages; page++) {
    const params = new URLSearchParams({ platform, limit: "100", ...filters });
    if (cursor) params.set("cursor", cursor);
    const response = await get(`/markets?${params}`);
    const rows = Array.isArray(response.data) ? response.data : response.markets ?? [];
    all.push(...rows);
    cursor = response.pagination?.cursor;
    if (!cursor || rows.length === 0) break;
  }
  return all;
}

function tokens(value) {
  return new Set((value ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((token) => token.length > 2 && !["will", "the", "and", "this", "that", "for", "with", "from", "what", "more", "than"].includes(token)));
}

function similarity(a, b) {
  const left = tokens(a), right = tokens(b);
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function day(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function dayDistance(a, b) {
  if (!a || !b) return Infinity;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const startedAt = new Date().toISOString();
const polymarket = await listMarkets("polymarket", { status: "resolved" });
const kalshi = await listMarkets("kalshi", {});
const candidates = [];
for (const left of polymarket) {
  for (const right of kalshi) {
    const closeDistance = dayDistance(left.closeTime, right.closeTime);
    const score = similarity(left.question, right.question);
    if (closeDistance <= 1 && score >= 0.2) {
      candidates.push({
        pairId: `${left.id}__${right.id}`,
        verified: false,
        confidence: Number((score * (closeDistance === 0 ? 1 : 0.8)).toFixed(4)),
        titleSimilarity: Number(score.toFixed(4)),
        closeDistanceDays: Number(closeDistance.toFixed(3)),
        categoryMatch: Boolean(left.category && right.category && left.category.toLowerCase() === right.category.toLowerCase()),
        polymarketId: left.id,
        polymarketQuestion: left.question,
        polymarketCategory: left.category ?? "",
        polymarketStatus: left.status,
        polymarketCloseTime: left.closeTime,
        polymarketResolution: left.resolution?.outcome ?? "",
        kalshiId: right.id,
        kalshiQuestion: right.question,
        kalshiCategory: right.category ?? "",
        kalshiStatus: right.status,
        kalshiCloseTime: right.closeTime,
        kalshiResolution: right.resolution?.outcome ?? "",
      });
    }
  }
}
candidates.sort((a, b) => b.confidence - a.confidence);

await mkdir(new URL("data/", root), { recursive: true });
await mkdir(new URL("research/", root), { recursive: true });
const columns = Object.keys(candidates[0] ?? {
  pairId: "", verified: "", confidence: "", titleSimilarity: "", closeDistanceDays: "", categoryMatch: "",
  polymarketId: "", polymarketQuestion: "", polymarketCategory: "", polymarketStatus: "", polymarketCloseTime: "", polymarketResolution: "",
  kalshiId: "", kalshiQuestion: "", kalshiCategory: "", kalshiStatus: "", kalshiCloseTime: "", kalshiResolution: "",
});
await writeFile(new URL("data/candidate-pairs.csv", root), [columns.join(","), ...candidates.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n");
await writeFile(new URL("research/tatum-probe.json", root), JSON.stringify({
  fetchedAt: startedAt,
  calls,
  source: "Tatum Prediction API",
  endpoints: {
    markets: { creditsPerCall: 100, polymarketRows: polymarket.length, kalshiRows: kalshi.length, pagesPerPlatform: 20 },
    history: { creditsPerCall: 200, path: "/v4/data/prediction/markets/{id}/history", requiredQuery: ["interval", "start", "end"], sourceOptions: ["candlesticks", "midpoint"] },
  },
  candidates: { count: candidates.length, top: candidates.slice(0, 20) },
}, null, 2) + "\n");
console.log(JSON.stringify({ fetchedAt: startedAt, calls, polymarket: polymarket.length, kalshi: kalshi.length, candidates: candidates.length, top: candidates.slice(0, 5) }, null, 2));
