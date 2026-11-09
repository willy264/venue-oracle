import { readFile, writeFile } from "node:fs/promises";
import { credentials } from "@grpc/grpc-js";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";

const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const apiKey =
	process.env.tatum_testnet_api_key ?? process.env.TATUM_TESTNET_API_KEY;
if (!apiKey) throw new Error("tatum_testnet_api_key is required");
const transport = new GrpcTransport({
	host: "sui-testnet-grpc.gateway.tatum.io:443",
	channelCredentials: credentials.createSsl(),
});
const client = new SuiGrpcClient({ network: "testnet", transport });
const options = { meta: { "x-api-key": apiKey }, timeout: 30000 };
const stringify = (value) =>
	JSON.stringify(
		value,
		(_, item) => (typeof item === "bigint" ? item.toString() : item),
		2,
	);
const data = JSON.parse(
	await readFile(new URL("results/live-calls.json", root), "utf8"),
);
const verifications = [];
for (const call of data.calls) {
	let transaction;
	let error = null;
	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			const response = await client.ledgerService.getTransaction(
				{
					digest: call.commitmentTxDigest,
					readMask: {
						paths: [
							"digest",
							"transaction",
							"effects",
							"events",
							"timestamp",
							"checkpoint",
						],
					},
				},
				options,
			);
			transaction = response.response.transaction;
			break;
		} catch (candidate) {
			error = String(candidate);
			await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
		}
	}
	const _eventBytes = JSON.stringify(transaction?.events ?? null);
	const events = transaction?.events?.events ?? [];
	const commitmentEvent = events.find((event) =>
		String(event.eventType ?? "").includes("::commit::Committed"),
	);
	const eventJson = JSON.stringify(commitmentEvent?.json ?? null);
	const digestMatches =
		eventJson.includes(call.digest) ||
		eventJson.includes(Buffer.from(call.digest, "hex").toString("base64"));
	const referenceMatches = eventJson.includes(
		Buffer.from(call.pairId, "utf8").toString("base64"),
	);
	const verified = Boolean(
		transaction?.digest === call.commitmentTxDigest &&
			commitmentEvent &&
			digestMatches &&
			referenceMatches,
	);
	verifications.push({
		pairId: call.pairId,
		txDigest: call.commitmentTxDigest,
		verified,
		digestFoundInEvents: digestMatches,
		referenceFoundInEvents: referenceMatches,
		eventType: commitmentEvent?.eventType ?? null,
		eventJson: commitmentEvent?.json ?? null,
		checkpoint: transaction?.checkpoint?.toString() ?? null,
		timestamp: transaction?.timestamp ?? null,
		error,
	});
	await new Promise((resolve) => setTimeout(resolve, 1000));
}
data.tatumTestnetVerification = verifications;
data.commitmentVerification = verifications.every((item) => item.verified)
	? "verified-through-tatum-testnet-grpc"
	: "failed-or-incomplete";
data.updatedAt = new Date().toISOString();
await writeFile(
	new URL("results/live-calls.json", root),
	`${stringify(data)}\n`,
);
await writeFile(
	new URL("results/testnet-verification.json", root),
	`${stringify({ network: "testnet", host: "sui-testnet-grpc.gateway.tatum.io:443", verifications, observedAt: data.updatedAt })}\n`,
);
transport.close();
console.log(stringify({ network: "testnet", verifications }));
