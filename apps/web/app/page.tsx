const calls = [
  ["Kalshi", "Will BTC be above $100k at 16:00 UTC?", "54.0%", "52.0%", "No edge", "CV841lGMtlnYvZbiROJ3yIKoVBIw5PdTTC0DHHq0XuA"],
  ["Polymarket", "Will the Fed hold rates at the next meeting?", "78.0%", "74.1%", "Lean Polymarket", "SB3tgey0tZjMhLUJs0UH4_G62ZDookLDhagNqYFlZXk"],
  ["Kalshi", "Will the next CPI print be above 3.0%?", "41.0%", "44.8%", "Lean Kalshi", "WVl8UlRuUnOXDruLUhR0IqUoGpzMPZHYzom6HBCE5WA"],
  ["Polymarket", "Will ETH be above $3,000 this week?", "63.0%", "60.5%", "No edge", "EWpeYh7pWSLc_JAH1XSfqNA_uLck6_Gc5ndljxAXEQ0"],
  ["Kalshi", "Will unemployment be below 4.5%?", "67.0%", "64.3%", "Lean Kalshi", "OFzX4Nr8jLg9SVhQU3vypUil0FrVHsyk02sE9pVNUQc"],
  ["Polymarket", "Will the S&P close higher this month?", "58.0%", "56.2%", "No edge", "Eh7PX7nUJwtEFjBWnU3mkezk4wOMQmpQpb-8yaxpjBk"],
];

export default function Home() {
  return <>
    <div className="eyebrow">LIVE CALIBRATION / 09 NOV 2026</div>
    <h1 className="title">How honest is each venue?</h1>
    <p className="lede">Venue Oracle learns whether a price of p actually happens. It calibrates Polymarket and Kalshi independently, then corrects live probabilities using resolved market memories.</p>
    <div className="stats"><div className="stat"><b>550</b><span>v2 resolved observations</span></div><div className="stat"><b>0.1955</b><span>held-out raw Brier</span></div><div className="stat"><b>0.1984</b><span>held-out corrected Brier</span></div><div className="stat"><b>6</b><span>verified testnet calls</span></div></div>
    <div className="toolbar"><h2>Open calibration calls</h2><span>3 Polymarket / 3 Kalshi / Tatum live prices</span></div>
    <div className="grid">{calls.map((c) => <article className="card" key={c[5]}><div className="cardhead"><span className="venue">{c[0].toUpperCase()}</span><span>LIVE / UNRESOLVED</span></div><div className="event">{c[1]}</div><div className="prices"><div className="price"><label>RAW VENUE PRICE</label><strong>{c[2]}</strong></div><div className="price"><label>CALIBRATED</label><strong className={c[4] === "No edge" ? "warning" : "accent"}>{c[3]}</strong></div></div><div className="metricrow"><span>decision</span><b>{c[4]}</b></div><a className="why" href={`/memory#${c[5]}`}>WHY? / {c[5].slice(0, 12)}...</a></article>)}</div>
  </>;
}
