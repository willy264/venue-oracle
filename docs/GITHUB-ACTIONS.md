# GitHub Actions Setup

Add these repository secrets at `https://github.com/willy264/venue-oracle/settings/secrets/actions` before manually dispatching `Live calibration and commitment`:

- `TATUM_API_KEY`: Tatum mainnet Prediction API key for live discovery and prices.
- `MEMWAL_ACCOUNT_ID`: MemWal account object ID.
- `MEMWAL_KEY_CHECKER`: MemWal delegate/checker private key used by the backend job.
- `SUI_PRIVATE_KEY`: Sui testnet commit signer private key.
- `VO_TESTNET_PACKAGE_ID`: `0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363`.
- `TATUM_TESTNET_API_KEY`: Tatum testnet Sui gRPC key.

The workflow does not read or expose `TATUM_ID`, `SUI_ADDRESS`, or `MEMWAL_AGENT_ID`; those remain submission metadata. Do not put any secret in the repository or workflow YAML. After the secrets are added, dispatch the workflow from the Actions tab and verify that the run records a Tatum sample, `vo-live` memory write, testnet transaction, and Tatum verification in `results/`.
