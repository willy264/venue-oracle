import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SiteNav } from "./components/site-nav";

const memoryEvidence = JSON.parse(
	readFileSync(
		join(process.cwd(), "../../results/mainnet-memory-verification.json"),
		"utf8",
	),
) as { status: string; observedAt: string };

const fontImport = `https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600;700&display=swap`;

export const metadata: Metadata = {
	title: "Venue Oracle",
	description: "Venue calibration for prediction markets.",
	icons: { icon: "/logo.svg", apple: "/logo.svg" },
};

export default function Layout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link rel="stylesheet" href={fontImport} />
			</head>
			<body>
				<header className="topbar">
					<div className="topbar-inner">
						<Link className="brand" href="/">
							<img src="/logo.svg" alt="" width="30" height="30" />
							VENUE <span>ORACLE</span>
						</Link>
						<SiteNav />
						<div
							className={`status${memoryEvidence.status === "verified" ? "" : " degraded"}`}
							role="status"
							title={`Last successful MemWal read: ${memoryEvidence.observedAt}`}
							aria-label={`Walrus Memory ${memoryEvidence.status === "verified" ? "online" : "degraded"}; last successful read ${memoryEvidence.observedAt}`}
						>
							<i />{" "}
							{memoryEvidence.status === "verified"
								? "WALRUS MEMORY ONLINE"
								: "WALRUS MEMORY DEGRADED"}
						</div>
					</div>
				</header>
				<div className="shell">
					<main>{children}</main>
					<footer>
						<span>VENUE ORACLE / TOTAL RECALL</span>
						<span>
							Replay data is historical. Live calls are not financial advice.
						</span>
					</footer>
				</div>
			</body>
		</html>
	);
}
