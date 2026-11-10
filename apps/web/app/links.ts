export const SUISCAN_TESTNET_BASE = "https://suiscan.xyz/testnet";

export function suiscanTransactionUrl(digest: string) {
	return `${SUISCAN_TESTNET_BASE}/tx/${digest}`;
}

export function suiscanObjectUrl(id: string) {
	return `${SUISCAN_TESTNET_BASE}/object/${id}`;
}

export function suiscanAccountUrl(address: string) {
	return `${SUISCAN_TESTNET_BASE}/account/${address}`;
}
