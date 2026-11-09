import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = new URL("../", import.meta.url);
const envText = await readFile(new URL(".env", root), "utf8");
for (const line of envText.split(/\r?\n/)) {
	const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
	if (match && !process.env[match[1]])
		process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const sui = process.env.SUI_BIN;
const packageId = process.env.VO_TESTNET_PACKAGE_ID;
if (!sui || !packageId)
	throw new Error("SUI_BIN and VO_TESTNET_PACKAGE_ID are required");
const active = (await exec(sui, ["client", "active-env"])).stdout.trim();
if (active !== "testnet")
	throw new Error(
		`Refusing to commit: active Sui environment is ${active}, not testnet`,
	);
const file = new URL("results/live-calls.json", root);
const data = JSON.parse(await readFile(file, "utf8"));
const commitments = [];
for (const call of data.calls) {
	if (call.commitmentTxDigest) {
		commitments.push({
			pairId: call.pairId,
			txDigest: call.commitmentTxDigest,
			skipped: true,
		});
		continue;
	}
	const digest = `0x${call.digest}`;
	const reference = `0x${Buffer.from(call.pairId, "utf8").toString("hex")}`;
	const result = JSON.parse(
		(
			await exec(
				sui,
				[
					"client",
					"call",
					"--package",
					packageId,
					"--module",
					"commit",
					"--function",
					"commit",
					"--args",
					digest,
					reference,
					"0x6",
					"--gas-budget",
					"10000000",
					"--json",
				],
				{ maxBuffer: 4 * 1024 * 1024 },
			)
		).stdout,
	);
	call.commitmentStatus = "testnet-committed";
	call.commitmentTxDigest = result.digest;
	call.commitmentPackageId = packageId;
	commitments.push({ pairId: call.pairId, txDigest: result.digest, packageId });
}
data.commitment =
	"Testnet Sui commitments; verify each digest through Tatum testnet gRPC.";
data.testnetPackageId = packageId;
data.testnetCommitments = commitments;
data.updatedAt = new Date().toISOString();
await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
await writeFile(
	new URL("results/testnet-commitments.json", root),
	`${JSON.stringify({ packageId, commitments, observedAt: data.updatedAt }, null, 2)}\n`,
);
console.log(JSON.stringify({ packageId, commitments }, null, 2));
