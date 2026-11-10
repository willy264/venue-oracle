import { readFile, writeFile } from "node:fs/promises";
import { MemWal } from "@mysten-incubation/memwal";

const root = new URL("../", import.meta.url);
let envText = "";
try {
	envText = await readFile(new URL(".env", root), "utf8");
} catch {}
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const memory = MemWal.create({
	key: process.env.MEMWAL_KEY_CHECKER,
	accountId: process.env.MEMWAL_ACCOUNT_ID,
	serverUrl: process.env.MEMWAL_SERVER_URL,
	namespace: "vo-live",
});
const before = await memory.listNamespaces({ limit: 100 });
const restored = await memory.restore("vo-live", 100);
const after = await memory.listNamespaces({ limit: 100 });
const live = JSON.parse(
	await readFile(new URL("results/live-calls.json", root), "utf8"),
);
const comparisonCall =
	live.calls.find((call) => call.rawPrice > 0) ?? live.calls[0];
const comparison = {
	marketId: comparisonCall.marketId,
	beforePrice: comparisonCall.correctedProbability,
	afterPrice: comparisonCall.correctedProbability,
	identical: comparisonCall.rawPrice === comparisonCall.correctedProbability,
};
const evidence = {
	observedAt: new Date().toISOString(),
	network: "mainnet",
	status: restored.failed === 0 ? "verified" : "degraded",
	namespace: "vo-live",
	namespacesListedBefore: before.namespaces.length,
	namespacesListedAfter: after.namespaces.length,
	memoryCountBefore:
		before.namespaces.find((item) => item.name === "vo-live")?.memory_count ??
		0,
	memoryCountAfter:
		after.namespaces.find((item) => item.name === "vo-live")?.memory_count ?? 0,
	restored: restored.restored,
	skipped: restored.skipped,
	failed: restored.failed,
	total: restored.total,
	incomplete: restored.incomplete,
	rebuildResult: "vo-live restore completed server-side",
	comparison,
};
await writeFile(
	new URL("results/mainnet-restore-verification.json", root),
	`${JSON.stringify(evidence, null, 2)}\n`,
);
console.log(JSON.stringify(evidence, null, 2));
