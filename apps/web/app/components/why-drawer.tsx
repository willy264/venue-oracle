"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveCall } from "../live-data";

const minimumSample = 5;
const shrinkageK = 20;

function titleCase(value: string) {
	return value
		.replaceAll("-", " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bucketLabel(call: LiveCall) {
	const category = titleCase(call.category ?? "unknown");
	const bucket =
		call.timeBucket === "7d"
			? "7 days"
			: call.timeBucket === "3d"
				? "3 days"
				: call.timeBucket === "1d"
					? "1 day"
					: "current";
	return `${titleCase(call.venue)} · ${category} · ${bucket}`;
}

export function WhyDrawer({ call }: { call: LiveCall }) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const sampleN = call.replaySampleN ?? 0;
	const weight = sampleN / (sampleN + shrinkageK);

	useEffect(() => {
		if (!open) {
			document.body.style.overflow = "";
			return;
		}
		document.body.style.overflow = "hidden";
		closeRef.current?.focus();
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				setOpen(false);
				return;
			}
			if (event.key !== "Tab" || !dialogRef.current) return;
			const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
				"button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])",
			);
			if (!focusable.length) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open]);

	const close = () => {
		setOpen(false);
		window.setTimeout(() => triggerRef.current?.focus(), 0);
	};

	return (
		<>
			<button
				ref={triggerRef}
				className="why-button"
				type="button"
				onClick={() => setOpen(true)}
			>
				Why this number?
			</button>
			{open && (
				<dialog
					ref={dialogRef}
					open
					className="drawer-backdrop"
					aria-modal="true"
					aria-labelledby={`why-${call.id}`}
					onClick={(event) => event.target === event.currentTarget && close()}
					onKeyDown={(event) => event.key === "Escape" && close()}
				>
					<aside className="drawer">
						<div className="drawer-handle" aria-hidden="true" />
						<button
							ref={closeRef}
							className="drawer-close"
							type="button"
							onClick={close}
							aria-label="Close explanation"
						>
							X
						</button>
						<div className="eyebrow">CALIBRATION TRACE</div>
						<h2 id={`why-${call.id}`}>Why this number?</h2>
						<p className="drawer-copy">
							The v2 engine checked the {bucketLabel(call)} bucket before
							deciding whether there was enough evidence to correct this venue
							price.
						</p>
						<div className="arithmetic">
							<code>
								{call.rawPrice == null
									? "Price unavailable"
									: `${(call.rawPrice * 100).toFixed(1)}% + ${weight.toFixed(3)} x (bucket rate - bucket mean) = ${((call.correctedProbability ?? call.rawPrice) * 100).toFixed(1)}%`}
							</code>
						</div>
						{call.rawPrice != null && sampleN === 0 && (
							<p className="drawer-copy">
								w = n/(n+k) = 0/(0+k) = 0 &mdash; no resolved cases in{" "}
								{bucketLabel(call)} (minimum n = {minimumSample}).
							</p>
						)}
						{call.rawPrice != null &&
							sampleN > 0 &&
							sampleN < minimumSample && (
								<p className="drawer-copy">
									w = n/(n+k) = {sampleN}/({sampleN}+{shrinkageK}) ={" "}
									{weight.toFixed(3)} - below the minimum n = {minimumSample},
									so the raw price is retained.
								</p>
							)}
						<h3>Cited memories</h3>
						<div className="drawer-memory">
							No qualifying replay memory cited. The raw venue price is shown
							unchanged.
						</div>
					</aside>
				</dialog>
			)}
		</>
	);
}
