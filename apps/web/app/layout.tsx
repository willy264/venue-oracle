import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const fontImport = `https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600;700&display=swap`;

export const metadata: Metadata = {
	title: "Venue Oracle",
	description: "Venue calibration for prediction markets.",
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
				<div className="shell">
					<header className="topbar">
						<Link className="brand" href="/">
							<img src="/logo.svg" alt="" width="30" height="30" />
							VENUE <span>ORACLE</span>
						</Link>
						<nav>
							<Link href="/">Live board</Link>
							<Link href="/honesty">Venue honesty</Link>
							<Link href="/learning">Learning curve</Link>
							<Link href="/memory">Memory</Link>
							<Link href="/track-record">Track record</Link>
							<Link href="/about">Method</Link>
						</nav>
						<div className="status">
							<i /> WALRUS MEMORY ONLINE
						</div>
					</header>
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
