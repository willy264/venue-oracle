# Venue Oracle Demo

## 0:00 - Live calibration

Open [venue-oracle.vercel.app](https://venue-oracle.vercel.app). Show the live cards and open one real market link, Tatum price endpoint, Walrus memory link, and Sui testnet proof.

There are 9 live calls: 6 sports and 3 US current-affairs calls. The current-affairs bucket has n=4; all 9 calls abstain and retain raw prices. The track record preserves the original 6 first-sample calls separately.

Say: "Venue Oracle asks whether a venue's probability is calibrated. It corrects a live price only when the recalled evidence is sufficient; otherwise it abstains and shows the raw venue price."

## 0:35 - Why this number?

Open the drawer on a live card. Show the venue, time bucket, replay sample count, raw price, corrected price, and the explicit abstention when no qualifying summary is available.

## 0:55 - Learning

Open Learning. Explain that v2 was evaluated walk-forward with 550 resolved observations and a held-out time split. The held-out Brier score changed from 0.1955 raw to 0.1984 corrected, while calibration error improved from 0.145 to 0.102. Claim no accuracy improvement.

## 1:25 - Venue honesty

Open Venue honesty and show the reliability diagrams. Explain that the diagonal is perfect calibration and that small buckets are not treated as evidence.

## 1:50 - Track record and proof

Open Track record. Show the current calls and the preserved first sample. Open a Sui transaction and the package link. Explain that each call digest was committed on Sui testnet and verified through Tatum gRPC before resolution.

## 2:15 - Memory

Open Memory and show the `vo-live` records, blob IDs, namespaces, and restore panel. Close with: "The result is better calibration, not a claim of better prediction accuracy."

The Memory page reports 343 verified mainnet memories across 20 namespaces.

All displayed values come from the committed replay, live-call, and testnet verification evidence in `results/`.
