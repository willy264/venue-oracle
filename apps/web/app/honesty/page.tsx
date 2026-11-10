import replay from "../../../../results/latest-replay-v2.json";

type Row = (typeof replay.rows)[number];

function bands(venue: Row["venue"]) {
	const rows = replay.rows.filter((row) => row.venue === venue);
	return Array.from({ length: 5 }, (_, index) => {
		const lower = index / 5;
		const selected = rows.filter(
			(row) => row.rawProbability >= lower && row.rawProbability < lower + 0.2,
		);
		const n = selected.length;
		return {
			mean: n
				? selected.reduce((sum, row) => sum + row.rawProbability, 0) / n
				: lower + 0.1,
			observed: n ? selected.reduce((sum, row) => sum + row.outcome, 0) / n : 0,
			n,
		};
	});
}

function Diagram({ venue }: { venue: Row["venue"] }) {
	const points = bands(venue);
	return (
		<div className="reliability-chart">
			<svg
				viewBox="0 0 420 300"
				role="img"
				aria-label={`${venue} raw price reliability diagram, predicted probability against observed frequency`}
			>
				<line className="diagonal" x1="44" y1="256" x2="380" y2="20" />
				{[0, 25, 50, 75, 100].map((tick) => (
					<g key={tick}>
						<line
							className="gridline"
							x1="44"
							y1={256 - tick * 2.36}
							x2="380"
							y2={256 - tick * 2.36}
						/>
						<text x="8" y={261 - tick * 2.36}>
							{tick}%
						</text>
						<text x={38 + tick * 3.36} y="280">
							{tick}%
						</text>
					</g>
				))}
				{points
					.filter((point) => point.n > 0)
					.map((point) => (
						<g key={`${point.mean}-${point.observed}`}>
							<circle
								className={`reliability-point${point.n < 5 ? " too-few" : ""}`}
								cx={44 + point.mean * 336}
								cy={256 - point.observed * 236}
								r={Math.max(4, Math.min(12, Math.sqrt(point.n || 1)))}
							/>
							<title>{`${Math.round(point.mean * 100)}% predicted, ${Math.round(point.observed * 100)}% observed, n=${point.n}`}</title>
							{point.n < 5 && (
								<text
									className="too-few-label"
									x={44 + point.mean * 336}
									y={256 - point.observed * 236 - 14}
									textAnchor="middle"
								>
									too few to judge
								</text>
							)}
						</g>
					))}
			</svg>
			<div className="chart-axis-label">Predicted probability</div>
		</div>
	);
}

export default function Honesty() {
	return (
		<>
			<div className="eyebrow">VENUE HONESTY / RAW PRICE</div>
			<h1 className="title">
				When a market says 70%, does it happen 70% of the time?
			</h1>
			<p className="lede">
				Reliability diagrams compare each venue's raw probability with the
				observed frequency in the committed v2 replay corpus. Dots with fewer
				than five observations are too few to judge.
			</p>
			<div className="honesty-grid">
				{(["polymarket", "kalshi"] as const).map((venue) => (
					<section className="section honesty-panel" key={venue}>
						<h2>{venue}</h2>
						<Diagram venue={venue} />
						<p className="muted">
							The diagonal is perfect calibration. Points below it are
							overconfident; points above it are underconfident.
						</p>
					</section>
				))}
			</div>
			<section className="section">
				<h2>Held-out headline</h2>
				<p className="headline-result">
					Better calibrated (error{" "}
					{(replay.metrics.holdout.rawCalibrationError * 100).toFixed(1)}% →{" "}
					{(replay.metrics.holdout.correctedCalibrationError * 100).toFixed(1)}
					%), not more accurate on held-out data (Brier{" "}
					{replay.metrics.holdout.rawBrier.toFixed(4)} →{" "}
					{replay.metrics.holdout.correctedBrier.toFixed(4)}).
				</p>
			</section>
		</>
	);
}
