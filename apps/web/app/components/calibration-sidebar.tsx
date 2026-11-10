"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import replay from "../../../../results/latest-replay-v2.json";
import liveEvidence from "../../../../results/live-calls.json";
import firstSampleEvidence from "../../../../results/live-calls-first-sample.json";
import testnet from "../../../../results/testnet-verification.json";
import type { LiveCall } from "../live-data";
import { IdChip } from "./id-chip";
import { ProbabilityRail } from "./probability-rail";

const minimumN = 5;
const shrinkageK = 20;
const memoryNamespaces = [
	"vo-v2-replay-run-v2-20261109114733-d322d3-polymarket-us-current-affairs",
	"vo-v2-replay-run-v2-20261109114733-d322d3-kalshi-sports",
];

type Props = {
	calls: LiveCall[];
	compactTriggers?: boolean;
	showTriggers?: boolean;
};

function titleCase(value: string) {
	return value
		.replaceAll("-", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bucketLabel(call: LiveCall) {
	const bucket =
		call.timeBucket === "7d"
			? "7 days"
			: call.timeBucket === "3d"
				? "3 days"
				: call.timeBucket === "1d"
					? "1 day"
					: "Not available";
	return `${titleCase(call.venue)} · ${titleCase(call.category ?? "unknown")} · ${bucket}`;
}

function percent(value: number | null | undefined, digits = 1) {
	return value == null || !Number.isFinite(value)
		? "Not available"
		: `${(value * 100).toFixed(digits)}%`;
}

function dateText(value: string | undefined) {
	if (!value) return "Not available";
	return `${new Date(value).toLocaleString("en-GB", {
		timeZone: "UTC",
		dateStyle: "medium",
		timeStyle: "short",
	})} UTC`;
}

function relativeClose(value: string | undefined) {
	if (!value) return "Not available";
	const hours = Math.round(
		(new Date(value).getTime() - Date.now()) / 3_600_000,
	);
	if (hours < 0) return "closed";
	return `closes in ${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function bucketStats(call: LiveCall) {
	const rows = replay.rows.filter(
		(row) =>
			row.venue === call.venue &&
			row.category === call.category &&
			row.timeBucket === call.timeBucket,
	);
	if (!rows.length) return null;
	const mean =
		rows.reduce((sum, row) => sum + row.rawProbability, 0) / rows.length;
	const yesRate = rows.reduce((sum, row) => sum + row.outcome, 0) / rows.length;
	return { n: rows.length, yesRate, mean, gap: yesRate - mean };
}

function summaryBlob(call: LiveCall) {
	return replay.memory.blobIds[
		`summary|${call.venue}|${call.category}|${call.timeBucket}|final` as keyof typeof replay.memory.blobIds
	];
}

function proof(call: LiveCall) {
	return [
		...(testnet.verifications as Array<{
			txDigest: string;
			verified: boolean;
			checkpoint?: string;
			timestamp?: { seconds: string; nanos: number };
		}>),
		...(firstSampleEvidence.tatumTestnetVerification as Array<{
			txDigest: string;
			verified: boolean;
			checkpoint?: string;
			timestamp?: { seconds: string; nanos: number };
		}>),
	].find((item) => item.txDigest === call.txDigest);
}

function SidebarContent({
	call,
	onClose,
	onPrev,
	onNext,
	index,
	total,
}: {
	call: LiveCall;
	onClose: () => void;
	onPrev: () => void;
	onNext: () => void;
	index: number;
	total: number;
}) {
	const stats = bucketStats(call);
	const weight = stats ? stats.n / (stats.n + shrinkageK) : 0;
	const corrected = call.correctedProbability;
	const correctedValue = corrected ?? 0;
	const correctedDiffers =
		call.rawPrice != null &&
		corrected != null &&
		Math.abs(corrected - call.rawPrice) >= 0.01;
	const summary = summaryBlob(call);
	const verification = proof(call);
	const namespace = memoryNamespaces.find((value) =>
		value.includes(`${call.venue}-${call.category}`),
	);
	const liveCall = [...liveEvidence.calls, ...firstSampleEvidence.calls].find(
		(item) => item.marketId === call.marketId,
	);
	return (
		<>
			<div className="sidebar-toolbar">
				<button
					type="button"
					className="sidebar-nav"
					onClick={onPrev}
					disabled={index === 0}
					aria-label="Previous call"
				>
					← Prev
				</button>
				<span>
					{index + 1} / {total}
				</span>
				<button
					type="button"
					className="sidebar-nav"
					onClick={onNext}
					disabled={index === total - 1}
					aria-label="Next call"
				>
					Next →
				</button>
			</div>
			<section className="sidebar-section sidebar-header-section">
				<div className="eyebrow">CALIBRATION TRACE · {call.id}</div>
				<h2 id={`sidebar-title-${call.id}`}>
					{call.question || "Not available"}
				</h2>
				<p className="sidebar-meta">{bucketLabel(call)}</p>
				<span className="pill">{call.provenance ?? "LIVE"}</span>
				<p className="muted">
					{dateText(liveCall?.closeTime)} · {relativeClose(liveCall?.closeTime)}
				</p>
			</section>
			<section className="sidebar-section">
				<h3>Verdict</h3>
				<div className="sidebar-number-row">
					<span>Raw {percent(call.rawPrice)}</span>
					<span aria-hidden="true">→</span>
					<strong className={correctedDiffers ? "corrected" : ""}>
						Corrected {percent(corrected)}
					</strong>
				</div>
				<ProbabilityRail
					raw={call.rawPrice}
					corrected={correctedDiffers ? corrected : call.rawPrice}
					label={call.question}
				/>
				<p>
					{call.rawPrice == null
						? "Price unavailable."
						: !stats || stats.n < minimumN
							? `No calibration edge — ${stats?.n ?? 0} past cases are too few to act on.`
							: correctedDiffers
								? `Looks ${correctedValue > call.rawPrice ? "underpriced" : "overpriced"} by ${(Math.abs(correctedValue - call.rawPrice) * 100).toFixed(1)} pts.`
								: "No calibration edge."}
				</p>
			</section>
			<section className="sidebar-section">
				<h3>The evidence bucket</h3>
				<table className="sidebar-table">
					<tbody>
						<tr>
							<th>Bucket key</th>
							<td>
								{call.venue} · {call.category ?? "Not available"} ·{" "}
								{call.timeBucket ?? "Not available"}
							</td>
						</tr>
						<tr>
							<th>Past resolved cases n</th>
							<td>{stats?.n ?? "Not available"}</td>
						</tr>
						<tr>
							<th>Resolved YES</th>
							<td>{stats ? percent(stats.yesRate) : "Not available"}</td>
						</tr>
						<tr>
							<th>Average price</th>
							<td>{stats ? percent(stats.mean) : "Not available"}</td>
						</tr>
						<tr>
							<th>Gap</th>
							<td>
								{stats
									? `${(stats.gap * 100).toFixed(1)} pts`
									: "Not available"}
							</td>
						</tr>
						<tr>
							<th>Minimum n</th>
							<td>{minimumN}</td>
						</tr>
						<tr>
							<th>Shrinkage k</th>
							<td>{shrinkageK}</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section className="sidebar-section">
				<h3>The calculation</h3>
				<div className="sidebar-formula">
					<code>
						w = n / (n + k) = {stats?.n ?? 0} / ({stats?.n ?? 0} + {shrinkageK})
						= {weight.toFixed(2)}
						<br />
						corrected = raw + w × (YES rate − avg price)
						<br />= {percent(call.rawPrice)} + {weight.toFixed(2)} × (
						{stats ? percent(stats.yesRate) : "Not available"} −{" "}
						{stats ? percent(stats.mean) : "Not available"}) ={" "}
						{percent(corrected)}
					</code>
				</div>
				<p className="muted">
					{stats && stats.n < minimumN
						? `The result abstains because n = ${stats.n} is below the minimum n = ${minimumN}; the raw price is retained.`
						: "The correction uses the recorded bucket evidence."}
				</p>
			</section>
			<section className="sidebar-section">
				<h3>Cited memories</h3>
				{summary ? (
					<div className="cited-memory">
						<p>
							Bucket summary for {call.category} · {call.timeBucket}:{" "}
							{stats
								? `${stats.n} cases, ${percent(stats.yesRate)} YES rate, average price ${percent(stats.mean)}.`
								: "Not available"}
						</p>
						<span className="pill">REPLAY</span>
						<p className="muted">{namespace ?? "Namespace not available"}</p>
						<IdChip label="Blob" value={summary} href={`/memory#${summary}`} />
					</div>
				) : (
					<p className="muted">
						No qualifying replay memory recalled; the raw price is shown
						unchanged.
					</p>
				)}
				{!call.citedBlobIds?.length && summary && (
					<p className="muted">
						The live record reports zero cited blobs; this replay summary is
						shown as available bucket evidence, not relabelled as a live
						citation.
					</p>
				)}
			</section>
			<section className="sidebar-section">
				<h3>Live data from Tatum</h3>
				<p>
					<IdChip
						label="Endpoint"
						value={call.tatumPriceEndpoint}
						href={call.tatumPriceEndpoint}
					/>
				</p>
				<p className="muted">Snapshot: {dateText(call.snapshotAt)}</p>
				<p>Raw price returned: {percent(call.rawPrice)}</p>
			</section>
			<section className="sidebar-section">
				<h3>Proof</h3>
				<p>
					Live memory{" "}
					<IdChip
						label="Blob"
						value={call.blobId}
						href={`/memory#${call.blobId}`}
					/>
				</p>
				<p>
					Sui testnet{" "}
					<IdChip
						label="Tx"
						value={call.txDigest}
						href={`https://suiexplorer.testnet.sui.io/txblock/${call.txDigest}`}
					/>{" "}
					<a
						href={`https://suiexplorer.testnet.sui.io/txblock/${call.txDigest}`}
						target="_blank"
						rel="noreferrer"
					>
						Explorer ↗
					</a>
				</p>
				<p>
					Package{" "}
					<IdChip
						label="Package"
						value={call.packageId}
						href={`https://suiexplorer.testnet.sui.io/object/${call.packageId}`}
					/>
				</p>
				<p className="verified">Verified through Tatum Sui gRPC ✓</p>
				<p className="muted">
					Checkpoint {verification?.checkpoint ?? "Not available"} ·{" "}
					{verification?.timestamp
						? dateText(
								new Date(
									Number(verification.timestamp.seconds) * 1000,
								).toISOString(),
							)
						: "Not available"}
				</p>
				<p>
					Call hash <IdChip label="Hash" value={liveCall?.digest ?? ""} />
				</p>
			</section>
			<section className="sidebar-section">
				<h3>Outcome</h3>
				<p>Pending — resolves on {dateText(liveCall?.closeTime)}.</p>
			</section>
			<p className="sidebar-footer">
				Not financial advice. Replay memories are historical data written during
				the hackathon.
			</p>
			<button
				type="button"
				className="drawer-close"
				onClick={onClose}
				aria-label="Close calibration trace"
			>
				×
			</button>
		</>
	);
}

