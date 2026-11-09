import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venue Oracle",
  description: "Venue calibration for prediction markets.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">VENUE <span>ORACLE</span></Link>
            <nav>
              <Link href="/">Live board</Link>
              <Link href="/learning">Learning curve</Link>
              <Link href="/memory">Memory</Link>
              <Link href="/track-record">Track record</Link>
              <Link href="/about">Method</Link>
            </nav>
            <div className="status"><i /> WALRUS MEMORY ONLINE</div>
          </header>
          <main>{children}</main>
          <footer><span>VENUE ORACLE / TOTAL RECALL</span><span>Replay data is historical. Live calls are not financial advice.</span></footer>
        </div>
      </body>
    </html>
  );
}
