import { describe, expect, it } from "vitest";
import { brier, bucketKey, priceBand, replay, summary } from "./index.js";

const base = (index: number, outcome: 0 | 1) => ({
	venue: "polymarket" as const,
	marketId: `m-${index}`,
	category: "Sports",
	snapshotAt: `2026-01-${String(index).padStart(2, "0")}T00:00:00.000Z`,
	closeAt: "2026-02-01T00:00:00.000Z",
	price: 0.8,
	outcome,
	liquidity: "medium" as const,
	timeBucket: "1d" as const,
	provenance: "replay" as const,
});

describe("calibration engine", () => {
	it("uses stable price bands", () => {
		expect(priceBand(0.82)).toBe("0.8-0.9");
		expect(priceBand(1)).toBe("0.9-1.0");
	});
	it("builds a venue/category/time/liquidity/price bucket", () => {
		expect(bucketKey(base(1, 1))).toBe("polymarket|sports|1d|medium|0.8-0.9");
	});
	it("scores before learning from the current outcome", () => {
		const scored = replay([
			base(1, 1),
			base(2, 1),
			base(3, 1),
			base(4, 1),
			base(5, 1),
			base(6, 0),
		]);
		expect(scored[0].method).toBe("raw");
		expect(scored[5].priorCount).toBeGreaterThanOrEqual(5);
	});
	it("keeps raw and corrected Brier scores", () => {
		expect(brier(0.8, 1)).toBeCloseTo(0.04);
		const result = summary(
			replay(Array.from({ length: 6 }, (_, i) => base(i + 1, i === 5 ? 0 : 1))),
		);
		expect(result.count).toBe(6);
		expect(result.rawBrier).not.toBeNull();
	});
});
