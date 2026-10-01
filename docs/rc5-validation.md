# RC5 preparation: validation and remaining gates

This is local preparation, not release approval. Base: `8185b8460297f953df727af93e8f5c5c7f6c204d`.
Branch: `codex/rc5-evidence-preparation`. SDK version remains `0.1.0-rc.4`.
No release date, tag, push, merge, publication, or schedule was created.

## Implemented and reviewed

- Context and page/referrer paths are captured at observation start, after prerender activation, and again on bfcache restore. Ordinary soft navigation does not change the initial attribution or create another event. Hide/pagehide/manual flush deduplication remains intact.
- CLS takes the maximum session window, with strict one-second gap/five-second window boundaries. Zero requires supported observation and foreground paint (or a restored visible visit); unsupported/background/pre-paint data remains missing.
- INP groups entries by interaction ID, retains the slowest 100 groups, and selects descending rank `floor(totalInteractionCount / 50)`. Native counts are preferred; the bounded fallback uses Chromium ID spacing of seven. Missing candidates, including rank overflow at 5,000 interactions, remain null rather than producing a biased retained-set percentile. Browser event duration filtering and iframe limits remain. Buffered records before restore/activation are excluded.
- `normalizePath` is opt-in and applies to page/referrer/LCP-resource paths. Errors and invalid output fail closed. Hosts, custom target labels, and customer-added identity fields are explicitly outside its scope. LCP normalization runs once per entry, including debug output.
- Builder input edits invalidate the URL, copy action, success message and decoded preview. Hard URL-size exceptions are caught, and valid JSON can still export offline. Async clipboard completion does not restore stale state.
- Offline HTML uses a dedicated pure TypeScript projection/renderer and the canonical aggregate validator. It copies only named numeric/enum fields and optionally explicit site labels, escapes text, replaces unknown warning text with a visible withheld-warning notice, and retains coverage/missing-data caveats. No live DOM/bootReport serialization, script, font request, form, telemetry, storage, authentication or database is included. CSP blocks active/network content. Original JSON has priority; URL fidelity loss is disclosed. Hosted URL codec compatibility is unchanged.
- Prereleases resolve to npm `next`; stable versions resolve to `latest`. Version/tag/release-flag disagreement is rejected. Workflow code is tested locally but has not run a publication.

## Automated checks

Environment: existing connected Mac, Node `25.6.1`, pnpm `10.28.2`.
No new direct dependencies or framework/browser environments were added. Existing dependency versions were updated for the authorized security cleanup.

| Check | Result |
|---|---|
| `pnpm lint` | Pass; 37 existing warnings and one informational diagnostic remain |
| `pnpm typecheck` | Pass (contracts and SDK; root command does not typecheck report app) |
| `pnpm test:unit` | 3,700 passed, 55 files, no skips once built CLI was available |
| Final focused observer/offline unit run | 59 passed, including the single-call normalization regression |
| `pnpm build` | Pass: contracts, SDK, CLI, both public apps |
| Build export/boundary/budget gates | Pass; ceilings unchanged |
| `pnpm test:cli:pack` | npm, pnpm, yarn passed; Bun skipped because not installed |
| `pnpm check:release` | Metadata, pack contents and artifact checks passed; does not satisfy the manual gates below |
| Chromium and Firefox smoke/offline checks | 46 passed across the two browsers in the full run |
| Final offline browser run after layout refinements | 6 passed (3 each in Chromium and Firefox) |
| `pnpm test:e2e --update-snapshots=none` | 46 passed, 30 failed, 14 intentional skips: 7 missing macOS visual baselines and 23 WebKit launch failures (expected `webkit-2272` absent). No screenshot comparison was blessed and no baseline was created |
| Direct report-app `tsc --noEmit` | 17 existing errors remain; same errors reproduce in unmodified base, which has 41 total. Builder narrowing removes 24 baseline errors. No new report-app type errors |

