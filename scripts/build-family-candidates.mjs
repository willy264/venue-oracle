import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
let calls = 0;
async function fetchJson(url) {
	await sleep(calls++ ? 250 : 0);
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	return response.json();
}
async function polymarketMarkets() {
	const rows = [];
	for (let offset = 0; offset < 3000; offset += 100) {
		let page;
		try {
			page = await fetchJson(
				`https://gamma-api.polymarket.com/markets?closed=true&limit=100&offset=${offset}`,
			);
		} catch (error) {
			if (String(error.message ?? error).startsWith("422")) break;
			throw error;
		}
		if (!Array.isArray(page) || page.length === 0) break;
		rows.push(...page);
		if (page.length < 100) break;
	}
	return rows;
}
async function kalshiMarkets() {
	const rows = [];
	let cursor = "";
	for (let i = 0; i < 30; i++) {
		const params = new URLSearchParams({ limit: "100" });
		if (cursor) params.set("cursor", cursor);
		const page = await fetchJson(
			`https://api.elections.kalshi.com/trade-api/v2/historical/markets?${params}`,
		);
		rows.push(...(page.markets ?? []));
		cursor = page.cursor ?? "";
		if (!cursor || !(page.markets ?? []).length) break;
	}
	return rows;
}
const teams = new Set(
	`atlanta hawks boston celtics brooklyn nets charlotte hornets chicago bulls cleveland cavaliers dallas mavericks denver nuggets detroit pistons golden state warriors houston rockets indiana pacers la clippers los angeles lakers memphis grizzlies miami heat milwaukee bucks minnesota timberwolves new orleans pelicans new york knicks oklahoma city thunder orlando magic philadelphia 76ers phoenix suns portland trail blazers sacramento kings san antonio spurs toronto raptors utah jazz washington wizards arizona cardinals atlanta falcons baltimore ravens buffalo bills carolina panthers chicago bears cincinnati bengals cleveland browns dallas cowboys denver broncos detroit lions green bay packers houston texans indianapolis colts jacksonville jaguars kansas city chiefs las vegas raiders los angeles chargers los angeles rams miami dolphins minnesota vikings new england patriots new orleans saints new york giants new york jets philadelphia eagles pittsburgh steelers san francisco 49ers seattle seahawks tampa bay buccaneers tennessee titans washington commanders`.split(
		" ",
	),
);
const dateOf = (row) =>
	row.endDate ??
	row.close_time ??
	row.expiration_time ??
	row.settlement_ts ??
	"";
const _dateKey = (value) =>
	value ? new Date(value).toISOString().slice(0, 10) : "";
const dateDistance = (a, b) =>
	Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000;
const textOf = (row) =>
	`${row.question ?? ""} ${row.title ?? ""} ${row.subtitle ?? ""}`.toLowerCase();
const knownTeams = (text) =>
	[...teams].filter((team) => text.includes(team)).sort();
const numberTokens = (text) =>
	[...text.matchAll(/\$?\d+(?:,\d{3})*(?:\.\d+)?/g)].map((match) =>
		Number(match[0].replaceAll(",", "").replace("$", "")),
	);
