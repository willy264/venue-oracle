import replay from "../../../results/latest-replay-v2.json";
import { LiveBoard } from "./components/live-board";
import { liveCalls } from "./live-data";

const holdout = replay.metrics.holdout;

export default function Home() {
	const venueCounts = liveCalls.reduce<Record<string, number>>(
		(counts, call) => {
			counts[call.venue] = (counts[call.venue] ?? 0) + 1;
			return counts;
		},
		{},
	);
	const subtitle = Object.entries(venueCounts)
		.map(
			([venue, count]) => `${count} ${venue[0].toUpperCase()}${venue.slice(1)}`,
		)
		.join(" / ");
	return (
		<>
			<div className="eyebrow">LIVE CALIBRATION / 09 NOV 2026</div>
			<h1 className="title">How honest is each venue?</h1>
			<p className="lede">
				Venue Oracle calibrates each venue independently. These live records are
				real Tatum snapshots, with their market IDs, source links, Walrus
				memories, and Sui testnet commitments exposed for inspection.
			</p>
			<p className="headline-result">
				Better calibrated (error 0.145 -&gt; 0.102), not more accurate on
				held-out data (Brier 0.1955 -&gt; 0.1984).
			</p>
			<div className="stats">
				<div className="stat">
					<b>{replay.corpus.total}</b>
					<span>v2 resolved observations</span>
				</div>
				<div className="stat">
					<b>{holdout.rawBrier.toFixed(4)}</b>
					<span>held-out raw Brier</span>
				</div>
				<div className="stat">
					<b>{holdout.correctedBrier.toFixed(4)}</b>
					<span>held-out corrected Brier</span>
				</div>
				<div className="stat">
					<b>{liveCalls.length}</b>
					<span>verified testnet calls</span>
				</div>
			</div>
			<div className="toolbar">
				<h2>Open calibration calls</h2>
				<span>{subtitle} / Tatum snapshots</span>
			</div>
			<LiveBoard calls={liveCalls} />
		</>
	);
}
