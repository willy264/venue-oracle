import { createHash, randomBytes } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { MemWal } from "@mysten-incubation/memwal";
import { brierInterval, calibrationBucket, calibrationError, calibrationPrediction, updateCalibrationPrior, type CalibrationPrior } from "../packages/engine/src/calibration-v2.ts";
import type { Observation } from "../packages/engine/src/index.ts";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) { const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ""); }
const observations = JSON.parse(await readFile(new URL("data/observations-v2.json", root), "utf8")) as Observation[];
if (!observations.length) throw new Error("No v2 corpus observations found");
const runId = `run-v2-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomBytes(3).toString("hex")}`;
const k = 20;
const holdoutStart = Math.floor(observations.length * 0.8);
const client = MemWal.create({ key: process.env.MEMWAL_KEY_CHECKER, accountId: process.env.MEMWAL_ACCOUNT_ID, serverUrl: process.env.MEMWAL_SERVER_URL, namespace: `vo-v2-replay-${runId}` });
const priors = new Map<string, CalibrationPrior>();
const previousSummary = new Map<string, string>();
const recalledKeys = new Set<string>();
const summaryCounts = new Map<string, number>();
const rows: Array<Record<string, unknown>> = [];
const pending: Array<{ key: string; kind: "summary" | "observation"; text: string; namespace: string }> = [];
const memoryBlobIds: Record<string, string> = {};
let summaryWrites = 0;
let observationWrites = 0;

