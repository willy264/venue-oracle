"use client";

import { useEffect, useState } from "react";
import type { LiveCall } from "../live-data";

export function WhyDrawer({ call }: { call: LiveCall }) {
	const [open, setOpen] = useState(false);
	useEffect(() => {
		if (!open) return;
		const close = (event: KeyboardEvent) =>
			event.key === "Escape" && setOpen(false);
		window.addEventListener("keydown", close);
		return () => window.removeEventListener("keydown", close);
	}, [open]);
	return (
		<>
			<button
				className="why-button"
				type="button"
				onClick={() => setOpen(true)}
			>
				Why this number?
			</button>
			{open && (
				<div
					className="drawer-backdrop"
					role="presentation"
					onClick={() => setOpen(false)}
				>
					<aside
						className="drawer"
						role="dialog"
						aria-modal="true"
						aria-labelledby={`why-${call.id}`}
						onClick={(event) => event.stopPropagation()}
					>
						<button
							className="drawer-close"
							type="button"
							onClick={() => setOpen(false)}
							aria-label="Close explanation"
						>
							×
						</button>
						<div className="eyebrow">CALIBRATION TRACE</div>
						<h2 id={`why-${call.id}`}>Why this number?</h2>
						<p className="muted">
							The v2 engine looked for a prior summary in the {call.venue} ×{" "}
							{call.category} × {call.timeBucket ?? "current"} bucket. No
							qualifying summary was available for this live sports record, so
							it abstained.
						</p>
						<div className="arithmetic">
							<code>
								{(call.rawPrice * 100).toFixed(1)}% + 0.00 × (bucket rate −
								bucket mean) = {(call.correctedProbability * 100).toFixed(1)}%
							</code>
						</div>
						<p className="muted">Cited memories</p>
						<div className="drawer-memory">
							No qualifying replay memory cited. The raw venue price is shown
							unchanged.
						</div>
					</aside>
				</div>
			)}
		</>
	);
}
