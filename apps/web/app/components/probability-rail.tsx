export function ProbabilityRail({
	raw,
	corrected,
	label,
}: {
	raw: number | null;
	corrected: number | null;
	label: string;
}) {
	if (raw == null) {
		return (
			<div
				className="probability-rail unavailable"
				aria-label={`${label}: price unavailable`}
				role="img"
			>
				<div className="rail-unavailable">Price unavailable</div>
			</div>
		);
	}
	const calibrated = corrected ?? raw;
	const same = Math.abs(raw - calibrated) < 0.01;
	const description = same
		? `${label}: raw and calibrated probability ${(raw * 100).toFixed(1)} percent; no calibration edge.`
		: `${label}: raw ${(raw * 100).toFixed(1)} percent, calibrated ${(calibrated * 100).toFixed(1)} percent.`;
	const markerPosition = (value: number) =>
		value <= 0.05 ? "edge-left" : value >= 0.95 ? "edge-right" : "";
	return (
		<div className="probability-rail" aria-label={description} role="img">
			<div className="rail-track">
				<span className="rail-tick tick-25" />
				<span className="rail-tick tick-50" />
				<span className="rail-tick tick-75" />
				{!same && (
					<span
						className="rail-connector"
						style={{
							left: `${Math.min(raw, calibrated) * 100}%`,
							width: `${Math.abs(raw - calibrated) * 100}%`,
						}}
					/>
				)}
				<span
					className={`rail-marker raw-marker ${markerPosition(raw)}`}
					style={{ left: `${raw * 100}%` }}
				>
					<span>Raw {(raw * 100).toFixed(1)}%</span>
				</span>
				{!same && (
					<span
						className={`rail-marker calibrated-marker ${markerPosition(calibrated)}`}
						style={{ left: `${calibrated * 100}%` }}
					>
						<span>Calibrated {(calibrated * 100).toFixed(1)}%</span>
					</span>
				)}
			</div>
			<div className="rail-scale">
				<span>0</span>
				<span>25</span>
				<span>50</span>
				<span>75</span>
				<span>100%</span>
			</div>
			{same && <small className="rail-note">No calibration edge</small>}
		</div>
	);
}
