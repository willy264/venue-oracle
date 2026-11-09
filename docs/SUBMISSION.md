# Submission Draft

## Required links

- Demo URL: https://web-psi-five-oie9hjjwqd.vercel.app
- Public repository: https://github.com/willy264/venue-oracle
- Blog URL: owner-only publication, not done.
- Video URL: owner-only upload, not done.
- Hackathon form: owner-only submission, not done.

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
