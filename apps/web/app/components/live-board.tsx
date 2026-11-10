"use client";

import type { LiveCall } from "../live-data";
import { decisionFor } from "../live-data";
import { CalibrationSidebar } from "./calibration-sidebar";
import { IdChip } from "./id-chip";
import { ProbabilityRail } from "./probability-rail";

export function LiveBoard({ calls }: { calls: LiveCall[] }) {
	return (
		<div className="grid live-call-grid">
			{calls.map((call) => (
				<article
					className="card live-card"
					data-call-id={call.id}
					key={call.id}
				>
					<div className="cardhead">
						<span className="venue">{call.venue.toUpperCase()}</span>
						<span>
							{call.id} / {call.provenance ?? "LIVE"}
						</span>
					</div>
					<div className="event">{call.question}</div>
					<ProbabilityRail
						raw={call.rawPrice}
						corrected={call.correctedProbability}
						label={call.question}
					/>
					<div className="metricrow">
						<span>calibration decision</span>
						<b>{decisionFor(call)}</b>
					</div>
					<div className="callmeta">
						<IdChip
							label="Market"
							value={call.marketId}
							href={call.marketUrl}
						/>
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
						<IdChip
							label="Memory"
							value={call.blobId}
							href={`/memory#${call.blobId}`}
						/>
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
					</div>
					<div className="trust-links">
						<a
							href={`https://suiexplorer.testnet.sui.io/txblock/${call.txDigest}`}
							target="_blank"
							rel="noreferrer"
						>
							Sui commit ↗
						</a>
						<IdChip
							label="Tx"
							value={call.txDigest}
							href={`https://suiexplorer.testnet.sui.io/txblock/${call.txDigest}`}
						/>
						<a
							href={`https://suiexplorer.testnet.sui.io/object/${call.packageId}`}
							target="_blank"
							rel="noreferrer"
						>
							Package ↗
						</a>
						<IdChip
							label="Package"
							value={call.packageId}
							href={`https://suiexplorer.testnet.sui.io/object/${call.packageId}`}
						/>
					</div>
					<button
						className="why-button"
						data-why-trigger={call.id}
						type="button"
						onClick={() =>
							window.dispatchEvent(
								new CustomEvent("venue-oracle:open-sidebar", {
									detail: call.id,
								}),
							)
						}
					>
						Why this number?
					</button>
				</article>
			))}
			<CalibrationSidebar calls={calls} showTriggers={false} />
		</div>
	);
}
