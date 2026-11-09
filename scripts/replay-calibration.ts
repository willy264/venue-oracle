import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { MemWal } from "@mysten-incubation/memwal";
import { bucketKey, categoryBucketKey, venueBucketKey, brier, categoryKey, predict, summary, type Observation, type Prior } from "../packages/engine/src/index.ts";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const observations = JSON.parse(await readFile(new URL("data/observations.json", root), "utf8")) as Observation[];
if (!observations.length) throw new Error("No corpus observations found");
const runId = `run-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomBytes(3).toString("hex")}`;
const client = MemWal.create({ key: process.env.MEMWAL_KEY_CHECKER, accountId: process.env.MEMWAL_ACCOUNT_ID, serverUrl: process.env.MEMWAL_SERVER_URL, namespace: `vo-replay-${runId}` });
const priors = new Map<string, Prior>();
const rows: Array<Observation & { rawProbability: number; correctedProbability: number; method: string; priorCount: number; rawBrier: number; correctedBrier: number; recallCount: number; memoryBlobId?: string }> = [];
const pending: Array<{ observation: Observation; text: string; namespace: string }> = [];
const blobIds = new Map<string, string>();

function observationText(observation: Observation) {
	return `Calibration observation: ${observation.venue} ${observation.category} priced YES at ${observation.price.toFixed(4)} ${observation.timeBucket} before close with ${observation.liquidity} liquidity; resolved ${observation.outcome ? "YES" : "NO"}. {"t":"observation","venue":"${observation.venue}","category":"${categoryKey(observation.category)}","ttc":"${observation.timeBucket}","liq":"${observation.liquidity}","price":${observation.price.toFixed(4)},"outcome":${observation.outcome},"snapshotAt":"${observation.snapshotAt}","closeAt":"${observation.closeAt}","marketId":"${observation.marketId}"}`;
}
async function flush() {
	if (!pending.length) return;
	const batch = pending.splice(0, 20);
	const idempotencyKey = `${runId}|${createHash("sha256").update(batch.map((item) => `${item.observation.marketId}|${item.observation.snapshotAt}`).join(",")).digest("hex")}`;
	const result = await client.rememberBulkAndWait(batch.map((item) => ({ text: item.text, namespace: item.namespace })), { idempotencyKey, pollIntervalMs: 2500, timeoutMs: 180000 });
	for (let i = 0; i < result.results.length; i++) {
		const blobId = result.results[i].blob_id;
		if (blobId) blobIds.set(`${batch[i].observation.marketId}|${batch[i].observation.snapshotAt}`, blobId);
	}
	if (result.failed) throw new Error(`MemWal batch failed: ${JSON.stringify(result)}`);
}

for (const observation of [...observations].sort((a, b) => a.snapshotAt.localeCompare(b.snapshotAt) || a.marketId.localeCompare(b.marketId))) {
	const namespace = `vo-replay-${runId}-${observation.venue}-${categoryKey(observation.category)}`;
	const recall = await client.recall({ query: `Calibration ${observation.venue} ${observation.category} ${observation.timeBucket} ${observation.liquidity} price ${observation.price.toFixed(1)}`, namespace, limit: 50, sort: "relevance" });
	const prediction = predict(observation, priors, 5);
	rows.push({ ...observation, rawProbability: observation.price, correctedProbability: prediction.probability, method: prediction.method, priorCount: prediction.priorCount, rawBrier: brier(observation.price, observation.outcome), correctedBrier: brier(prediction.probability, observation.outcome), recallCount: recall.results.length });
	for (const key of [bucketKey(observation), categoryBucketKey(observation), venueBucketKey(observation)]) {
		const prior = priors.get(key) ?? { count: 0, positive: 0 };
		priors.set(key, { count: prior.count + 1, positive: prior.positive + observation.outcome });
	}
	pending.push({ observation, text: observationText(observation), namespace });
	if (pending.length >= 20) await flush();
}
await flush();
for (const row of rows) row.memoryBlobId = blobIds.get(`${row.marketId}|${row.snapshotAt}`);

const beliefItems: Array<{ text: string; namespace: string }> = [];
const byBucket = new Map<string, typeof rows>();
for (const row of rows) { const key = bucketKey(row); const list = byBucket.get(key) ?? []; list.push(row); byBucket.set(key, list); }
for (const [key, list] of byBucket) {
	if (list.length < 5) continue;
	const positive = list.reduce((sum, row) => sum + row.outcome, 0);
	const estimate = (positive + 1) / (list.length + 2);
	const predecessors = list.map((row) => row.memoryBlobId).filter(Boolean).slice(-5).join(",");
	beliefItems.push({ namespace: `vo-replay-${runId}-${list[0].venue}-${categoryKey(list[0].category)}`, text: `Calibration belief ${key}: estimated event frequency ${(estimate * 100).toFixed(1)}% from ${list.length} resolved observations. Predecessor memories: ${predecessors}. {"t":"belief","bucket":"${key}","estimate":${estimate.toFixed(6)},"n":${list.length},"predecessors":[${list.map((row) => JSON.stringify(row.memoryBlobId ?? "")).join(",")}]}` });
}
if (beliefItems.length) await client.rememberBulkAndWait(beliefItems.slice(0, 20), { idempotencyKey: `${runId}|beliefs`, pollIntervalMs: 2500, timeoutMs: 180000 });
const result = { runId, source: "historical replay", observations: rows, summary: summary(rows), memory: { observationWrites: rows.filter((row) => row.memoryBlobId).length, beliefWrites: beliefItems.length, namespaces: [...new Set(rows.map((row) => `vo-replay-${runId}-${row.venue}-${categoryKey(row.category)}`))] } };
await mkdir(new URL("results/", root), { recursive: true });
await writeFile(new URL(`results/replay-${runId}.json`, root), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(new URL("results/latest-replay.json", root), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ runId, observations: rows.length, memoryWrites: result.memory.observationWrites, beliefWrites: result.memory.beliefWrites, summary: result.summary }, null, 2));
