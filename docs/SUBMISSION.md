# Submission Draft

## Required links

- Demo URL: https://venue-oracle.vercel.app
- Public repository: https://github.com/willy264/venue-oracle
- Vercel project: `venue-oracle`; root `apps/web`, Node `22.x`.
- Blog URL: owner-only publication, not done.
- Video URL: owner-only upload, not done.
- Hackathon form: owner-only submission, not done.

## Draft form fields

- Email: owner enters the submitting email; not stored in this repository.
- Discord: owner enters the submitting Discord handle; not stored in this repository.
- LinkedIn: owner enters the submitting LinkedIn URL; not stored in this repository.
- Tatum ID: verified in the local `.env` as `TATUM_ID`.
- SUI address: verified in the local `.env` as `SUI_ADDRESS`; it is the testnet commitment signer address.
- SUI Account ID: verified in the local `.env` as `MEMWAL_ACCOUNT_ID`.
- `MEMWAL_AGENT_ID`: verified in the local `.env`.
- MemWal identity check: `MEMWAL_KEY_CHECKER` derives the same 64-character public key as `MEMWAL_AGENT_ID` (exact match confirmed locally on 2026-11-09).
- Description: “Venue Oracle measures whether Polymarket and Kalshi prices are calibrated, independently by venue, category, and time-to-close. It writes resolved observations and bucket summaries to Walrus Memory, recalls them during walk-forward replay and live calibration, and commits live call digests on Sui testnet verified through Tatum gRPC. V2 held-out Brier was slightly worse after correction, while calibration error improved; no accuracy improvement is claimed.”
- Video: owner uploads the 2–3 minute demo video; not uploaded yet.
- Repository: https://github.com/willy264/venue-oracle
- Blog: owner publishes [`docs/blog-draft.md`](blog-draft.md); publication URL not available yet.
- Walrus feedback: “Walrus Memory made the calibration history inspectable and durable. The visible blob lineage is useful, but fresh recall and write-rate limits require batching, retries, and explicit disclosures.”
- AI Builder feedback: “The deterministic engine remained the source of truth; AI coding assistance was used for implementation and documentation, not for autonomous market decisions.”

## Proof to include

- MemWal agent ID: read from the owner's local `.env`; never commit the value.
- Mainnet blob IDs: [`results/latest-replay.json`](../results/latest-replay.json) and [`research/gate-live.json`](../research/gate-live.json).
- Live call blob IDs and hashes: [`results/live-calls.json`](../results/live-calls.json).
- Sui testnet package: `0xf12f3c22e31b83596b7db1a0641aff0a2bc033e10cc9bd1c435c850c11501363`.
- Sui commitment transaction links: [`results/testnet-commitments.json`](../results/testnet-commitments.json); all six are verified in [`results/testnet-verification.json`](../results/testnet-verification.json).
- Tatum Sui gRPC: mainnet balance and MemWal account-object read recorded in `research/gate-live.json`.

## Honest demo wording

"Venue Oracle asks whether a venue's 70% price resolves YES about 70% of the time. In v2's 110-market held-out suffix, raw Brier was 0.1955 and corrected Brier was 0.1984, while calibration error improved from 0.1453 to 0.1022. The product reports the mixed result without claiming accuracy improvement, preserves observations in Walrus Memory, and keeps live corrections conservative."

## Owner-only actions

Do not publish the blog, post socially, upload the video, or submit the form from this workspace without the owner's explicit action. The repository is already public at the URL above under the standing approval.
