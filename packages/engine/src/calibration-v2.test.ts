import { describe, expect, it } from "vitest";
import {
	calibrationBucket,
	calibrationError,
	calibrationPrediction,
	updateCalibrationPrior,
} from "./calibration-v2.js";

describe("calibration v2", () => {
	it("uses venue, category, and time bucket", () =>
		expect(
			calibrationBucket({
				venue: "kalshi",
				category: "Fed rates",
				timeBucket: "3d",
			}),
		).toBe("kalshi|fed-rates|3d"));
	it("shrinks toward the observed rate from the raw price", () => {
		const prior = { count: 20, meanPrice: 0.4, positive: 16 };
		const prediction = calibrationPrediction(0.5, prior, 20, 5);
		expect(prediction.method).toBe("shrunk");
		expect(prediction.probability).toBeCloseTo(0.7);
	});
	it("abstains with too little evidence", () =>
		expect(
			calibrationPrediction(0.8, { count: 4, meanPrice: 0.2, positive: 4 })
				.method,
		).toBe("raw"));
	it("updates an online prior", () =>
		expect(updateCalibrationPrior(undefined, 0.6, 1)).toEqual({
			count: 1,
			meanPrice: 0.6,
			positive: 1,
		}));
	it("calculates a weighted calibration error", () =>
		expect(calibrationError([0.9, 0.1], [1, 0])).toBeCloseTo(0.1));
});