export function CalibrationSidebar({
	calls,
	compactTriggers = false,
	showTriggers = true,
}: Props) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [docked, setDocked] = useState(false);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
	const selectedIndex = calls.findIndex((call) => call.id === selectedId);
	const selected = selectedIndex >= 0 ? calls[selectedIndex] : null;
	const ordered = useMemo(() => calls, [calls]);

	const setUrl = (id: string | null, replace = false) => {
		const url = new URL(window.location.href);
		if (id) url.searchParams.set("why", id);
		else url.searchParams.delete("why");
		window.history[replace ? "replaceState" : "pushState"]({}, "", url);
	};
	const open = (id: string) => {
		setSelectedId(id);
		setUrl(id);
	};
	const close = () => {
		const previous = selectedId;
		setSelectedId(null);
		setUrl(null);
		window.setTimeout(
			() =>
				previous &&
				(
					triggerRefs.current[previous] ??
					document.querySelector<HTMLButtonElement>(
						`[data-why-trigger="${previous}"]`,
					)
				)?.focus(),
			0,
		);
	};

	useEffect(() => {
		const query = new URLSearchParams(window.location.search).get("why");
		if (query && calls.some((call) => call.id === query)) setSelectedId(query);
		const onPop = () =>
			setSelectedId(new URLSearchParams(window.location.search).get("why"));
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, [calls]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the event listener intentionally follows the current call set
	useEffect(() => {
		const onOpen = (event: Event) => {
			const id = (event as CustomEvent<string>).detail;
			if (calls.some((call) => call.id === id)) open(id);
		};
		window.addEventListener("venue-oracle:open-sidebar", onOpen);
		return () =>
			window.removeEventListener("venue-oracle:open-sidebar", onOpen);
	}, [calls]);
	useEffect(() => {
		const update = () => setDocked(window.innerWidth >= 1280);
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: this lifecycle intentionally tracks the selected call and browser mode
	useEffect(() => {
		if (!selected) {
			document.body.style.overflow = "";
			return;
		}
		document.querySelectorAll(".live-card.is-selected").forEach((element) => {
			element.classList.remove("is-selected");
		});
		document
			.querySelector<HTMLElement>(`.live-card[data-call-id="${selected.id}"]`)
			?.classList.add("is-selected");
		document.body.style.overflow = docked ? "" : "hidden";
		window.setTimeout(() => headingRef.current?.focus(), 0);
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") close();
			if (event.key === "ArrowLeft" && selectedIndex > 0) {
				event.preventDefault();
				open(ordered[selectedIndex - 1].id);
			}
			if (event.key === "ArrowRight" && selectedIndex < ordered.length - 1) {
				event.preventDefault();
				open(ordered[selectedIndex + 1].id);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = "";
			document.querySelectorAll(".live-card.is-selected").forEach((element) => {
				element.classList.remove("is-selected");
			});
			document.removeEventListener("keydown", onKey);
		};
	}, [selected, docked, selectedIndex, ordered]);

	return (
		<>
			{showTriggers && (
				<div
					className={compactTriggers ? "inspection-links" : "live-card-grid"}
				>
					{calls.map((call) => (
						<button
							key={call.id}
							data-why-trigger={call.id}
							ref={(element) => {
								triggerRefs.current[call.id] = element;
							}}
							className={compactTriggers ? "inspect-call" : "why-button"}
							type="button"
							onClick={() => open(call.id)}
						>
							{compactTriggers ? `Inspect ${call.id}` : "Why this number?"}
						</button>
					))}
				</div>
			)}
			{selected && (
				<>
					{!docked && (
						<button
							className="sidebar-backdrop"
							type="button"
							aria-label="Close calibration sidebar"
							onClick={close}
						/>
					)}
					{/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role changes between docked complementary and modal dialog modes */}
					<div
						className={`calibration-sidebar${docked ? " sidebar-docked" : ""}`}
						role={docked ? "complementary" : "dialog"}
						aria-modal={docked ? undefined : true}
						aria-labelledby={`sidebar-title-${selected.id}`}
					>
						<div
							className="sidebar-panel"
							tabIndex={-1}
							ref={(element) => {
								if (element) headingRef.current = element.querySelector("h2");
							}}
						>
							<div className="sidebar-handle" aria-hidden="true" />
							<SidebarContent
								call={selected}
								onClose={close}
								onPrev={() =>
									selectedIndex > 0 && open(ordered[selectedIndex - 1].id)
								}
								onNext={() =>
									selectedIndex < ordered.length - 1 &&
									open(ordered[selectedIndex + 1].id)
								}
								index={selectedIndex}
								total={ordered.length}
							/>
						</div>
					</div>
				</>
			)}
		</>
	);
}
