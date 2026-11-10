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
const namespaces = [];
let cursor;
do {
	const page = await memory.listNamespaces({ cursor, limit: 100 });
	namespaces.push(...page.namespaces);
	cursor = page.has_more ? page.next_cursor : undefined;
} while (cursor);
const total = namespaces.reduce(
	(sum, item) => sum + (item.memory_count ?? 0),
	0,
);
const evidence = {
	observedAt: new Date().toISOString(),
	network: "mainnet",
	status: "verified",
	totalMemories: total,
	namespaces,
};
await writeFile(
	new URL("results/mainnet-memory-verification.json", root),
	`${JSON.stringify(evidence, null, 2)}\n`,
);
console.log(JSON.stringify(evidence, null, 2));
