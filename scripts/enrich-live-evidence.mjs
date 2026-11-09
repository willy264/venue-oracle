import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const apiKey = process.env.tatum_mainnet_api_key ?? process.env.TATUM_API_KEY;
if (!apiKey) throw new Error("Missing Tatum API key");
const base = "https://api.tatum.io/v4/data/prediction";
const headers = { "x-api-key": apiKey };
const dataFile = new URL("results/live-calls.json", root);
const data = JSON.parse(await readFile(dataFile, "utf8"));
for (const call of data.calls) {
	const marketPath = `/markets/${encodeURIComponent(call.marketId)}`;
	const pricePath = `${marketPath}/price`;
	const [marketResponse, priceResponse] = await Promise.all([
		fetch(`${base}${marketPath}`, { headers }),
		fetch(`${base}${pricePath}`, { headers }),
	]);
	if (!marketResponse.ok || !priceResponse.ok) {
		throw new Error(
			`${call.marketId}: market ${marketResponse.status}, price ${priceResponse.status}`,
		);
	}
	const market = await marketResponse.json();
	const price = await priceResponse.json();
	const row = market.data ?? market;
	const prices = price.data ?? price.outcomes ?? price.prices ?? [];
	const first = Array.isArray(prices) ? prices[0] : undefined;
	const rawPrice = Number(
		first?.midpoint ??
			first?.price ??
			first?.mid ??
			first?.last ??
			call.rawPrice,
	);
	call.tatum = {
		marketEndpoint: `${base}${marketPath}`,
		priceEndpoint: `${base}${pricePath}`,
		snapshotTimestamp: call.ts,
		rawPrice,
		marketResponseFields: Object.keys(row ?? {}).sort(),
	};
	if (call.venue === "polymarket") {
		const clobUrl = `https://clob.polymarket.com/markets/${encodeURIComponent(call.marketId)}`;
		const clobResponse = await fetch(clobUrl);
		const clob = clobResponse.ok ? await clobResponse.json() : null;
		call.venueUrl = clob?.market_slug
			? `https://polymarket.com/market/${clob.market_slug}`
			: null;
		call.venueUrlStatus = call.venueUrl
			? "verified-from-polymarket-clob-market_slug"
			: "not-returned-by-public-market-api";
		call.venueMarketSlug = clob?.market_slug ?? null;
	} else {
		const publicUrl = `https://api.elections.kalshi.com/trade-api/v2/markets/${encodeURIComponent(call.marketId)}`;
		const publicResponse = await fetch(publicUrl);
		const publicPayload = publicResponse.ok
			? await publicResponse.json()
			: null;
		const publicMarket = publicPayload?.market;
		call.venueUrl = publicMarket?.ticker
			? `https://kalshi.com/markets/${publicMarket.ticker}`
			: null;
		call.venueUrlStatus = call.venueUrl
			? "canonical-ticker-url-public-market-confirmed"
			: "not-returned-by-public-market-api";
	}
	call.marketIdSource =
		"Tatum prediction API market listing and price response";
}
data.integrity = {
	status: "real-tatum-sampled-records",
	checkedAt: new Date().toISOString(),
	interpretation:
		"The six records retain their original Sui commitment digests. Venue URLs are shown only when returned by Tatum; otherwise the market ID and Tatum endpoints are the available primary evidence.",
};
await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`);
console.log(
	JSON.stringify(
		data.calls.map((call) => ({
			venue: call.venue,
			marketId: call.marketId,
			venueUrl: call.venueUrl,
			tatum: call.tatum,
		})),
		null,
		2,
	),
);
