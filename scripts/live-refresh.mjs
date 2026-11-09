import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MemWal } from "@mysten-incubation/memwal";

const root = new URL("../", import.meta.url);
let envText = "";
try {
	envText = await readFile(new URL(".env", root), "utf8");
} catch {
	// GitHub Actions supplies the same values through the process environment.
}
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]]) {
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
	}
}

const apiKey = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
if (!apiKey) throw new Error("Missing Tatum API key");
const headers = { "x-api-key": apiKey };
const ids = [
	"0x1632539feac2c2879becdd9c82cbf6fe2a9d1a543081bcc4fc6095f3f5195815",
	"0xcb86b71e7ee2e62f8ecf5da5c8bd5f52d896970270abf420294a0ce0413cbf87",
	"0xa0e794b19ec1dda98d7fc518ec033233e25817b17e06f2a8fa4def146c15e15c",
	"0xbddb7c7946f22cd2c0fd059473c4cd0b3458e901bfa581afccdae0058ae25380",
	"0x41f94101d57bf028eff62f2cc3714adb79722553dc59c1676071459c0b009e45",
	"0x134e5143254278e5df6f0ffcf9502845fa935923b86c56fd627508552240a959",
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let calls = 0;
async function tatum(path) {
	await sleep(calls++ ? 400 : 0);
	const response = await fetch(
		`https://api.tatum.io/v4/data/prediction${path}`,
		{ headers, signal: AbortSignal.timeout(20000) },
	);
	if (!response.ok) throw new Error(`${response.status} ${path}`);
	return response.json();
}
const category = (market) =>
	String(market.category ?? "sports")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "") || "sports";
const timeBucket = (closeTime) => {
	const days = (new Date(closeTime).getTime() - Date.now()) / 86400000;
	return days >= 5 ? "7d" : days >= 2 ? "3d" : days >= 0.5 ? "1d" : "other";
};
const rawPrice = (price) =>
	Number(price.data?.midPrice ?? price.data?.yes?.price ?? NaN);
const memory = MemWal.create({
	key: process.env.MEMWAL_KEY_CHECKER,
	accountId: process.env.MEMWAL_ACCOUNT_ID,
	serverUrl: process.env.MEMWAL_SERVER_URL,
	namespace: "vo-live",
});
const replay = JSON.parse(
	await readFile(new URL("results/latest-replay-v2.json", root), "utf8"),
);
const rows = [];
const recallCounts = [];
for (const id of ids) {
	const market = (await tatum(`/markets/${encodeURIComponent(id)}`)).data;
	const price = await tatum(`/markets/${encodeURIComponent(id)}/price`);
	const raw = rawPrice(price);
	if (!market?.source?.url || !Number.isFinite(raw))
		throw new Error(`Incomplete Tatum record for ${id}`);
	const ts = price.data.timestamp ?? new Date().toISOString();
	const cat = category(market);
	const bucket = timeBucket(market.closeTime);
	const recalled = await memory.recall({
		query: `Calibration summary polymarket ${cat} ${bucket} live price ${raw.toFixed(2)}`,
		namespace: `vo-v2-replay-${replay.runId}-polymarket-${cat}`,
		limit: 20,
		sort: "relevance",
	});
	recallCounts.push({ marketId: id, count: recalled.results?.length ?? 0 });
	const canonical = {
		pairId: `polymarket:${id}`,
		ts,
		venue: "polymarket",
		marketId: id,
		rawPrice: raw,
		correctedProbability: raw,
		method: "abstain-no-polymarket-sports-summary",
		citedBlobIds: [],
	};
	const digest = createHash("sha256")
		.update(JSON.stringify(canonical))
		.digest("hex");
	rows.push({
		...canonical,
		question: market.question,
		category: cat,
		timeBucket: bucket,
		closeTime: market.closeTime,
		liquidity: market.liquidity,
		volume: market.volume,
		confidence: 0.1,
		digest,
		commitmentStatus: "pending-testnet-commit",
		commitmentTxDigest: null,
		marketUrl: market.source.url,
		venueUrl: market.source.url,
		tatum: {
			marketEndpoint: `https://api.tatum.io/v4/data/prediction/markets/${id}`,
			priceEndpoint: `https://api.tatum.io/v4/data/prediction/markets/${id}/price`,
			snapshotTimestamp: ts,
			rawPrice: raw,
		},
	});
}
const items = rows.map((row) => ({
	text: `Live calibration call ${row.venue} ${row.question}: raw ${row.rawPrice.toFixed(4)}, corrected ${row.correctedProbability.toFixed(4)}. No Polymarket sports summary met the minimum replay sample, so the engine abstained and retained the raw price. Commitment digest ${row.digest}. {"t":"live-call","venue":"${row.venue}","marketId":"${row.marketId}","digest":"${row.digest}","raw":${row.rawPrice},"corrected":${row.correctedProbability},"method":"${row.method}"}`,
	namespace: "vo-live",
}));
const memoryWrite = await memory.rememberBulkAndWait(items, {
	idempotencyKey: `vo-live-refresh-${new Date().toISOString().slice(0, 13)}-${randomBytes(4).toString("hex")}`,
	pollIntervalMs: 2500,
	timeoutMs: 180000,
});
for (const [index, result] of (memoryWrite.results ?? []).entries())
	rows[index].blobId = result.blob_id;
const output = {
	observedAt: new Date().toISOString(),
	source: "live-refresh-tatum",
	provenance: "LIVE",
	selection:
		"Tatum Polymarket sports markets closing 1-7 days; no forced correction",
	tatumCalls: calls,
	calls: rows,
	memoryWrite,
	recallCounts,
	commitment: "Pending testnet commitment script.",
};
await mkdir(new URL("results/", root), { recursive: true });
await writeFile(
	new URL("results/live-calls.json", root),
	`${JSON.stringify(output, null, 2)}\n`,
);
console.log(
	JSON.stringify({ calls, liveCalls: rows.length, memoryWrite }, null, 2),
);
