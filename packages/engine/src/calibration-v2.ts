import type { Observation } from "./index.ts";

export type CalibrationPrior = {
	count: number;
	meanPrice: number;
	positive: number;
};

export type CalibrationPrediction = {
	probability: number;
	weight: number;
	priorCount: number;
	method: "raw" | "shrunk";
};

export function calibrationBucket(observation: Pick<Observation, "venue" | "category" | "timeBucket">): string {
	return `${observation.venue}|${observation.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}|${observation.timeBucket}`;
}

export function calibrationPrediction(raw: number, prior: CalibrationPrior | undefined, k = 20, minCount = 5): CalibrationPrediction {
	if (!prior || prior.count < minCount) return { probability: raw, weight: 0, priorCount: prior?.count ?? 0, method: "raw" };
	const weight = prior.count / (prior.count + k);
	const probability = Math.max(0, Math.min(1, raw + weight * (prior.positive / prior.count - prior.meanPrice)));
	return { probability, weight, priorCount: prior.count, method: "shrunk" };
}

export function updateCalibrationPrior(prior: CalibrationPrior | undefined, price: number, outcome: number): CalibrationPrior {
	if (!prior) return { count: 1, meanPrice: price, positive: outcome };
	return { count: prior.count + 1, meanPrice: prior.meanPrice + (price - prior.meanPrice) / (prior.count + 1), positive: prior.positive + outcome };
}

export function calibrationError(probabilities: number[], outcomes: number[], bins = 10): number {
	if (!probabilities.length) return 0;
	let weighted = 0;
	for (let bin = 0; bin < bins; bin++) {
		const rows = probabilities.map((probability, index) => ({ probability, outcome: outcomes[index] })).filter((row) => Math.min(bins - 1, Math.floor(row.probability * bins)) === bin);
		if (!rows.length) continue;
		weighted += (rows.length / probabilities.length) * Math.abs(rows.reduce((sum, row) => sum + row.probability, 0) / rows.length - rows.reduce((sum, row) => sum + row.outcome, 0) / rows.length);
	}
	return weighted;
}

export function brierInterval(probabilities: number[], outcomes: number[], samples = 400, seed = 17): [number, number] {
	if (!probabilities.length) return [0, 0];
	let state = seed >>> 0;
	const values: number[] = [];
	for (let sample = 0; sample < samples; sample++) {
		let total = 0;
		for (let i = 0; i < probabilities.length; i++) {
			state = (1664525 * state + 1013904223) >>> 0;
			const index = state % probabilities.length;
			total += (probabilities[index] - outcomes[index]) ** 2;
		}
		values.push(total / probabilities.length);
	}
	values.sort((a, b) => a - b);
	return [values[Math.floor(samples * 0.025)] ?? values[0], values[Math.floor(samples * 0.975)] ?? values.at(-1)!];
}
