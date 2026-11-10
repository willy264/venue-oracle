"use client";

import { useState } from "react";

function shorten(value: string) {
	return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

export function IdChip({
	value,
	label,
	href,
}: {
	value: string;
	label?: string;
	href?: string;
}) {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		await navigator.clipboard.writeText(value);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	};
	const content = (
		<span className="id-value">{value ? shorten(value) : "Not available"}</span>
	);
	return (
		<span className="id-chip" title={value}>
			{label && <span className="id-label">{label}</span>}
			{href ? (
				<a href={href} target="_blank" rel="noreferrer">
					{content}
				</a>
			) : (
				content
			)}
			{value && (
				<button
					type="button"
					onClick={copy}
					aria-label={`Copy ${label ?? "ID"}`}
					title={`Copy ${value}`}
				>
					{copied ? "Copied" : "Copy"}
				</button>
			)}
		</span>
	);
}
