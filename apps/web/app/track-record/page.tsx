import { CalibrationTrace } from "../components/CalibrationTrace";
import { IdChip } from "../components/id-chip";
import { suivisionObjectUrl, suivisionTransactionUrl } from "../links";
import { firstSampleCalls, liveCalls } from "../live-data";

export default function TrackRecord() {
	return (
		<>
			<div className="eyebrow">IMMUTABLE CALL LOG / TATUM TESTNET VERIFIED</div>
			<h1 className="title">Track record</h1>
			<p className="lede">
				Each call below is linked to its real venue market, Tatum price
				endpoint, Walrus memory, and verified Sui testnet commitment.
			</p>
			<CalibrationTrace
				calls={[...liveCalls, ...firstSampleCalls]}
				compactTriggers
			/>
			<details className="proof">
				<summary>
					Open proof details for current calls and the first sample
				</summary>
				<div className="proof-body">
					<table className="table">
						<thead>
							<tr>
								<th>CALL</th>
								<th>VENUE / MARKET</th>
								<th>TATUM SNAPSHOT</th>
								<th>MEMORY / SUI</th>
							</tr>
						</thead>
						<tbody>
							{[...liveCalls, ...firstSampleCalls].map((call) => (
								<tr key={call.id}>
									<td>
										{call.id}
										<br />
										<span className="pill">
											{call.firstSample ? "FIRST SAMPLE" : "CURRENT LIVE"}
										</span>
										<br />
										<span className="muted">{call.snapshotAt}</span>
									</td>
									<td>
										<a href={call.marketUrl} target="_blank" rel="noreferrer">
											{call.question}
										</a>
										<br />
										<IdChip
											label="Market"
											value={call.marketId}
											href={call.marketUrl}
										/>
									</td>
									<td>
										<a
											href={call.tatumPriceEndpoint}
											target="_blank"
											rel="noreferrer"
										>
											{call.rawPrice == null
												? "Price unavailable"
												: `raw ${(call.rawPrice * 100).toFixed(2)}%`}
										</a>
									</td>
									<td>
										<IdChip
											label="Memory"
											value={call.blobId}
											href={`/memory#${call.blobId}`}
										/>
										<br />
										<a
											className="pill"
											href={suivisionTransactionUrl(call.txDigest)}
											target="_blank"
											rel="noreferrer"
										>
											VERIFIED {call.txDigest.slice(0, 10)}... ↗
										</a>
										<br />
										<a className="blob" href={`/memory#${call.blobId}`}>
											memory ↗
										</a>
										<br />
										<a
											className="blob"
											href={suivisionObjectUrl(call.packageId)}
											target="_blank"
											rel="noreferrer"
										>
											package ↗
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
		</>
	);
}
