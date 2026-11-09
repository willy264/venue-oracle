import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (m && !process.env[m[1]])
		process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}
const key = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
const headers = { "x-api-key": key };
let calls = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function get(path) {
	await sleep(calls++ ? 400 : 0);
	const r = await fetch(`https://api.tatum.io/v4/data/prediction${path}`, {
		headers,
	});
	if (!r.ok) throw new Error(`${r.status} ${path}`);
	return r.json();
}
async function list(platform, filters, pages = 10) {
	const rows = [];
	let cursor;
	for (let i = 0; i < pages; i++) {
		const q = new URLSearchParams({ platform, limit: "100", ...filters });
		if (cursor) q.set("cursor", cursor);
		const j = await get(`/markets?${q}`);
		rows.push(...(j.data ?? []));
		cursor = j.pagination?.cursor;
		if (!cursor) break;
	}
	return rows;
}
const teams = new Set(
	`atlanta hawks boston celtics brooklyn nets charlotte hornets chicago bulls cleveland cavaliers dallas mavericks denver nuggets detroit pistons golden state warriors houston rockets indiana pacers la clippers los angeles lakers memphis grizzlies miami heat milwaukee bucks minnesota timberwolves new orleans pelicans new york knicks oklahoma city thunder orlando magic philadelphia 76ers phoenix suns portland trail blazers sacramento kings san antonio spurs toronto raptors utah jazz washington wizards arizona cardinals atlanta falcons baltimore ravens buffalo bills carolina panthers chicago bears cincinnati bengals cleveland browns dallas cowboys denver broncos detroit lions green bay packers houston texans indianapolis colts jacksonville jaguars kansas city chiefs las vegas raiders los angeles chargers los angeles rams miami dolphins minnesota vikings new england patriots new orleans saints new york giants new york jets philadelphia eagles pittsburgh steelers san francisco 49ers seattle seahawks tampa bay buccaneers tennessee titans washington commanders`.split(
		" ",
	),
);
const text = (row) => `${row.question ?? ""} ${row.title ?? ""}`.toLowerCase();
const date = (row) => row.closeTime ?? row.settleTime ?? "";
const nums = (s) =>
	[...s.matchAll(/\$?\d+(?:,\d{3})*(?:\.\d+)?/g)].map((m) =>
		Number(m[0].replaceAll(",", "").replace("$", "")),
	);
const teamsIn = (s) => [...teams].filter((t) => s.includes(t));
function family(a, b) {
	const ta = text(a),
		tb = text(b);
	if (
		!date(a) ||
		!date(b) ||
		Math.abs(new Date(date(a)) - new Date(date(b))) > 86400000
	)
		return null;
	const shared = teamsIn(ta).filter((t) => teamsIn(tb).includes(t));
	if (shared.length >= 2)
		return {
			family: "sports-game-winner",
			reason: `shared teams ${shared.join(", ")}`,
		};
	const asset = ["bitcoin", "btc", "ethereum", "eth"].find(
		(x) => ta.includes(x) && tb.includes(x),
	);
	const an = nums(ta),
		bn = nums(tb);
	if (asset && an.some((n) => bn.includes(n)))
		return {
			family: "crypto-threshold",
			reason: `shared ${asset} and threshold`,
		};
	return null;
}
const [poly, kalshi] = await Promise.all([
	list("polymarket", { status: "active" }),
	list("kalshi", {}),
]);
const rows = [];
for (const a of poly)
	for (const b of kalshi) {
		const f = family(a, b);
		if (f)
			rows.push({
				ownerDecision: "",
				family: f.family,
				polymarketId: a.id,
				polymarketQuestion: a.question,
				polymarketCloseTime: date(a),
				kalshiId: b.id,
				kalshiQuestion: b.question,
				kalshiCloseTime: date(b),
				reason: f.reason,
			});
	}
const unique = [
	...new Map(
		rows.map((r) => [`${r.family}|${r.polymarketId}|${r.kalshiId}`, r]),
	).values(),
];
const columns = [
	"ownerDecision",
	"family",
	"polymarketId",
	"polymarketQuestion",
	"polymarketCloseTime",
	"kalshiId",
	"kalshiQuestion",
	"kalshiCloseTime",
	"reason",
];
const cell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
await mkdir(new URL("data/", root), { recursive: true });
await writeFile(
	new URL("data/live-candidates.csv", root),
	`${[columns.join(","), ...unique.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\n")}\n`,
);
await writeFile(
	new URL("research/live-listing.json", root),
	`${JSON.stringify({ observedAt: new Date().toISOString(), calls, polymarketRows: poly.length, kalshiRows: kalshi.length, candidates: unique.length, reviewStatus: "ownerDecision blank; no live snapshot written" }, null, 2)}\n`,
);
console.log(
	JSON.stringify(
		{
			calls,
			polymarketRows: poly.length,
			kalshiRows: kalshi.length,
			candidates: unique.length,
		},
		null,
		2,
	),
);
