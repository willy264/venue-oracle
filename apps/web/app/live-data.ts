export type LiveCall = {
	id: string;
	venue: "polymarket" | "kalshi";
	question: string;
	marketId: string;
	marketUrl: string;
	rawPrice: number;
	correctedProbability: number;
	snapshotAt: string;
	tatumPriceEndpoint: string;
	blobId: string;
	txDigest: string;
	packageId: string;
};

export const liveCalls: LiveCall[] = [
	{
		id: "VO-001",
		venue: "polymarket",
		question: "Will the U.S. invade Iran before 2027?",
		marketId:
			"0x5db999fad322cea2914535aae5517060c3f80ad6d8c0231cde2124a434d16846",
		marketUrl:
			"https://polymarket.com/market/will-the-us-invade-iran-before-2027",
		rawPrice: 0.115,
		correctedProbability: 0.115,
		snapshotAt: "2026-11-09T05:47:53.173Z",
		tatumPriceEndpoint:
			"https://api.tatum.io/v4/data/prediction/markets/0x5db999fad322cea2914535aae5517060c3f80ad6d8c0231cde2124a434d16846/price",
		blobId: "SB3tgey0tZjMhLUJs0UH4_G62ZDookLDhagNqYFlZXk",
		txDigest: "9MzxmJUdqBmLXrec3mqHhfNQZXwLNWczbz8zNyXEsYuc",
		packageId:
			"0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363",
	},
	{
		id: "VO-002",
		venue: "polymarket",
		question: "Will Jesus Christ return before 2027?",
		marketId:
			"0x0b4cc3b739e1dfe5d73274740e7308b6fb389c5af040c3a174923d928d134bee",
		marketUrl:
			"https://polymarket.com/market/will-jesus-christ-return-before-2027",
		rawPrice: 0.0065,
		correctedProbability: 0.0065,
		snapshotAt: "2026-11-09T05:47:56.053Z",
		tatumPriceEndpoint:
			"https://api.tatum.io/v4/data/prediction/markets/0x0b4cc3b739e1dfe5d73274740e7308b6fb389c5af040c3a174923d928d134bee/price",
		blobId: "WVl8UlRuUnOXDruLUhR0IqUoGpzMPZHYzom6HBCE5WA",
		txDigest: "EGgcLvfkG8MD67drcBxwNcqT8fmdXWkDGQcU1VwW5QyD",
		packageId:
			"0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363",
	},
	{
		id: "VO-003",
		venue: "polymarket",
		question: "Will LeBron James win the 2028 US Presidential Election?",
		marketId:
			"0x836b850fc838195374862551a36f1c8691d96ff01e58b0a071f0fc1a0e357fb1",
		marketUrl:
			"https://polymarket.com/market/will-lebron-james-win-the-2028-us-presidential-election",
		rawPrice: 0.0005,
		correctedProbability: 0.0005,
		snapshotAt: "2026-11-09T05:47:58.628Z",
		tatumPriceEndpoint:
			"https://api.tatum.io/v4/data/prediction/markets/0x836b850fc838195374862551a36f1c8691d96ff01e58b0a071f0fc1a0e357fb1/price",
		blobId: "EWpeYh7pWSLc_JAH1XSfqNA_uLck6_Gc5ndljxAXEQ0",
		txDigest: "BMwaPzUvU4EAzCkqAF3PwCTVJm6qXDAJdk51UXsFMt2d",
		packageId:
			"0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363",
	},
	{
		id: "VO-004",
		venue: "kalshi",
		question: "Will Elon Musk visit Mars before Aug 1, 2099?",
		marketId: "KXELONMARS-99",
		marketUrl: "https://kalshi.com/markets/KXELONMARS-99",
		rawPrice: 0.12,
		correctedProbability: 0.12,
		snapshotAt: "2026-11-09T05:48:01.966Z",
		tatumPriceEndpoint:
			"https://api.tatum.io/v4/data/prediction/markets/KXELONMARS-99/price",
		blobId: "OFzX4Nr8jLg9SVhQU3vypUil0FrVHsyk02sE9pVNUQc",
		txDigest: "AWr5qNs71SP5otjxpAM2DoJnVgY4PYusGTRf9v3fjw82",
		packageId:
			"0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363",
	},
	{
		id: "VO-005",
		venue: "kalshi",
		question:
			"Will Nick Fuentes become President of the United States before 2045?",
		marketId: "KXPERSONPRESFUENTES-45",
		marketUrl: "https://kalshi.com/markets/KXPERSONPRESFUENTES-45",
		rawPrice: 0.21,
		correctedProbability: 0.21,
		snapshotAt: "2026-11-09T05:48:04.186Z",
		tatumPriceEndpoint:
			"https://api.tatum.io/v4/data/prediction/markets/KXPERSONPRESFUENTES-45/price",
		blobId: "CV841lGMtlnYvZbiROJ3yIKoVBIw5PdTTC0DHHq0XuA",
		txDigest: "29AvQ2Ukwo1BrJwgunqNBq4B5bGGXszLeb3cEVKFFHN4",
		packageId:
			"0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363",
	},
	{
		id: "VO-006",
		venue: "kalshi",
		question:
			"Will Zohran Mamdani become President of the United States before Jan 22, 2045?",
		marketId: "KXPERSONPRESMAM-45",
		marketUrl: "https://kalshi.com/markets/KXPERSONPRESMAM-45",
		rawPrice: 0.16,
		correctedProbability: 0.16,
		snapshotAt: "2026-11-09T05:48:06.397Z",
		tatumPriceEndpoint:
			"https://api.tatum.io/v4/data/prediction/markets/KXPERSONPRESMAM-45/price",
		blobId: "Eh7PX7nUJwtEFjBWnU3mkezk4wOMQmpQpb-8yaxpjBk",
		txDigest: "4EusGRrvCV2brZquWXqCbyB2mBXUe5YHgcak9d15xNFa",
		packageId:
			"0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363",
	},
];

export function decisionFor(call: LiveCall) {
	if (call.correctedProbability > call.rawPrice)
		return "Market looks underpriced";
	if (call.correctedProbability < call.rawPrice)
		return "Market looks overpriced";
	return "No calibration edge";
}