function family(left, right) {
	const a = textOf(left),
		b = textOf(right);
	const datesClose = dateDistance(dateOf(left), dateOf(right)) <= 1;
	if (!datesClose) return null;
	const leftTeams = knownTeams(a),
		rightTeams = knownTeams(b),
		sharedTeams = leftTeams.filter((team) => rightTeams.includes(team));
	if (
		sharedTeams.length >= 2 &&
		/(winner|win|beat|game|match|championship|playoff)/.test(`${a} ${b}`)
	)
		return {
			name: "sports-game-winner",
			reason: `same date and shared teams: ${sharedTeams.join(", ")}`,
			ruleWarning:
				"Verify whether both venues use the same game completion and postponement rules.",
		};
	const asset = ["btc", "bitcoin", "eth", "ethereum"].find(
		(token) => a.includes(token) && b.includes(token),
	);
	const leftNumbers = numberTokens(a),
		rightNumbers = numberTokens(b);
	if (
		asset &&
		leftNumbers.length &&
		rightNumbers.length &&
		leftNumbers.some((value) => rightNumbers.includes(value))
	)
		return {
			name: "crypto-threshold",
			reason: `same ${asset} asset, close date, and shared threshold`,
			ruleWarning:
				"Verify price source, observation window, and threshold inclusivity.",
		};
	const macro = [
		"fed",
		"fomc",
		"cpi",
		"inflation",
		"jobs report",
		"nonfarm",
		"unemployment",
		"interest rate",
	].find((token) => a.includes(token) && b.includes(token));
	if (macro)
		return {
			name: "macro-release",
			reason: `same ${macro} release family and close date`,
			ruleWarning:
				"Verify release timestamp, bucket definitions, and official settlement source.",
		};
	const election = [
		"president",
		"election",
		"senate",
		"governor",
		"nominee",
		"primary",
	].find((token) => a.includes(token) && b.includes(token));
	if (election)
		return {
			name: "election",
			reason: `same election keyword and close date`,
			ruleWarning: "Verify candidate identity and resolution source.",
		};
	return null;
}
function resolution(row, platform) {
	if (platform === "kalshi")
		return {
			value: row.result ?? "UNKNOWN",
			source: row.result ? "kalshi.result" : "unknown",
		};
	return {
		value: "UNKNOWN",
		source:
			"Polymarket Gamma listing does not expose an explicit settled outcome in this response",
	};
}
const [poly, kalshi] = await Promise.all([
	polymarketMarkets(),
	kalshiMarkets(),
]);
const candidates = [];
for (const left of poly) {
	for (const right of kalshi) {
		const matched = family(left, right);
		if (!matched) continue;
		const leftResolution = resolution(left, "polymarket");
		const rightResolution = resolution(right, "kalshi");
		candidates.push({
			ownerDecision: "",
			family: matched.name,
			polymarketId: left.conditionId ?? left.id,
			polymarketQuestion: left.question,
			polymarketCloseTime: dateOf(left),
			polymarketResolution: leftResolution.value,
			polymarketResolutionSource: leftResolution.source,
			kalshiId: right.ticker,
			kalshiQuestion: right.title,
			kalshiCloseTime: dateOf(right),
			kalshiResolution: rightResolution.value,
			kalshiResolutionSource: rightResolution.source,
			reason: matched.reason,
			ruleWarning: matched.ruleWarning,
		});
	}
}
const unique = new Map();
for (const candidate of candidates)
	unique.set(
		`${candidate.family}|${candidate.polymarketId}|${candidate.kalshiId}`,
		candidate,
	);
const rows = [...unique.values()].sort(
	(a, b) =>
		a.family.localeCompare(b.family) ||
		a.polymarketCloseTime.localeCompare(b.polymarketCloseTime),
);
const columns = [
	"ownerDecision",
	"family",
	"polymarketId",
	"polymarketQuestion",
	"polymarketCloseTime",
	"polymarketResolution",
	"polymarketResolutionSource",
	"kalshiId",
	"kalshiQuestion",
	"kalshiCloseTime",
	"kalshiResolution",
	"kalshiResolutionSource",
	"reason",
	"ruleWarning",
];
const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
await mkdir(new URL("data/", root), { recursive: true });
await writeFile(
	new URL("data/candidate-pairs.csv", root),
	`${[columns.join(","), ...rows.map((row) => columns.map((column) => cell(row[column])).join(","))].join("\n")}\n`,
);
await writeFile(
	new URL("research/family-listing.json", root),
	`${JSON.stringify({ observedAt: new Date().toISOString(), publicSources: ["https://gamma-api.polymarket.com/markets?closed=true", "https://api.elections.kalshi.com/trade-api/v2/historical/markets"], calls, polymarketRows: poly.length, kalshiRows: kalshi.length, candidates: rows.length, byFamily: Object.groupBy(rows, (row) => row.family), reviewStatus: "ownerDecision is blank; no candidate is eligible for scoring or memory writes" }, null, 2)}\n`,
);
console.log(
	JSON.stringify(
		{
			calls,
			polymarketRows: poly.length,
			kalshiRows: kalshi.length,
			candidates: rows.length,
			byFamily: Object.groupBy(rows, (row) => row.family),
		},
		null,
		2,
	),
);
