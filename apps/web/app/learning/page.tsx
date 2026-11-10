import replay from "../../../../results/latest-replay-v2.json";

type Metric = {
	key: string;
	label: string;
	raw: number;
	corrected: number;
	range: [number, number];
	rawCI?: number[];
	correctedCI?: number[];
	verdict: string;
	icon: string;
};
const metrics: Metric[] = [
	{
		key: "brier",
		label: "Brier score (held-out, n=110)",
		raw: replay.metrics.holdout.rawBrier,
		corrected: replay.metrics.holdout.correctedBrier,
		range: [0.15, 0.25],
		rawCI: replay.metrics.holdout.rawBrier95,
		correctedCI: replay.metrics.holdout.correctedBrier95,
		verdict: "slightly worse",
		icon: "↑",
	},
	{
		key: "calibration",
		label: "Calibration error (held-out)",
		raw: replay.metrics.holdout.rawCalibrationError,
		corrected: replay.metrics.holdout.correctedCalibrationError,
		range: [0, 0.2],
		verdict: "improved",
		icon: "↓",
	},
];

function DotPlot({ metric }: { metric: Metric }) {
	const left = 128;
	const right = 388;
	const yRaw = 38;
	const yCorrected = 92;
	const x = (value: number) =>
		left +
		((value - metric.range[0]) / (metric.range[1] - metric.range[0])) *
			(right - left);
	const ticks = Array.from(
		{ length: 5 },
		(_, index) =>
			metric.range[0] + ((metric.range[1] - metric.range[0]) * index) / 4,
	);
	const whisker = (interval: number[] | undefined, y: number) =>
		interval && (
			<line
				className="plot-whisker"
				x1={x(interval[0])}
				x2={x(interval[1])}
				y1={y}
				y2={y}
			/>
		);
	return (
		<section
			className="dot-plot-section"
			aria-labelledby={`${metric.key}-title`}
		>
			<div className="dot-plot-heading">
				<h2 id={`${metric.key}-title`}>{metric.label}</h2>
				<span
					className={metric.verdict === "improved" ? "plot-good" : "plot-bad"}
				>
					{metric.icon} {metric.verdict}
				</span>
			</div>
			<svg
				className="dot-plot"
				viewBox="0 0 420 140"
				role="img"
				aria-label={`${metric.label}: raw ${metric.raw.toFixed(4)}, corrected ${metric.corrected.toFixed(4)}, ${metric.verdict}`}
			>
				{ticks.map((tick) => (
					<g key={tick}>
						<line
							className="plot-gridline"
							x1={x(tick)}
							x2={x(tick)}
							y1="16"
							y2="110"
						/>
						<text x={x(tick)} y="128" textAnchor="middle">
							{tick.toFixed(2)}
						</text>
					</g>
				))}
				<text className="plot-row-label" x="0" y={yRaw + 4}>
					Raw
				</text>
				<text className="plot-row-label" x="0" y={yCorrected + 4}>
					Corrected
				</text>
				{whisker(metric.rawCI, yRaw)}
				{whisker(metric.correctedCI, yCorrected)}
				<circle
					className="plot-dot raw-dot"
					cx={x(metric.raw)}
					cy={yRaw}
					r="6"
				/>
				<circle
					className="plot-dot corrected-dot"
					cx={x(metric.corrected)}
					cy={yCorrected}
					r="6"
				/>
				<text
					className="plot-value"
					x={x(metric.raw)}
					y={yRaw - 12}
					textAnchor="middle"
				>
					{metric.raw.toFixed(4)}
				</text>
				<text
					className="plot-value"
					x={x(metric.corrected)}
					y={yCorrected - 12}
					textAnchor="middle"
				>
					{metric.corrected.toFixed(4)}
				</text>
			</svg>
			<div className="plot-axis-title">Lower is better ←</div>
			<table className="visually-hidden">
				<caption>{metric.label}</caption>
				<thead>
					<tr>
						<th>Series</th>
						<th>Value</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Raw</td>
						<td>{metric.raw.toFixed(4)}</td>
					</tr>
					<tr>
						<td>Corrected</td>
						<td>{metric.corrected.toFixed(4)}</td>
					</tr>
				</tbody>
			</table>
		</section>
	);
}

export default function Learning() {
	return (
		<>
			<div className="eyebrow">WALK-FORWARD REPLAY / REAL DATA</div>
			<h1 className="title">Learning curve</h1>
			<p className="lede">
				On held-out data, memory made prices better calibrated (0.145 → 0.102)
				but not more accurate (Brier 0.1955 → 0.1984).
			</p>
			<div className="stats">
				<div className="stat">
					<b>{replay.corpus.total}</b>
					<span>resolved observations</span>
				</div>
				<div className="stat">
					<b>{replay.metrics.holdout.n}</b>
					<span>held-out observations</span>
				</div>
				<div className="stat">
					<b>0.1022</b>
					<span>corrected calibration error</span>
				</div>
				<div className="stat">
					<b>0.1984</b>
					<span>corrected held-out Brier</span>
				</div>
			</div>
			<section className="section">
				<h2>Held-out comparison</h2>
				<div className="dot-plot-grid">
					{metrics.map((metric) => (
						<DotPlot key={metric.key} metric={metric} />
					))}
				</div>
			</section>
			<section className="section">
				<h2>Version 1 (failed)</h2>
				<p className="lede">
					V1 used 54 observations: raw Brier 0.0983 versus corrected Brier
					0.2195. The diagnosis was tiny buckets and a prior pulled toward 50%,
					which over-corrected sparse evidence. See{" "}
					<a
						href="https://github.com/willy264/venue-oracle/blob/main/results/latest-replay.json"
						target="_blank"
						rel="noreferrer"
					>
						the preserved result file
					</a>
					.
				</p>
			</section>
			<section className="section">
				<h2>Interpretation</h2>
				<p className="lede">
					V2 improved calibration error but slightly worsened Brier score. This
					is mixed evidence, not a predictive edge. The raw price remains the
					safer baseline until more evidence arrives.
				</p>
			</section>
		</>
	);
}
