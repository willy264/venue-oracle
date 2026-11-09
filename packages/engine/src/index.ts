export type Venue = "polymarket" | "kalshi";
export type LiquidityBucket = "low" | "medium" | "high" | "unknown";
export type TimeBucket = "7d" | "3d" | "1d" | "other";

export interface Observation {
	venue: Venue;
	marketId: string;
	category: string;
	snapshotAt: string;
	closeAt: string;
	price: number;
	outcome: 0 | 1;
	liquidity: LiquidityBucket;
	timeBucket: TimeBucket;
	provenance: "replay" | "live";
}

export interface Prior {
	count: number;
	positive: number;
}

export interface Prediction {
	probability: number;
	method: "bucket" | "category" | "venue" | "raw";
	priorCount: number;
	bucketKey: string;
}

export interface ScoredObservation extends Observation {
	rawProbability: number;
	correctedProbability: number;
	method: Prediction["method"];
	priorCount: number;
	rawBrier: number;
	correctedBrier: number;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const priceBand = (price: number): string => {
	const normalized = clamp(price);
	return normalized >= 1 ? "0.9-1.0" : `${(Math.floor(normalized * 10) / 10).toFixed(1)}-${(Math.floor(normalized * 10) / 10 + 0.1).toFixed(1)}`;
};
export const categoryKey = (category: string): string => category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
export const bucketKey = (observation: Pick<Observation, "venue" | "category" | "timeBucket" | "liquidity" | "price">): string => [observation.venue, categoryKey(observation.category), observation.timeBucket, observation.liquidity, priceBand(observation.price)].join("|");
export const categoryBucketKey = (observation: Pick<Observation, "venue" | "category">): string => [observation.venue, categoryKey(observation.category)].join("|");
export const venueBucketKey = (observation: Pick<Observation, "venue">): string => observation.venue;

export function updatePrior(prior: Prior | undefined, outcome: 0 | 1): Prior {
	return { count: (prior?.count ?? 0) + 1, positive: (prior?.positive ?? 0) + outcome };
}

export function probability(prior: Prior): number {
	return (prior.positive + 1) / (prior.count + 2);
}

export function predict(observation: Observation, priors: ReadonlyMap<string, Prior>, minimumSample = 5): Prediction {
	const candidates: Array<[Prediction["method"], string]> = [
		["bucket", bucketKey(observation)],
		["category", categoryBucketKey(observation)],
		["venue", venueBucketKey(observation)],
	];
	for (const [method, key] of candidates) {
		const prior = priors.get(key);
		if (prior && prior.count >= minimumSample) return { probability: probability(prior), method, priorCount: prior.count, bucketKey: key };
	}
	return { probability: observation.price, method: "raw", priorCount: 0, bucketKey: bucketKey(observation) };
}

export function brier(probabilityValue: number, outcome: 0 | 1): number {
	return (probabilityValue - outcome) ** 2;
}

export function replay(observations: readonly Observation[], minimumSample = 5): ScoredObservation[] {
	const priors = new Map<string, Prior>();
	const sorted = [...observations].sort((a, b) => a.snapshotAt.localeCompare(b.snapshotAt) || a.marketId.localeCompare(b.marketId));
	const scored: ScoredObservation[] = [];
	for (const observation of sorted) {
		const prediction = predict(observation, priors, minimumSample);
		scored.push({ ...observation, rawProbability: observation.price, correctedProbability: prediction.probability, method: prediction.method, priorCount: prediction.priorCount, rawBrier: brier(observation.price, observation.outcome), correctedBrier: brier(prediction.probability, observation.outcome) });
		const keys = [bucketKey(observation), categoryBucketKey(observation), venueBucketKey(observation)];
		for (const key of keys) priors.set(key, updatePrior(priors.get(key), observation.outcome));
	}
	return scored;
}

export function summary(scored: readonly ScoredObservation[]) {
	const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
	const calibration = new Map<string, { predicted: number[]; outcomes: number[] }>();
	for (const row of scored) {
		const key = `${row.venue}|${categoryKey(row.category)}|${priceBand(row.rawProbability)}`;
		const current = calibration.get(key) ?? { predicted: [], outcomes: [] };
		current.predicted.push(row.rawProbability);
		current.outcomes.push(row.outcome);
		calibration.set(key, current);
	}
	return {
		count: scored.length,
		rawBrier: mean(scored.map((row) => row.rawBrier)),
		correctedBrier: mean(scored.map((row) => row.correctedBrier)),
		correctedCount: scored.filter((row) => row.method !== "raw").length,
		calibration: [...calibration].map(([key, value]) => ({ key, count: value.outcomes.length, error: Math.abs(mean(value.predicted)! - mean(value.outcomes)!) })),
	};
}
