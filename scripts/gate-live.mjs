import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const root = new URL("../", import.meta.url);
const errataRoot =
	"C:/Users/HP/Documents/people/hackathons/Errata/node_modules/";
const memwalModule = `${errataRoot}@mysten-incubation/memwal/dist/index.js`;
const grpcModule = `${errataRoot}@grpc/grpc-js/build/src/index.js`;
const suiModule = `${errataRoot}@mysten/sui/dist/grpc/index.mjs`;
const transportModule = `${errataRoot}@protobuf-ts/grpc-transport/build/commonjs/index.js`;
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const { MemWal } = await import(`file:///${memwalModule}`);
const { credentials } = createRequire(import.meta.url)(grpcModule);
const { SuiGrpcClient } = await import(`file:///${suiModule}`);
const { GrpcTransport } = createRequire(import.meta.url)(transportModule);

const runId = randomBytes(8).toString("hex");
const namespace = `vo-gate-${runId}`;
const text = `Venue Oracle gate probe ${runId}. This is a synthetic connectivity record, not a market fact.`;
const memory = MemWal.create({
	key: process.env.MEMWAL_KEY_CHECKER,
	accountId: process.env.MEMWAL_ACCOUNT_ID,
	serverUrl: process.env.MEMWAL_SERVER_URL,
	namespace,
	requestTimeoutMs: 30000,
});
const health = await memory.health();
const accepted = await memory.remember(text, namespace, {
	idempotencyKey: `venue-oracle-gate:${runId}`,
});
const stored = await memory.waitForRememberJob(accepted.job_id, {
	pollIntervalMs: 3000,
	timeoutMs: 90000,
});
const recalled = await memory.recall({ query: text, namespace, limit: 10 });
const recalledHit = recalled.results.find(
	(hit) => hit.blob_id === stored.blob_id,
);

const transport = new GrpcTransport({
	host: "sui-mainnet-grpc.gateway.tatum.io:443",
	channelCredentials: credentials.createSsl(),
});
const sui = new SuiGrpcClient({ network: "mainnet", transport });
const options = {
	meta: { "x-api-key": process.env.tatum_mainnet_api_key },
	timeout: 20000,
};
const balance = await sui.stateService.getBalance(
	{ owner: process.env.SUI_ADDRESS, coinType: "0x2::sui::SUI" },
	options,
).response;
let accountObject = null;
let accountObjectError = null;
try {
	accountObject = await sui.ledgerService.getObject(
		{
			objectId: process.env.MEMWAL_ACCOUNT_ID,
			readMask: { paths: ["object_id", "owner", "version"] },
		},
		options,
	).response;
} catch (error) {
	accountObjectError = String(error?.message ?? error);
}
transport.close();

const result = {
	observedAt: new Date().toISOString(),
	memwal: {
		healthStatus: health?.status,
		namespace,
		acceptedJob: Boolean(accepted?.job_id),
		blobId: stored.blob_id,
		owner: stored.owner,
		recalled: Boolean(recalledHit),
		recalledDistance: recalledHit?.distance ?? null,
		storedKeys: Object.keys(stored).sort(),
		recalledKeys: recalledHit ? Object.keys(recalledHit).sort() : [],
	},
	tatumGrpc: {
		host: "sui-mainnet-grpc.gateway.tatum.io:443",
		balanceReturned: Boolean(balance?.balance),
		balanceFields: balance?.balance ? Object.keys(balance.balance).sort() : [],
		accountObjectId: process.env.MEMWAL_ACCOUNT_ID,
		accountObjectReturned: Boolean(accountObject?.object),
		accountObjectFields: accountObject?.object
			? Object.keys(accountObject.object).sort()
			: [],
		accountObjectError,
	},
	commitmentAssessment:
		"The MemWal blob_id is a Walrus blob identifier, not a Sui object or transaction digest. The memory write can provide evidence, but it cannot replace a dedicated Sui commitment transaction for the no-hindsight proof.",
};
await writeFile(
	new URL("research/gate-live.json", root),
	`${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));
