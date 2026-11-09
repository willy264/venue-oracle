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
- Sui commitment transaction links: [`results/testnet-commitments.json`](../results/testnet-commitments.json); all six are verified in [`results/testnet-verification.json`](../results/testnet-verification.json).
- Tatum Sui gRPC: mainnet balance and MemWal account-object read recorded in `research/gate-live.json`.

## Honest demo wording

"Venue Oracle asks whether a venue's 70% price resolves YES about 70% of the time. In the first 54-observation replay, the raw price beat the memory correction. The product shows that negative result, preserves the observations in Walrus Memory, and keeps live corrections conservative until more evidence arrives."

## Owner-only actions

Do not publish the blog, post socially, upload the video, make the repository public, or submit the form from this workspace without the owner's explicit action.
