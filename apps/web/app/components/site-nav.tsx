"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
	["/", "Live board"],
	["/honesty", "Venue honesty"],
	["/learning", "Learning curve"],
	["/memory", "Memory"],
	["/track-record", "Track record"],
	["/about", "Method"],
] as const;

export function SiteNav() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	return (
		<>
			<button
				className="menu-button"
				type="button"
				aria-expanded={open}
				aria-controls="site-navigation"
				onClick={() => setOpen((value) => !value)}
			>
				<span aria-hidden="true">{open ? "Close" : "Menu"}</span>
			</button>
			<nav
				id="site-navigation"
				className={`site-nav${open ? " is-open" : ""}`}
				aria-label="Primary navigation"
			>
				{links.map(([href, label]) => {
					const active =
						pathname === href || (href !== "/" && pathname.startsWith(href));
					return (
						<Link
							key={href}
							href={href}
							aria-current={active ? "page" : undefined}
							onClick={() => setOpen(false)}
						>
							{label}
						</Link>
					);
				})}
			</nav>
		</>
	);
}
