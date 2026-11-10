import { readFileSync } from "node:fs";
import { join } from "node:path";
import { IdChip } from "../components/id-chip";
import { categoryDisplay, liveCalls } from "../live-data";

const replay = JSON.parse(
	readFileSync(
		join(process.cwd(), "../../results/latest-replay-v2.json"),
		"utf8",
	),
) as {
	rows: Array<{
		index: number;
		marketId: string;
		venue: string;
		category: string;
		outcome: number;
		rawProbability: number;
	}>;
	memory: { blobIds: Record<string, string> };
};
const identity = JSON.parse(
	readFileSync(
		join(process.cwd(), "../../results/memwal-identity.json"),
		"utf8",
	),
) as { agentId: string };

function percent(value: number) {
	return `${(value * 100).toFixed(1)}%`;
}

const memoryEvidence = JSON.parse(
	readFileSync(
		join(process.cwd(), "../../results/mainnet-memory-verification.json"),
		"utf8",
	),
) as {
	totalMemories: number;
	namespaces: Array<{ name: string; memory_count: number }>;
};
const restoreEvidence = JSON.parse(
	readFileSync(
		join(process.cwd(), "../../results/mainnet-restore-verification.json"),
		"utf8",
	),
) as {
	observedAt: string;
	namespacesListedAfter: number;
	total: number;
	rebuildResult: string;
	comparison: { identical: boolean };
};

export default function Memory() {
	const namespaces = memoryEvidence.namespaces;
	return (
		<>
			<div className="eyebrow">WALRUS MEMORY / INSPECTOR</div>
			<h1 className="title">The evidence layer</h1>
			<p className="lede">
				Every observation is stored as a readable sentence with a structured
				JSON tail. Each live call reports how many past cases its bucket holds;
				live citedBlobIds are empty, so the page does not claim live-time
				citations.
			</p>
			<section className="memory-writer" aria-labelledby="writer-title">
				<h2 id="writer-title">Writer delegate</h2>
				<p>MEMWAL_AGENT_ID / verified public delegate key</p>
				<IdChip label="Agent" value={identity.agentId} />
			</section>
			<div className="stats memory-stats">
				<div className="stat">
					<b>{memoryEvidence.totalMemories}</b>
					<span>verified mainnet memories</span>
				</div>
				<div className="stat">
					<b>{namespaces.length}</b>
					<span>mainnet namespaces</span>
				</div>
				<div className="stat">
					<b>{liveCalls.length}</b>
					<span>live-call records shown</span>
				</div>
			</div>
			<div className="toolbar">
				<h2>vo-live memories</h2>
				<span>
					Showing {liveCalls.length} live-call memories /{" "}
					{memoryEvidence.totalMemories} total on mainnet
				</span>
			</div>
			<section className="memory-restore" aria-labelledby="restore-title">
				<h2 id="restore-title">Restore available server-side</h2>
				<p className="muted">
					Last real restore: {restoreEvidence.observedAt}. The server restored
					the vo-live namespace and compared the next deterministic price.
				</p>
				<div className="restore-grid">
					<span>Namespaces listed</span>
					<b>{restoreEvidence.namespacesListedAfter}</b>
					<span>Memories recalled</span>
					<b>{restoreEvidence.total}</b>
					<span>Rebuild result</span>
					<b>{restoreEvidence.rebuildResult}</b>
					<span>Next price identical</span>
					<b>{restoreEvidence.comparison.identical ? "Yes" : "No"}</b>
				</div>
			</section>
			<section className="namespace-list" aria-labelledby="namespace-title">
				<h2 id="namespace-title">Mainnet namespace counts</h2>
				<p className="muted">
					The errata-b-* and vo-gate-* namespaces are early integration tests on
					this same account.
				</p>
				<div className="namespace-grid">
					{namespaces.map((namespace) => (
						<span key={namespace.name}>
							<code>{namespace.name}</code>
							<b>{namespace.memory_count}</b>
						</span>
					))}
				</div>
			</section>
			<section className="memory-samples" aria-labelledby="samples-title">
				<h2 id="samples-title">Replay evidence samples</h2>
				<p className="muted">
					These are representative replay observations and one final bucket
					summary from the committed replay evidence.
				</p>
				{replay.rows.slice(0, 3).map((row) => (
					<article
						className="memory sample-memory"
						id={
							replay.memory.blobIds[
								`observation|${row.index}|${row.marketId}` as keyof typeof replay.memory.blobIds
							]
						}
						key={row.marketId}
					>
						<div className="cardhead">
							<span>REPLAY OBSERVATION</span>
							<span className="pill">REPLAY</span>
						</div>
						<p>
							{row.venue} {categoryDisplay(row.category)} resolved{" "}
							{row.outcome === 1 ? "YES" : "NO"} at{" "}
							{percent(row.rawProbability)}.
						</p>
						<IdChip
							label="Blob"
							value={
								replay.memory.blobIds[
									`observation|${row.index}|${row.marketId}` as keyof typeof replay.memory.blobIds
								] ?? ""
							}
						/>
					</article>
				))}
				{(() => {
					const key =
						"summary|polymarket|us-current-affairs|7d|final" as keyof typeof replay.memory.blobIds;
					const blob = replay.memory.blobIds[key];
					return (
						<article className="memory sample-memory">
							<div className="cardhead">
								<span>BUCKET SUMMARY</span>
								<span className="pill">REPLAY</span>
							</div>
							<p>
								Polymarket · US current affairs · 7 days: final bucket summary
								from the v2 replay. Its predecessor link is not available in the
								committed summary evidence.
							</p>
							<IdChip label="Blob" value={blob} href={`/memory#${blob}`} />
						</article>
					);
				})()}
			</section>
			{liveCalls.map((call, index) => (
				<article className="memory" id={call.blobId} key={call.id}>
					<div className="cardhead">
						<span>LIVE CALL {String(index + 1).padStart(2, "0")}</span>
						<span className="pill">{call.provenance}</span>
					</div>
					<p>
						{call.question}. Raw venue price was{" "}
						{call.rawPrice == null
							? "unavailable"
							: `${(call.rawPrice * 100).toFixed(1)}%`}
						; corrected display is{" "}
						{call.correctedProbability == null
							? "unavailable"
							: `${(call.correctedProbability * 100).toFixed(1)}%`}
						.
					</p>
					<IdChip label="Blob" value={call.blobId} />
					<div className="metricrow">
						<span>namespace</span>
						<b>vo-live</b>
					</div>
				</article>
			))}
		</>
	);
}
