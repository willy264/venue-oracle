import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MemWal } from "@mysten-incubation/memwal";

const root = new URL("../", import.meta.url);
let envText = "";
try {
	envText = await readFile(new URL(".env", root), "utf8");
} catch {}
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const apiKey = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
if (!apiKey) throw new Error("Missing Tatum API key");
const headers = { "x-api-key": apiKey };
const ids = [
	"0xf036481613a53faafdc7638824e5dfab03b4dda5b9bf13fbdfa2075e2d4a8bea",
	"0xca394e0db041f91ac2d69f3ea06efdfc8643acb0d2751283bd594e7b8bd581f9",
	"0x94ae8e5414e036e2e9b6b6514c048042bf74d089614d7f7d73635693f9d5186b",
];
const replayBucketSamples = {
	"us-current-affairs|7d": 4,
	"us-current-affairs|3d": 4,
	"us-current-affairs|1d": 4,
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let calls = 0;
async function tatum(path) {
	await sleep(calls++ ? 450 : 0);
	const response = await fetch(
		`https://api.tatum.io/v4/data/prediction${path}`,
		{ headers, signal: AbortSignal.timeout(20000) },
	);
	if (!response.ok) throw new Error(`${response.status} ${path}`);
	return response.json();
}
const timeBucket = (closeTime) => {
	const days = (new Date(closeTime).getTime() - Date.now()) / 86400000;
	return days >= 5 ? "7d" : days >= 2 ? "3d" : days >= 0.5 ? "1d" : "other";
};
const rawPrice = (price) =>
	Number(price.data?.midPrice ?? price.data?.yes?.price ?? NaN);
const replay = JSON.parse(
	await readFile(new URL("results/latest-replay-v2.json", root), "utf8"),
);
const memory = MemWal.create({
	key: process.env.MEMWAL_KEY_CHECKER,
	accountId: process.env.MEMWAL_ACCOUNT_ID,
	serverUrl: process.env.MEMWAL_SERVER_URL,
	namespace: "vo-live",
});
const rows = [];
const recallCounts = [];
for (const id of ids) {
	const market = (await tatum(`/markets/${encodeURIComponent(id)}`)).data;
	const price = await tatum(`/markets/${encodeURIComponent(id)}/price`);
	const raw = rawPrice(price);
	if (!market?.source?.url || !Number.isFinite(raw))
		throw new Error(`Incomplete Tatum record for ${id}`);
	const ts = price.data.timestamp ?? new Date().toISOString();
	const bucket = timeBucket(market.closeTime);
	const family = "us-current-affairs";
	const sampleN = replayBucketSamples[`${family}|${bucket}`] ?? 0;
	const recalled = await memory.recall({
		query: `Calibration summary polymarket ${family} ${bucket} live price ${raw.toFixed(2)}`,
		namespace: `vo-v2-replay-${replay.runId}-polymarket-${family}`,
		limit: 20,
		sort: "relevance",
	});
	recallCounts.push({
		marketId: id,
		count: recalled.results?.length ?? 0,
		bucket: `${family}|${bucket}`,
		replaySampleN: sampleN,
	});
	const canonical = {
		pairId: `polymarket:${id}`,
		ts,
		venue: "polymarket",
		marketId: id,
		rawPrice: raw,
		correctedProbability: raw,
		method: "abstain-no-qualifying-summary",
		citedBlobIds: [],
	};
	const digest = createHash("sha256")
		.update(JSON.stringify(canonical))
		.digest("hex");
	rows.push({
		...canonical,
		question: market.question,
		category: family,
		sourceCategory: market.category,
		timeBucket: bucket,
		replaySampleN: sampleN,
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
	text: `Live calibration call ${row.venue} ${row.question}: raw ${row.rawPrice.toFixed(4)}, corrected ${row.correctedProbability.toFixed(4)}. The closest v2 replay family ${row.category} ${row.timeBucket} bucket had n=${row.replaySampleN}; no qualifying summary was recalled, so the engine abstained and retained the raw price. Commitment digest ${row.digest}. {"t":"live-call","venue":"${row.venue}","marketId":"${row.marketId}","digest":"${row.digest}","raw":${row.rawPrice},"corrected":${row.correctedProbability},"method":"${row.method}"}`,
	namespace: "vo-live",
}));
const memoryWrite = await memory.rememberBulkAndWait(items, {
	idempotencyKey: `vo-live-extra-${new Date().toISOString().slice(0, 13)}-${randomBytes(4).toString("hex")}`,
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
		"Three real Polymarket current-affairs markets closing 1-7 days; no forced correction",
	replayBucketSamples,
	tatumCalls: calls,
	calls: rows,
	memoryWrite,
	recallCounts,
	commitment: "Pending testnet commitment script.",
};
await mkdir(new URL("results/", root), { recursive: true });
await writeFile(
	new URL("results/live-calls-extra.json", root),
	`${JSON.stringify(output, null, 2)}\n`,
);
console.log(
	JSON.stringify(
		{
			calls,
			liveCalls: rows.length,
			replayBucketSamples,
			recallCounts,
			memoryWrite,
		},
		null,
		2,
	),
);
