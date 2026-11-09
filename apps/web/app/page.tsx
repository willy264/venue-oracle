import { decisionFor, liveCalls } from "./live-data";

function percent(value: number) {
	return `${(value * 100).toFixed(value < 0.01 ? 2 : 1)}%`;
}

export default function Home() {
	return (
		<>
			<div className="eyebrow">LIVE CALIBRATION / 09 NOV 2026</div>
			<h1 className="title">How honest is each venue?</h1>
			<p className="lede">
				Venue Oracle calibrates each venue independently. These six records are
				real Tatum snapshots, with their market IDs, source links, Walrus
				memories, and Sui testnet commitments exposed for inspection.
			</p>
			<div className="stats">
				<div className="stat">
					<b>550</b>
					<span>v2 resolved observations</span>
				</div>
				<div className="stat">
					<b>0.1955</b>
					<span>held-out raw Brier</span>
				</div>
				<div className="stat">
					<b>0.1984</b>
					<span>held-out corrected Brier</span>
				</div>
				<div className="stat">
					<b>6</b>
					<span>verified testnet calls</span>
				</div>
			</div>
			<div className="toolbar">
				<h2>Open calibration calls</h2>
				<span>3 Polymarket / 3 Kalshi / Tatum snapshots</span>
			</div>
			<div className="grid">
				{liveCalls.map((call) => (
					<article className="card" key={call.id}>
						<div className="cardhead">
							<span className="venue">{call.venue.toUpperCase()}</span>
							<span>{call.id} / VERIFIED</span>
						</div>
						<div className="event">{call.question}</div>
						<div className="prices">
							<div className="price">
								<span className="price-label">RAW TATUM PRICE</span>
								<strong>{percent(call.rawPrice)}</strong>
							</div>
							<div className="price">
								<span className="price-label">CORRECTED</span>
								<strong className="warning">
									{percent(call.correctedProbability)}
								</strong>
							</div>
						</div>
						<div className="metricrow">
							<span>calibration decision</span>
							<b>{decisionFor(call)}</b>
						</div>
						<div className="callmeta">
							<span>ID {call.marketId}</span>
							<span>{call.snapshotAt}</span>
						</div>
						<div className="links">
							<a
								className="why"
								href={call.marketUrl}
								target="_blank"
								rel="noreferrer"
							>
								OPEN MARKET
							</a>
							<a className="why" href={`/memory#${call.blobId}`}>
								MEMORY / {call.blobId.slice(0, 12)}...
							</a>
						</div>
						<div className="links">
							<a
								className="why"
								href={call.tatumPriceEndpoint}
								target="_blank"
								rel="noreferrer"
							>
								TATUM PRICE ENDPOINT
							</a>
							<span className="tx">SUI {call.txDigest.slice(0, 12)}...</span>
						</div>
					</article>
				))}
			</div>
		</>
	);
}
