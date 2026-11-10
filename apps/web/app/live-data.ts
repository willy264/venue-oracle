export type LiveCall = {
	id: string;
	venue: "polymarket" | "kalshi";
	question: string;
	marketId: string;
	marketUrl: string;
	rawPrice: number | null;
	correctedProbability: number | null;
	snapshotAt: string;
	tatumPriceEndpoint: string;
	blobId: string;
	txDigest: string;
	packageId: string;
	category?: string;
	timeBucket?: string;
	liquidity?: number;
	replaySampleN?: number;
	sourceCategory?: string;
	provenance?: "LIVE" | "TESTNET" | "REPLAY";
	firstSample?: boolean;
	citedBlobIds?: string[];
};

import refreshed from "../../../results/live-calls.json";
import firstSample from "../../../results/live-calls-first-sample.json";

type EvidenceCall = {
	venue: "polymarket" | "kalshi";
	question: string;
	marketId: string;
	rawPrice: number;
	correctedProbability: number;
	citedBlobIds?: string[];
	ts: string;
	category?: string;
	timeBucket?: string;
	marketUrl?: string;
	venueUrl?: string;
	blobId?: string;
	commitmentTxDigest: string;
	commitmentPackageId: string;
	tatum: { priceEndpoint: string };
	liquidity?: number;
	replaySampleN?: number;
	sourceCategory?: string;
};
function mapCall(
	call: EvidenceCall,
	id: string,
	first = false,
	blobId = call.blobId,
): LiveCall {
	const validProbability = (value: number) =>
		Number.isFinite(value) && value > 0 && value <= 1;
	return {
		id,
		venue: call.venue,
		question: call.question,
		marketId: call.marketId,
		marketUrl: call.marketUrl ?? call.venueUrl ?? "",
		rawPrice: validProbability(call.rawPrice) ? call.rawPrice : null,
		correctedProbability: validProbability(call.correctedProbability)
			? call.correctedProbability
			: null,
		snapshotAt: call.ts,
		tatumPriceEndpoint: call.tatum.priceEndpoint,
		blobId: blobId ?? "",
		txDigest: call.commitmentTxDigest,
		packageId: call.commitmentPackageId,
		category: call.category,
		timeBucket: call.timeBucket,
		liquidity: call.liquidity,
		replaySampleN: call.replaySampleN,
		sourceCategory: call.sourceCategory,
		provenance: first ? "TESTNET" : "LIVE",
		firstSample: first,
		citedBlobIds: call.citedBlobIds ?? [],
	};
}

export const liveCalls: LiveCall[] = (
	refreshed.calls as unknown as EvidenceCall[]
).map((call, index) =>
	mapCall(call, `VO-LIVE-${String(index + 1).padStart(2, "0")}`),
);
export const firstSampleCalls: LiveCall[] = (
	firstSample.calls as unknown as EvidenceCall[]
).map((call, index) =>
	mapCall(
		call,
		`VO-FIRST-${String(index + 1).padStart(2, "0")}`,
		true,
		firstSample.memoryWrite.results[index].blob_id,
	),
);

export function decisionFor(call: LiveCall) {
	if (call.rawPrice == null || call.correctedProbability == null)
		return "Price unavailable";
	if (call.correctedProbability > call.rawPrice)
		return "Market looks underpriced";
	if (call.correctedProbability < call.rawPrice)
		return "Market looks overpriced";
	return "No calibration edge";
}
