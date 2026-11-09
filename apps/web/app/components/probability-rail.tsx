export function ProbabilityRail({
	raw,
	corrected,
	label,
}: {
	raw: number;
	corrected: number;
	label: string;
}) {
	const same = Math.abs(raw - corrected) < 0.01;
	const description = same
		? `${label}: raw and calibrated probability ${(raw * 100).toFixed(1)} percent; no calibration edge.`
		: `${label}: raw ${(raw * 100).toFixed(1)} percent, calibrated ${(corrected * 100).toFixed(1)} percent.`;
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
							left: `${Math.min(raw, corrected) * 100}%`,
							width: `${Math.abs(raw - corrected) * 100}%`,
						}}
					/>
				)}
				<span
					className="rail-marker raw-marker"
					style={{ left: `${raw * 100}%` }}
				>
					<span>Raw {(raw * 100).toFixed(1)}%</span>
				</span>
				{!same && (
					<span
						className="rail-marker calibrated-marker"
						style={{ left: `${corrected * 100}%` }}
					>
						<span>Calibrated {(corrected * 100).toFixed(1)}%</span>
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
