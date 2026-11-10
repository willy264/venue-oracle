export const SUIVISION_TESTNET_BASE = "https://testnet.suivision.xyz";

export function suivisionTransactionUrl(digest: string) {
	return `${SUIVISION_TESTNET_BASE}/txblock/${digest}`;
}

export function suivisionObjectUrl(id: string) {
	return `${SUIVISION_TESTNET_BASE}/object/${id}`;
}

export function suivisionAccountUrl(address: string) {
	return `${SUIVISION_TESTNET_BASE}/account/${address}`;
}
