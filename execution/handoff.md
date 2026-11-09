# Handoff

## Current state

The Venue Oracle workspace was created from the supplied build brief. No product code, external writes, deployments, or submissions have been performed.

The local Venue Oracle `.env` now contains `TATUM_ID` and `SUI_ADDRESS`, along with the Tatum and MemWal runtime variables. Do not print or commit their values.

## Exact next action

Gate 1 is reported in `research/decision.md`. The historical replay path failed its data gate and the plan changed to live snapshots. Do not start a scored run until the owner confirms a real pair set or provides another verified corpus. The candidate review file is `data/candidate-pairs.csv`.

## Approval boundaries

Ask the human for explicit approval before any mainnet memory write, mainnet SUI/USDC spend, Move mainnet deployment, public-repo change, blog/social publication, or hackathon submission.
