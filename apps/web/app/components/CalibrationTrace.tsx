"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import replay from "../../../../results/latest-replay-v2.json";
import liveEvidence from "../../../../results/live-calls.json";
import firstSampleEvidence from "../../../../results/live-calls-first-sample.json";
import testnet from "../../../../results/testnet-verification.json";
import type { LiveCall } from "../live-data";
import { CalibrationDrawer } from "./CalibrationDrawer";
import { IdChip } from "./id-chip";
import { ProbabilityRail } from "./probability-rail";

const minimumN = 5;
const shrinkageK = 20;
const allEvidence = [...liveEvidence.calls, ...firstSampleEvidence.calls];
const allProof = [
	...testnet.verifications,
	...firstSampleEvidence.tatumTestnetVerification,
] as Array<{
	txDigest: string;
	checkpoint?: string;
	timestamp?: { seconds: string; nanos: number };
}>;

function titleCase(value: string) {
	return value
		.replaceAll("-", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function percent(value: number | null | undefined, digits = 1) {
	return value == null || !Number.isFinite(value)
		? "Not available"
		: `${(value * 100).toFixed(digits)}%`;
}
function dateText(value: string | undefined) {
	return value
		? `${new Date(value).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC`
		: "Not available";
}
function relative(value: string | undefined) {
	if (!value) return "Not available";
	const hours = Math.round(
		(new Date(value).getTime() - Date.now()) / 3_600_000,
	);
	return hours < 0
		? "closed"
		: `closes in ${Math.floor(hours / 24)}d ${hours % 24}h`;
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
function statsFor(call: LiveCall) {
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
	return { n: rows.length, mean, yesRate };
}
function summaryFor(call: LiveCall) {
	return replay.memory.blobIds[
		`summary|${call.venue}|${call.category}|${call.timeBucket}|final` as keyof typeof replay.memory.blobIds
	];
}

function Trace({ call }: { call: LiveCall }) {
	const evidence = allEvidence.find((item) => item.marketId === call.marketId);
	const stats = statsFor(call);
	const summary = summaryFor(call);
	const proof = allProof.find((item) => item.txDigest === call.txDigest);
	const weight = stats ? stats.n / (stats.n + shrinkageK) : 0;
	const corrected = call.correctedProbability;
	const correctedValue = corrected ?? 0;
	const changed =
		call.rawPrice != null &&
		corrected != null &&
		Math.abs(corrected - call.rawPrice) >= 0.01;
	const sourceRaw = evidence?.tatum?.rawPrice;
	return (
		<>
			<section className="trace-section">
				<h3>Verdict</h3>
				<div className="trace-numbers">
					<span>Raw {percent(call.rawPrice)}</span>
					<span aria-hidden="true">→</span>
					<strong className={changed ? "corrected" : ""}>
						Corrected {percent(corrected)}
					</strong>
				</div>
				<ProbabilityRail
					raw={call.rawPrice}
					corrected={changed ? corrected : call.rawPrice}
					label={call.question}
				/>
				<p id={`verdict-${call.id}`}>
					{call.rawPrice == null
						? "Price unavailable."
						: stats && stats.n < minimumN
							? `No calibration edge — this bucket has ${stats.n} past cases; the minimum is ${minimumN}.`
							: changed
								? `Looks ${correctedValue > call.rawPrice ? "underpriced" : "overpriced"} by ${(Math.abs(correctedValue - call.rawPrice) * 100).toFixed(1)} pts.`
								: "No calibration edge."}
				</p>
			</section>
			<section className="trace-section">
				<h3>Evidence bucket</h3>
				<dl className="trace-kv">
					<dt>Bucket</dt>
					<dd>{bucketLabel(call)}</dd>
					<dt>Past cases n</dt>
					<dd>{stats?.n ?? "Not available"}</dd>
					<dt>Resolved YES rate</dt>
					<dd>{stats ? percent(stats.yesRate) : "Not available"}</dd>
					<dt>Average price</dt>
					<dd>{stats ? percent(stats.mean) : "Not available"}</dd>
					<dt>Minimum n</dt>
					<dd>{minimumN}</dd>
					<dt>k</dt>
					<dd>{shrinkageK}</dd>
				</dl>
				{summary ? (
					<p>
						Bucket summary in Walrus Memory:{" "}
						<IdChip label="Blob" value={summary} href={`/memory#${summary}`} />
					</p>
				) : (
					<p className="muted">
						Bucket summary in Walrus Memory: Not available.
					</p>
				)}
			</section>
			<section className="trace-section">
				<h3>Calculation</h3>
				<div className="trace-formula">
					<code>
						w = n / (n + 20) = {stats?.n ?? 0} / ({stats?.n ?? 0} + 20) ={" "}
						{weight.toFixed(2)}
						<br />
						corrected = raw + w × (rate − avg)
						<br />= {percent(call.rawPrice)} + {weight.toFixed(2)} × (
						{stats ? percent(stats.yesRate) : "Not available"} −{" "}
						{stats ? percent(stats.mean) : "Not available"}) ={" "}
						{percent(corrected)}
					</code>
				</div>
				<p className="muted">
					{stats && stats.n < minimumN
						? `Abstained because n = ${stats.n} is below the minimum n = ${minimumN}; raw price is retained.`
						: "Correction uses the recorded bucket evidence."}
				</p>
			</section>
			<section className="trace-section">
				<h3>Live price from Tatum</h3>
				<p>
					<IdChip
						label="Endpoint"
						value={call.tatumPriceEndpoint}
						href={call.tatumPriceEndpoint}
					/>
				</p>
				<p className="muted">
					Snapshot: {dateText(call.snapshotAt)} · {relative(call.snapshotAt)}
				</p>
				<p>
					Raw price:{" "}
					{call.rawPrice == null && sourceRaw === 0
						? "Price unavailable — Tatum returned 0"
						: percent(call.rawPrice)}
				</p>
			</section>
			<section className="trace-section">
				<h3>Proof</h3>
				<p>
					Live memory blob:{" "}
					<IdChip
						label="Blob"
						value={call.blobId}
						href={`/memory#${call.blobId}`}
					/>
				</p>
				<p>
					Sui commit:{" "}
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
					Package:{" "}
					<IdChip
						label="Package"
						value={call.packageId}
						href={`https://suiexplorer.testnet.sui.io/object/${call.packageId}`}
					/>
				</p>
				<p className="verified">Verified through Tatum Sui gRPC ✓</p>
				<p className="muted">
					Checkpoint {proof?.checkpoint ?? "Not available"} ·{" "}
					{proof?.timestamp
						? dateText(
								new Date(Number(proof.timestamp.seconds) * 1000).toISOString(),
							)
						: "Not available"}
				</p>
				<p>
					Call hash: <IdChip label="Hash" value={evidence?.digest ?? ""} />
				</p>
			</section>
			<section className="trace-section">
				<h3>Outcome</h3>
				<p>Pending — closes {dateText(evidence?.closeTime)}.</p>
			</section>
			<p className="trace-footer-note">
				Not financial advice. Replay memories are historical data written during
				the hackathon.
			</p>
		</>
	);
}

export function CalibrationTrace({
	calls,
	compactTriggers = false,
	showTriggers = true,
}: {
	calls: LiveCall[];
	compactTriggers?: boolean;
	showTriggers?: boolean;
}) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const opener = useRef<HTMLButtonElement | null>(null);
	const index = calls.findIndex((call) => call.id === selectedId);
	const selected = index >= 0 ? calls[index] : null;
	const ordered = useMemo(() => calls, [calls]);
	const updateUrl = (id: string | null, replace = false) => {
		const url = new URL(window.location.href);
		if (id) url.searchParams.set("why", id);
		else url.searchParams.delete("why");
		window.history[replace ? "replaceState" : "pushState"]({}, "", url);
	};
	const open = (id: string, button?: HTMLButtonElement | null) => {
		opener.current =
			button ??
			document.querySelector<HTMLButtonElement>(`[data-why-trigger="${id}"]`);
		setSelectedId(id);
		updateUrl(id);
	};
	const close = () => {
		const previous = opener.current;
		setSelectedId(null);
		updateUrl(null, true);
		window.setTimeout(() => previous?.focus(), 0);
	};
	// biome-ignore lint/correctness/useExhaustiveDependencies: URL and custom-event listeners follow the current call set
	useEffect(() => {
		const query = new URLSearchParams(window.location.search).get("why");
		if (query && calls.some((call) => call.id === query)) setSelectedId(query);
		const onPop = () =>
			setSelectedId(new URLSearchParams(window.location.search).get("why"));
		const onOpen = (event: Event) => {
			const id = (event as CustomEvent<string>).detail;
			if (calls.some((call) => call.id === id)) open(id);
		};
		window.addEventListener("popstate", onPop);
		window.addEventListener("venue-oracle:open-drawer", onOpen);
		return () => {
			window.removeEventListener("popstate", onPop);
			window.removeEventListener("venue-oracle:open-drawer", onOpen);
		};
	}, [calls]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyboard navigation follows the selected call
	useEffect(() => {
		if (!selected) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "ArrowLeft" && index > 0) {
				event.preventDefault();
				open(ordered[index - 1].id);
			}
			if (event.key === "ArrowRight" && index < ordered.length - 1) {
				event.preventDefault();
				open(ordered[index + 1].id);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [selected, index, ordered]);
	const header = selected ? (
		<>
			<div className="eyebrow">CALIBRATION TRACE · {selected.id}</div>
			<div className="trace-header-row">
				<h2 id={`trace-title-${selected.id}`} data-drawer-heading tabIndex={-1}>
					{selected.question || "Not available"}
				</h2>
				<button
					className="trace-close"
					type="button"
					onClick={close}
					aria-label="Close drawer"
				>
					×
				</button>
			</div>
			<p className="trace-meta">
				{bucketLabel(selected)} ·{" "}
				<span className="pill">
					{selected.firstSample ? "FIRST SAMPLE" : "LIVE"}
				</span>
			</p>
			<p className="muted">
				{dateText(
					allEvidence.find((item) => item.marketId === selected.marketId)
						?.closeTime,
				)}{" "}
				·{" "}
				{relative(
					allEvidence.find((item) => item.marketId === selected.marketId)
						?.closeTime,
				)}
			</p>
		</>
	) : null;
	const footer = selected ? (
		<>
			<button
				type="button"
				className="drawer-footer-button"
				onClick={() => index > 0 && open(ordered[index - 1].id)}
			>
				← Previous call
			</button>
			<button
				type="button"
				className="drawer-footer-button"
				onClick={() =>
					index < ordered.length - 1 && open(ordered[index + 1].id)
				}
			>
				Next call →
			</button>
			<button
				type="button"
				className="drawer-footer-button"
				onClick={() =>
					navigator.clipboard.writeText(
						`${window.location.origin}${window.location.pathname}?why=${selected.id}`,
					)
				}
			>
				Copy link
			</button>
		</>
	) : null;
	return (
		<>
			{showTriggers && (
				<div
					className={
						compactTriggers ? "inspection-links" : "calibration-triggers"
					}
				>
					{calls.map((call) => (
						<button
							key={call.id}
							data-why-trigger={call.id}
							className={compactTriggers ? "inspect-call" : "why-button"}
							type="button"
							onClick={(event) => open(call.id, event.currentTarget)}
						>
							{compactTriggers ? `Inspect ${call.id}` : "Why this number?"}
						</button>
					))}
				</div>
			)}
			<CalibrationDrawer
				open={Boolean(selected)}
				titleId={selected ? `trace-title-${selected.id}` : "trace-title"}
				describedBy={selected ? `verdict-${selected.id}` : undefined}
				onClose={close}
				header={header}
				body={selected ? <Trace call={selected} /> : null}
				footer={footer}
			/>
		</>
	);
}
