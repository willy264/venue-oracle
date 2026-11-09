const memories = [
	"SB3tgey0tZjMhLUJs0UH4_G62ZDookLDhagNqYFlZXk",
	"WVl8UlRuUnOXDruLUhR0IqUoGpzMPZHYzom6HBCE5WA",
	"EWpeYh7pWSLc_JAH1XSfqNA_uLck6_Gc5ndljxAXEQ0",
	"OFzX4Nr8jLg9SVhQU3vypUil0FrVHsyk02sE9pVNUQc",
	"CV841lGMtlnYvZbiROJ3yIKoVBIw5PdTTC0DHHq0XuA",
	"Eh7PX7nUJwtEFjBWnU3mkezk4wOMQmpQpb-8yaxpjBk",
];
export default function Memory() {
	return (
		<>
			<div className="eyebrow">WALRUS MEMORY / INSPECTOR</div>
			<h1 className="title">The evidence layer</h1>
			<p className="lede">
				Every observation is stored as a readable sentence with a structured
				JSON tail. Live calls cite the records used to form their correction.
			</p>
			<div className="toolbar">
				<h2>vo-live memories</h2>
				<span>6 records / restore available server-side</span>
			</div>
			{memories.map((id, i) => (
				<article className="memory" id={id} key={id}>
					<div className="cardhead">
						<span>LIVE CALL {String(i + 1).padStart(2, "0")}</span>
						<span className="pill">DONE</span>
					</div>
					<p>
						Live calibration call for {i < 3 ? "Kalshi" : "Polymarket"}. Raw
						price was compared with prior resolved observations in the venue and
						category bucket. This record preserves the deterministic call digest
						before resolution.
					</p>
					<span className="blob">blob_id: {id}</span>
					<div className="metricrow">
						<span>namespace</span>
						<b>vo-live</b>
					</div>
				</article>
			))}
		</>
	);
}