function parseTail(text: string): Record<string, unknown> | null { const match = text.match(/(\{\"t\":\"(?:bucket-summary|observation)\".*\})\s*$/); if (!match) return null; try { return JSON.parse(match[1]); } catch { return null; } }
async function recallSummary(namespace: string, query: string): Promise<CalibrationPrior | undefined> {
	const response = await Promise.race([
		client.recall({ query, namespace, limit: 20, sort: "relevance" }),
		new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 5000)),
	]);
	if (!response) return undefined;
	const candidates = response.results.map((item) => parseTail(item.text ?? "")).filter((tag): tag is Record<string, unknown> => Boolean(tag && tag.t === "bucket-summary" && Number(tag.n) >= 0)).sort((a, b) => Number(b.n) - Number(a.n));
	if (!candidates[0]) return undefined;
	return { count: Number(candidates[0].n), meanPrice: Number(candidates[0].meanPrice), positive: Number(candidates[0].rate) * Number(candidates[0].n) };
}
async function flush() {
	while (pending.length) {
		const batch = pending.splice(0, 5);
		const idempotencyKey = `${runId}|${createHash("sha256").update(batch.map((item) => `${item.kind}|${item.key}`).join(",")).digest("hex")}`;
		const result = await client.rememberBulkAndWait(batch.map((item) => ({ text: item.text, namespace: item.namespace })), { idempotencyKey, pollIntervalMs: 2500, timeoutMs: 180000 });
		for (let i = 0; i < result.results.length; i++) { const blobId = result.results[i].blob_id; if (blobId) memoryBlobIds[batch[i].key] = blobId; }
		if (result.failed) throw new Error(`MemWal v2 batch failed: ${JSON.stringify(result)}`);
	}
}
function summaryDue(count: number) { return [1, 2, 5, 10, 20, 50].includes(count) || (count > 50 && count % 50 === 0); }
function addSummary(observation: Observation, prior: CalibrationPrior) {
	if (summaryWrites >= 24) return;
	const key = calibrationBucket(observation);
	const count = summaryCounts.get(key) ?? 0;
	if (!summaryDue(count)) return;
	const namespace = `vo-v2-replay-${runId}-${observation.venue}-${observation.category}`;
	const previous = previousSummary.get(key) ?? "";
	pending.push({ kind: "summary", key: `summary|${key}|${count}`, namespace, text: `Calibration summary ${key}: observed rate ${(prior.positive / prior.count * 100).toFixed(1)}% from ${prior.count} prior observations; mean raw price ${(prior.meanPrice * 100).toFixed(1)}%. Previous summary ${previous || "none"}. {"t":"bucket-summary","bucket":"${key}","venue":"${observation.venue}","category":"${observation.category}","ttc":"${observation.timeBucket}","n":${prior.count},"rate":${(prior.positive / prior.count).toFixed(6)},"meanPrice":${prior.meanPrice.toFixed(6)},"previous":"${previous}"}` });
	summaryWrites++;
}
for (let index = 0; index < observations.length; index++) {
	const observation = observations[index];
	const key = calibrationBucket(observation);
	const namespace = `vo-v2-replay-${runId}-${observation.venue}-${observation.category}`;
	let recalled: CalibrationPrior | undefined;
	if (!recalledKeys.has(key)) { recalled = await recallSummary(namespace, `Calibration summary ${observation.venue} ${observation.category} ${observation.timeBucket}`); recalledKeys.add(key); }
	const prior = priors.get(key) ?? recalled;
	const prediction = calibrationPrediction(observation.price, prior, k, 5);
	const isHoldout = index >= holdoutStart;
	rows.push({ ...observation, index, split: isHoldout ? "holdout" : "train-walk-forward", rawProbability: observation.price, correctedProbability: prediction.probability, method: prediction.method, weight: prediction.weight, priorCount: prediction.priorCount, rawBrier: (observation.price - observation.outcome) ** 2, correctedBrier: (prediction.probability - observation.outcome) ** 2, recallUsed: Boolean(recalled) });
	const updated = updateCalibrationPrior(prior, observation.price, observation.outcome);
	priors.set(key, updated);
	summaryCounts.set(key, updated.count);
	if (index < Math.min(20, observations.length) && pending.filter((item) => item.kind === "observation").length < 20) {
		pending.push({ kind: "observation", key: `observation|${index}|${observation.marketId}`, namespace: `vo-v2-observations-${runId}`, text: `V2 calibration observation: ${observation.venue} ${observation.category} priced YES at ${observation.price.toFixed(4)} ${observation.timeBucket} before close; resolved ${observation.outcome ? "YES" : "NO"}. {"t":"observation","venue":"${observation.venue}","category":"${observation.category}","ttc":"${observation.timeBucket}","price":${observation.price.toFixed(4)},"outcome":${observation.outcome},"snapshotAt":"${observation.snapshotAt}","marketId":"${observation.marketId}"}` });
		observationWrites++;
	}
	if (pending.length >= 20) await flush();
}
for (const [key, prior] of priors) {
	if (summaryWrites >= 24) break;
	const observation = observations.find((item) => calibrationBucket(item) === key);
	if (!observation) continue;
	const namespace = `vo-v2-replay-${runId}-${observation.venue}-${observation.category}`;
	const previous = previousSummary.get(key) ?? "";
	pending.push({ kind: "summary", key: `summary|${key}|final`, namespace, text: `Calibration summary ${key}: observed rate ${(prior.positive / prior.count * 100).toFixed(1)}% from ${prior.count} prior observations; mean raw price ${(prior.meanPrice * 100).toFixed(1)}%. Previous summary ${previous || "none"}. {"t":"bucket-summary","bucket":"${key}","venue":"${observation.venue}","category":"${observation.category}","ttc":"${observation.timeBucket}","n":${prior.count},"rate":${(prior.positive / prior.count).toFixed(6)},"meanPrice":${prior.meanPrice.toFixed(6)},"previous":"${previous}"}` });
	summaryWrites++;
}
await flush();
const holdout = rows.filter((row) => row.split === "holdout");
const train = rows.filter((row) => row.split === "train-walk-forward");
function metrics(items: Array<Record<string, unknown>>) {
	const raw = items.map((row) => Number(row.rawProbability)); const corrected = items.map((row) => Number(row.correctedProbability)); const outcomes = items.map((row) => Number(row.outcome));
	return { n: items.length, coverage: items.length ? corrected.filter((_, i) => items[i].method === "shrunk").length / items.length : 0, rawBrier: raw.length ? raw.reduce((sum, value, i) => sum + (value - outcomes[i]) ** 2, 0) / raw.length : 0, correctedBrier: corrected.length ? corrected.reduce((sum, value, i) => sum + (value - outcomes[i]) ** 2, 0) / corrected.length : 0, rawCalibrationError: calibrationError(raw, outcomes), correctedCalibrationError: calibrationError(corrected, outcomes), rawBrier95: brierInterval(raw, outcomes), correctedBrier95: brierInterval(corrected, outcomes) };
}
const result = { runId, k, holdoutStart, corpus: { total: observations.length, train: train.length, holdout: holdout.length }, metrics: { train: metrics(train), holdout: metrics(holdout), all: metrics(rows) }, memory: { summaryWrites, observationWrites, recalledSummaryDecisions: rows.filter((row) => row.recallUsed).length, blobIds: memoryBlobIds }, rows };
await mkdir(new URL("results/", root), { recursive: true });
await writeFile(new URL(`results/replay-v2-${runId}.json`, root), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(new URL("results/latest-replay-v2.json", root), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ runId, corpus: result.corpus, metrics: result.metrics, memory: { summaryWrites, observationWrites, recalledSummaryDecisions: result.memory.recalledSummaryDecisions } }, null, 2));
