import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { MemWal } from "@mysten-incubation/memwal";
import {
	type CalibrationPrior,
	calibrationPrediction,
} from "../packages/engine/src/calibration-v2.ts";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const apiKey = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
if (!apiKey) throw new Error("Missing Tatum API key");
const headers = { "x-api-key": apiKey };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let calls = 0;
async function tatum(path: string) {
	await sleep(calls++ ? 400 : 0);
	const response = await fetch(
		`https://api.tatum.io/v4/data/prediction${path}`,
		{ headers, signal: AbortSignal.timeout(20000) },
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
function timeBucket(closeTime: string) {
	const days = (new Date(closeTime).getTime() - Date.now()) / 86400000;
	return days >= 5 ? "7d" : days >= 2 ? "3d" : days >= 0.5 ? "1d" : "other";
}
function parseSummary(text: string) {
	const match = text.match(/(\{"t":"bucket-summary".*\})\s*$/);
	if (!match) return null;
	try {
		return JSON.parse(match[1]) as {
			t: string;
			bucket: string;
			n: number;
			rate: number;
			meanPrice: number;
		};
	} catch {
		return null;
	}
}
const run = JSON.parse(
	await readFile(new URL("results/latest-replay-v2.json", root), "utf8"),
);
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
		.filter(
			(row: any) =>
				(row.status === "active" || row.status === "open") &&
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
		const ttc = timeBucket(market.closeTime);
		const namespace = `vo-v2-replay-${run.runId}-${venue}-${cat}`;
		const recalled = await memory.recall({
			query: `Calibration summary ${venue} ${cat} ${ttc} live price ${raw.toFixed(2)}`,
			namespace,
			limit: 20,
			sort: "relevance",
		});
		const summaries = recalled.results
			.map((hit) => ({ tag: parseSummary(hit.text), blobId: hit.blob_id }))
			.filter((item) => item.tag?.bucket === `${venue}|${cat}|${ttc}`)
			.sort((a, b) => (b.tag?.n ?? 0) - (a.tag?.n ?? 0));
		const best = summaries[0];
		const prior: CalibrationPrior | undefined = best?.tag
			? {
					count: best.tag.n,
					meanPrice: best.tag.meanPrice,
					positive: best.tag.rate * best.tag.n,
				}
			: undefined;
		const prediction = calibrationPrediction(raw, prior, 20, 5);
		const canonical = {
			pairId: `${venue}:${market.id}`,
			ts: new Date().toISOString(),
			venue,
			marketId: market.id,
			rawPrice: raw,
			correctedProbability: prediction.probability,
			method: prediction.method,
			citedBlobIds: summaries.slice(0, 5).map((item) => item.blobId),
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
			commitmentStatus: "pending-testnet-commit",
			commitmentTxDigest: null,
		});
	}
}
const memoryItems = liveRows.map((row) => ({
	text: `Live v2 calibration call ${row.venue} ${row.question}: raw ${row.rawPrice.toFixed(4)}, corrected ${row.correctedProbability.toFixed(4)}, confidence ${row.confidence.toFixed(2)}. Commitment digest ${row.digest}. Cited summaries: ${row.citedBlobIds.join(",") || "none"}. {"t":"live-call-v2","venue":"${row.venue}","marketId":"${row.marketId}","digest":"${row.digest}","raw":${row.rawPrice},"corrected":${row.correctedProbability},"cited":${JSON.stringify(row.citedBlobIds)}}`,
	namespace: "vo-live",
}));
const memoryWrite = memoryItems.length
	? await memory.rememberBulkAndWait(memoryItems, {
			idempotencyKey: `vo-live-v2-${new Date().toISOString().slice(0, 13)}-${randomBytes(4).toString("hex")}`,
			pollIntervalMs: 2500,
			timeoutMs: 180000,
		})
	: null;
const result = {
	observedAt: new Date().toISOString(),
	source: "live-v2",
	replayRunId: run.runId,
	tatumCalls: calls,
	calls: liveRows,
	memoryWrite,
	commitment: "Pending testnet commitment script.",
};
await mkdir(new URL("results/", root), { recursive: true });
await writeFile(
	new URL("results/live-calls.json", root),
	`${JSON.stringify(result, null, 2)}\n`,
);
console.log(
	JSON.stringify(
		{
			tatumCalls: calls,
			liveCalls: liveRows.length,
			replayRunId: run.runId,
			digests: liveRows.map((row) => row.digest),
		},
		null,
		2,
	),
);