Final compressed closure sizes: runtime **6,980 bytes / 7 KiB**, runtime + GA4
**9,054 / 9 KiB**, report subpath **14,231 / 15 KiB**, CLI **15,600 / 20 KiB**.
Report static assets: **290,083 / 303,104 bytes**. Remaining runtime headroom is small.

The initial sandbox unit failures were localhost binding restrictions; rerun with
local binding passed. A sandbox build emitted files but did not exit; the permitted
local rerun completed. A release-check attempt overlapped the pack gate's rebuild
and saw an incomplete dist directory; the sequential final gate passed.

## Security assessment (not clean)

Fresh full-lock audit: **34 → 27 advisories** (after: 1 critical, 3 high,
21 moderate, 2 low). Audit counts include the retained private graph.

- Public root: existing direct build dependencies now resolve plugin-terser **1.0.0**, Vite **6.4.3**, Vitest **3.2.7**; TypeScript remains **5.9.3**. Bounded existing transitive overrides resolve PostCSS **8.5.28** and nanoid **3.3.19**. serialize-javascript resolves **7.1.2** through terser. The SDK still has zero runtime dependencies.
- Public residual: direct dev dependency Vitest 3.2.7 and its transitive `@vitest/mocker` carry moderate **GHSA-82fw-gwwq-j7x9**. The audit reports a fix at `>=4.1.11`; the separate major migration is deferred, not waived.
- Private graph: all four importer definitions were compared against the base and are unchanged. Private direct Vitest 3.2.4 retains critical **GHSA-5xrq-8626-4rwp** and the moderate advisory; its transitive Vite 6.4.2 retains moderate/high advisories. Private direct Hono and `@hono/node-server`, and transitive ws/esbuild also retain findings. Private source, credentials, and configuration were not changed.

Do not describe this as security-clean or merge PR66/PR70 automatically.

## Offline evidence review

A synthetic example was generated from the existing full-depth scenario plus
synthetic navigation timing values matching contract-test fixtures. No customer
telemetry was used. Default HTML bytes omit domain/route/unknown text; hostile
optional labels are escaped. Browser tests check `file://`, JavaScript disabled,
network interception/offline mode, no storage/cookies, print rendering, and builder
error recovery. Visual inspection covered desktop 1440px, mobile 390px, and every
page of the A4 print output. No clipping or orphaned handoff text was observed.

A browser print-to-PDF check is a QA artifact, not a new PDF-generation dependency.
Example files and logs are retained alongside the checkout in `../artifacts/`.
Library saving failed before upload; local artifacts remain available.

## Unmet release gates

- Four real BigQuery dry-runs: `bq` is unavailable and no dataset/credentials were configured. Regex/unit checks do not substitute for these.
- Five fresh framework smokes (Next App Router, React Router v7, Remix v2, SvelteKit, vanilla): not provisioned or installed. Existing spike/browser and packed CLI checks do not satisfy the fresh-project matrix.
- Node 18 consumer / Node 22 build matrix: not verified; apparent alternate Homebrew node paths resolve to the same Node 25.6.1 binary. No runtimes were installed.
- Missing WebKit 2272 and reviewed macOS visual baselines prevent a fully green browser matrix. No browser download or baseline refresh was performed.
- Report-app type debt (17 baseline errors) remains outside the root typecheck command.
- Security findings above remain open, including the separately scoped private repository and major test-tool migration.
- npm Trusted Publisher repository/workflow binding after the repository rename needs operator verification. Package metadata/readiness assertions still reference the legacy repository name. No credential/access-policy inspection or changes were made.
- Approve intended rc5 version/date and close applicable gates before tagging; publication remains separately authorized.

## Metric references

- [CLS definition and lifecycle caveats](https://web.dev/articles/cls)
- [INP interaction grouping and outlier rule](https://web.dev/articles/inp)
- [Chromium interaction-count fallback](https://github.com/GoogleChrome/web-vitals/blob/main/src/lib/polyfills/interactionCountPolyfill.ts)
- [Google Analytics query sampling](https://support.google.com/analytics/answer/13331292)
