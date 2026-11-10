# Verification Report

Gate checks have run, but product tests have not.

- PASS: MemWal mainnet write, wait, and recall; blob ID recorded in `research/gate-live.json`.
- PASS: Tatum Sui gRPC balance and MemWal account-object reads.
- PASS: Tatum market discovery requests; no candidate pair found in the scanned corpus.
- INCOMPLETE: Tatum history coverage for a resolved matched corpus.
- FAIL: Gate 1 historical replay corpus; 0 candidate pairs and 0 candles in successful sampled history responses.
- CHANGED: Data plan moved to the disclosed live-snapshot fallback; no scored run has started.
- PASS: Exactly three Tatum history rechecks returned 8, 8, and 7 daily candles.
- PASS: Public Polymarket and Kalshi history probes returned 8 and 7 real history points.
- FAIL: Structured historical listing produced 0 owner-review candidates.
- FAIL: Structured live listing produced 0 snapshot candidates.
- PASS: Calibration corpus contains 54 real replay observations.
- PASS: v2 corpus scanned 2,100 Polymarket and 8,072 Kalshi listings; 1,447 and 3,068 resolved candidates; 550 usable observations from 4,619 public-history calls.
- DISCLOSED: 2,039 history requests failed or lacked usable history and were excluded; no values were imputed.
- PASS: v2 replay completed on 550 observations with a 440/110 time-held-out split; 9 bucket-summary and 20 capped individual MemWal writes returned blob IDs.
- MIXED RESULT: v2 held-out raw Brier 0.1955 vs corrected 0.1984; raw calibration error 0.1453 vs corrected 0.1022. No predictive edge claimed.
- PASS: Walk-forward replay completed with 54 MemWal observation writes and 1 belief write.
- NEGATIVE RESULT: Raw Brier 0.0983 beat corrected Brier 0.2195; memory calibration did not improve this corpus.
- PASS: Live calibration sampled 9 real Polymarket markets through Tatum, wrote 9 completed `vo-live` memories, and recorded deterministic SHA-256 call digests. Three extra current-affairs calls used the closest v2 family bucket with n=4 and honestly abstained.
- PASS: Nine testnet Sui commitments were sent and all nine were verified through Tatum testnet gRPC.
- PASS: Engine plus reused `core` and `memory` suites, 6 files and 44 tests.
- PASS: Heuristic secret scan over 49 Git-visible files.
- PASS: Current heuristic secret scan over 89 Git-visible files.
- PASS: Reused `chain` suite passes after removing the accidental nested `packages/chain/chain` duplicate.
- PASS: Direct GitHub release download supplied Sui `1.83.1`; Move unit test passes 1/1. The CLI warning is non-fatal (`public entry` is redundant).
- PASS: Nine testnet commitment transactions were sent and all nine were verified through `sui-testnet-grpc.gateway.tatum.io:443`; package event type, digest, reference, and checkpoint matched.
- ADDED: Next.js web shell pages for live board, learning curve, memory inspector, track record, and method disclosures.
- PASS: Vercel production build completed after declaring TypeScript and React type dependencies; public URL returned HTTP 200.
- PASS: Direct `next build --webpack` completed locally; Vercel production build is also ready.

- PASS: Live-board evidence mapping checked: every finite displayed probability equals its corresponding `results/live-calls.json` `rawPrice`; venue subtitle is computed from the loaded records; all current records are Polymarket (9).
- PASS: Drawer mapping uses the clicked `LiveCall` object directly; nullable/zero-valued source prices render `Price unavailable` without a rail marker. The zero-value records are no longer presented as 0%.
- PASS: Drawer behavior implemented with fixed full-height desktop layout, mobile bottom sheet at 85dvh, backdrop click close, body-scroll lock, Escape handling, focus return, and Tab trapping.
- PASS: Contrast pairs checked against WCAG AA tokens: dark `--ink`/`--surface` (headings), `--text`/`--surface` (body), `--muted`/`--surface` (labels), `--link`/`--surface` (links), `--accent`/`--surface` (correction); light equivalents `--ink`/`--surface`, `--text`/`--surface`, `--muted`/`--surface`, `--link`/`--surface`, and `--accent`/`--surface`. Body pairs target at least 4.5:1; large text and controls target at least 3:1.
- NOT AUTOMATED: Browser screenshots were unavailable in this environment. Owner viewport check: open the production URL at 360px, 768px, and 1280px in both system light and dark themes; open the first and second card drawers, tab through the close/copy/link controls, press Escape, and confirm no horizontal scrollbar or clipped drawer content.

- PASS: Integrity enrichment confirmed nine real Tatum market and price endpoint records; public venue IDs and URLs are shown in the Live Board and Track Record.
- MIXED RESULT: v2 held-out raw Brier `0.1955` (95% CI `[0.1705, 0.2239]`) beat corrected `0.1984` (95% CI `[0.1730, 0.2288]`); calibration error improved `0.1453` to `0.1022`. No accuracy-improvement claim is made.
- PASS: GitHub Actions end-to-end live workflow completed in [run 42716287032](https://github.com/willy264/venue-oracle/actions/runs/42716287032).
- PASS: Mainnet MemWal verification counted 343 memories across 20 namespaces; evidence is in `results/mainnet-memory-verification.json`.

## Required evidence

- [x] Research gate decision recorded
- [x] MemWal round trip recorded with a real `blob_id`
- [x] Tatum Sui gRPC call recorded
- [x] Unit tests pass
- [x] Typecheck, lint, and build pass
- [x] Move tests pass
- [x] Integration tests pass when credentials are available

## Final handoff state

- The repository is frozen for submission after the final evidence pass; owner-only publication and submission actions remain external.
- No blog, social post, video upload, public-repo push, or form submission was performed.
- No mainnet SUI or USDC was spent.

## Final display pass (2026-11-10)

- Data integrity: all 9 live cards use `results/live-calls.json`; invalid or non-positive source prices render `Price unavailable` without a probability marker. The card-to-drawer mapping uses the selected call ID.
- Memory evidence: `results/mainnet-memory-verification.json` reports 343 mainnet memories across 20 namespaces. `results/mainnet-restore-verification.json` records a real server-side restore check at `2026-11-10T02:22:48.272Z`: 20 namespaces listed, 19 records recalled, rebuild completed, and the next deterministic price was identical.
- Flat background/header checks: repository search found no `linear-gradient`, `radial-gradient`, `conic-gradient`, `bg-gradient`, or `backdrop-filter`. The header is 64px, sticky, full-width, flat, and uses one bottom rule.
- Contrast pairs checked against WCAG AA: dark `--text/#0E1013`, dark `--ink/#161A20`, dark `--muted/#161A20`, dark `--link/#0E1013`, light `--text/#F5F3EE`, light `--ink/#FFFFFF`, light `--muted/#FFFFFF`, and light `--link/#F5F3EE`. Body pairs meet 4.5:1; large headings and links meet 3:1 or better.
- Responsive checks: CSS constraints cover 360px, 768px, and 1280px; the mobile drawer is a full-width bottom sheet below 640px and the navigation sheet opens below 768px. Browser screenshot automation was unavailable in this environment; owner should check the production URL at those widths in both system themes and confirm no horizontal scroll.
- Commands: `corepack pnpm test` passed (5 tasks, 55 tests); `corepack pnpm --dir apps/web typecheck` passed; `corepack pnpm --dir apps/web build` produced the Next production artifacts; `node scripts/secret-scan.ts` passed 122 files. Biome has no errors, with existing warnings for image optimization and other legacy files.
