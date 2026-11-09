import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MemWal } from "@mysten-incubation/memwal";
import {
	bucketKey,
	categoryKey,
	type Observation,
	type Prior,
	predict,
} from "../packages/engine/src/index.ts";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (m && !process.env[m[1]])
		process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}
const apiKey = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
if (!apiKey) throw new Error("Missing Tatum API key");
const headers = { "x-api-key": apiKey };
let calls = 0;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function tatum(path: string) {
	await sleep(calls++ ? 400 : 0);
	const response = await fetch(
		`https://api.tatum.io/v4/data/prediction${path}`,
		{ headers },
	);
	if (!response.ok) throw new Error(`${response.status} ${path}`);
	return response.json();
}
function category(row: Record<string, unknown>) {
	return (
		String(row.category ?? "unknown")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "unknown"
	);
}
function currentPrice(payload: any, fallback: any[]) {
	const rows = payload?.data ?? payload?.outcomes ?? payload?.prices ?? [];
	const first = Array.isArray(rows) ? rows[0] : null;
	return Number(
		first?.midpoint ??
			first?.price ??
			first?.mid ??
			first?.last ??
			fallback?.[0]?.price ??
			NaN,
	);
}
function parseTag(text: string) {
	const match = text.match(/(\{"t":"observation".*\})\s*$/);
	if (!match) return null;
	try {
		return JSON.parse(match[1]) as {
			venue: string;
			category: string;
			ttc: string;
			liq: string;
			price: number;
			outcome: 0 | 1;
		};
	} catch {
		return null;
	}
}
const run = JSON.parse(
	await readFile(new URL("results/latest-replay.json", root), "utf8"),
);
const priors = new Map<string, Prior>();
const cited: string[] = [];
const memory = MemWal.create({
	key: process.env.MEMWAL_KEY_CHECKER,
	accountId: process.env.MEMWAL_ACCOUNT_ID,
	serverUrl: process.env.MEMWAL_SERVER_URL,
	namespace: "vo-live",
});
const liveRows: any[] = [];
for (const venue of ["polymarket", "kalshi"] as const) {
	const listed = await tatum(
		`/markets?platform=${venue}&limit=100&sort=volume_desc`,
	);
	const markets = (listed.data ?? [])
		.filter((row: any) => row.status === "active" || row.status === "open")
		.filter(
			(row: any) =>
				row.closeTime &&
				new Date(row.closeTime) > new Date() &&
				row.outcomes?.length === 2,
		)
		.slice(0, 3);
	for (const market of markets) {
		const pricePayload = await tatum(
			`/markets/${encodeURIComponent(market.id)}/price`,
		);
		const raw = currentPrice(pricePayload, market.outcomes);
		if (!Number.isFinite(raw) || raw < 0 || raw > 1) continue;
		const cat = category(market);
		const namespace = `vo-replay-${run.runId}-${venue}-${cat}`;
		const recalled = await memory.recall({
			query: `Calibration ${venue} ${cat} live price ${raw.toFixed(1)}`,
			namespace,
			limit: 50,
		});
		for (const hit of recalled.results) {
			const tag = parseTag(hit.text);
			if (!tag) continue;
			const observation = {
				venue,
				category: tag.category,
				timeBucket: tag.ttc,
				liquidity: tag.liq,
				price: tag.price,
			} as any;
			for (const key of [
				bucketKey(observation),
				`${venue}|${categoryKey(tag.category)}`,
				venue,
			]) {
				const prior = priors.get(key) ?? { count: 0, positive: 0 };
				priors.set(key, {
					count: prior.count + 1,
					positive: prior.positive + tag.outcome,
				});
			}
			cited.push(hit.blob_id);
		}
		const observation = {
			venue,
			category: cat,
			timeBucket: "other",
			liquidity: "unknown",
			price: raw,
		} as Observation;
		const prediction = predict(observation, priors, 5);
		const canonical = {
			pairId: `${venue}:${market.id}`,
			ts: new Date().toISOString(),
			venue,
			marketId: market.id,
			rawPrice: raw,
			correctedProbability: prediction.probability,
			method: prediction.method,
			citedBlobIds: [...new Set(cited)].slice(-5),
		};
		const digest = createHash("sha256")
			.update(JSON.stringify(canonical))
			.digest("hex");
		liveRows.push({
			...canonical,
			question: market.question,
			category: cat,
			closeTime: market.closeTime,
			confidence:
				prediction.priorCount >= 5
					? Math.min(0.99, prediction.priorCount / 20)
					: 0.1,
			digest,
			commitmentStatus: "pending-testnet-package",
			commitmentTxDigest: null,
		});
	}
}
const memoryItems = liveRows.map((row) => ({
	text: `Live calibration call ${row.venue} ${row.question}: raw ${row.rawPrice.toFixed(4)}, corrected ${row.correctedProbability.toFixed(4)}, confidence ${row.confidence.toFixed(2)}. Commitment digest ${row.digest}. Cited memories: ${row.citedBlobIds.join(",") || "none"}. {"t":"live-call","venue":"${row.venue}","marketId":"${row.marketId}","digest":"${row.digest}","raw":${row.rawPrice},"corrected":${row.correctedProbability},"cited":${JSON.stringify(row.citedBlobIds)}}`,
	namespace: "vo-live",
}));
let writeResult: unknown = null;
if (memoryItems.length)
	writeResult = await memory.rememberBulkAndWait(memoryItems, {
		idempotencyKey: `vo-live-${new Date().toISOString().slice(0, 13)}-${randomBytes(4).toString("hex")}`,
		pollIntervalMs: 2500,
		timeoutMs: 180000,
	});
await mkdir(new URL("results/", root), { recursive: true });
const result = {
	observedAt: new Date().toISOString(),
	source: "live",
	tatumCalls: calls,
	calls: liveRows,
	memoryWrite: writeResult,
	commitment: "No Sui commitment was sent; testnet Move package is pending.",
};
await writeFile(
	new URL("results/live-calls.json", root),
	`${JSON.stringify(result, null, 2)}\n`,
);
console.log(
	JSON.stringify(
		{
			tatumCalls: calls,
			liveCalls: liveRows.length,
			memoryWrite: writeResult,
			digests: liveRows.map((row) => row.digest),
		},
		null,
		2,
	),
);
