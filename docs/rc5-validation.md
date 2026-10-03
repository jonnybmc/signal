# RC5 preparation: validation and remaining gates

The original PR72 evidence below is retained as history. The user subsequently authorized rc5 publication, with BigQuery explicitly waived/unrun for rc5 only. Release preparation uses `codex/release-0.1.0-rc.5` from merged main `b7ff1020961e6fd33a4044149ed6ef07fb57ead0`, updates the SDK to `0.1.0-rc.5`, and targets npm `next` without moving `latest`. The rc5 changelog section is the version-level source of truth; final release/registry checks are recorded below and on the release PR.

## Release preflight

GitHub repository access and the existing `id-token: write` workflow were verified read-only. Prior OIDC publication succeeded. The Mac's `npm trust list` returned 401, so the npm-side binding could not be inspected locally; it is not marked verified. Metadata/readiness checks now match `jonnybmc/signal`, as required for provenance. No credential or access-policy changes were made. Registry publication must succeed using the existing workflow before rc5 is described as live.

## Rc5 release-candidate checks

The rc5 candidate passed `pnpm run ci` on Node 24.21.0: 3,700 tests across 55 files, existing lint/root types/build/export/boundary/budget and metadata/pack checks. The three vanilla snippet snapshots changed only their four CDN pins from rc4 to rc5. A stale local rc4 CLI build was rebuilt before the passing run; a completed sandbox build that did not exit was terminated, and the normal permitted CI/build/pack commands exited successfully.

`pnpm test:cli:pack` passed with npm, pnpm, yarn and Bun. `pnpm test:e2e --update-snapshots=none` passed **76 tests**, with **14 intentional non-Chromium visual skips** and no failures. No visual baselines changed.

The five isolated framework fixtures created during this preparation were reinstalled from the rc5 tarball with offline dependency resolution, regenerated CLI output, and rebuilt where applicable. Next App Router, React Router, Remix, SvelteKit and vanilla all passed Chromium/dataLayer checks (initialization, finite LCP, one event, duplicate suppression, no external requests/page errors). The local rc5 package's four imports and CLI passed on Node 18.20.8, 20.20.2, 22.23.3 and 24.21.0. These checks do not cover every sink/browser combination or prove hosted warehouse ingestion.

The rc4-and-earlier changelog suffix is byte-for-byte identical to merged main (SHA-256 `6fa744c6bd861349db9a087038660762a817260df11370daf804f73f8e69293a`). Relative documentation links and whitespace checks pass. Release notes are extracted from the rc5 changelog section; the publication date must match the actual UTC GitHub release date before publishing. Registry, dist-tag, provenance and fresh published-install results are recorded on the release PR after the workflow completes; they are not pre-claimed here.

## Historical PR72 preparation

This records PR72 preparation and local validation, not release approval. Base: `8185b8460297f953df727af93e8f5c5c7f6c204d`.
Branch: `codex/rc5-evidence-preparation`. SDK version remains `0.1.0-rc.4`.
The initial local validation created no remote changes. The branch was subsequently pushed as [PR72](https://github.com/jonnybmc/signal/pull/72); the user then authorized documentation reconciliation and normal merge with the scoped BigQuery waiver below. No release date, version bump, tag, npm publication or schedule is authorized by that merge approval.
The first implementation is preserved as commit `a1aa9ab3c4562f24de80c4f2870114e1bf5a5d71`.
The follow-up adds scroll-spy/reduced-motion fixes, isolated browser test servers and
reviewed Darwin baselines, correct CI-command documentation, and this expanded
validation evidence. It does not change SDK/runtime dependencies or the private graph.

## PR72 merge decision

The user accepted the missing BigQuery validations for PR72 merge only. The four real BigQuery dry-runs remain **not executed**, not passed. Future publication still requires release-gate assessment; live GTM/GA4/warehouse checks, Trusted Publisher verification, security findings, app type debt and unverified platforms are not blanket-waived.

The implementation head `7796f8b09b9d3acc03915b0948ab8aac2f70607c` passed GitHub's Linux `verify` and `e2e-smoke` jobs ([run 36969688672](https://github.com/jonnybmc/signal/actions/runs/36969688672)); Cloudflare Pages also deployed its PR preview successfully. Normal merge requires the same checks on the final documentation head. The PR records final-head and post-merge outcomes; this record does not pre-claim them. A main merge may deploy the hosted report through the connected Pages integration, but does not run the npm publication workflow.

### Documentation reconciliation validation

The follow-up documentation pass updates README/changelog, setup/framework/API references, offline usage, privacy/data-flow claims and release gates. The existing docs checks now recognize the two exported normalizer types and the Svelte 5 `$effect` recipe. `pnpm run ci` on Node 22.23.3 passed again: 3,700 tests across 55 files, lint/root types/build/export/boundary/budget and release metadata/pack gates. Relative documentation file links and `git diff --check` passed. Bundle sizes are unchanged. An initial sandbox run could not bind localhost test ports; the permitted rerun exercised those tests normally. No new dependencies or test environments were added for this documentation pass.

## Implemented and reviewed

- Context and page/referrer paths are captured at observation start, after prerender activation, and again on bfcache restore. Ordinary soft navigation does not change the initial attribution or create another event. Hide/pagehide/manual flush deduplication remains intact.
- CLS takes the maximum session window, with strict one-second gap/five-second window boundaries. Zero requires supported observation and foreground paint (or a restored visible visit); unsupported/background/pre-paint data remains missing.
- INP groups entries by interaction ID, retains the slowest 100 groups, and selects descending rank `floor(totalInteractionCount / 50)`. Native counts are preferred; the bounded fallback uses Chromium ID spacing of seven. Missing candidates, including rank overflow at 5,000 interactions, remain null rather than producing a biased retained-set percentile. Browser event duration filtering and iframe limits remain. Buffered records before restore/activation are excluded.
- `normalizePath` is opt-in and applies to page/referrer/LCP-resource paths. Errors and invalid output fail closed. Hosts, custom target labels, and customer-added identity fields are explicitly outside its scope. LCP normalization runs once per entry, including debug output.
- Builder input edits invalidate the URL, copy action, success message and decoded preview. Hard URL-size exceptions are caught, and valid JSON can still export offline. Async clipboard completion does not restore stale state.
- Offline HTML uses a dedicated pure TypeScript projection/renderer and the canonical aggregate validator. It copies only named numeric/enum fields and optionally explicit site labels, escapes text, replaces unknown warning text with a visible withheld-warning notice, and retains coverage/missing-data caveats. No live DOM/bootReport serialization, script, font request, form, telemetry, storage, authentication or database is included. CSP blocks active/network content. Original JSON has priority; URL fidelity loss is disclosed. Hosted URL codec compatibility is unchanged.
- Prereleases resolve to npm `next`; stable versions resolve to `latest`. Version/tag/release-flag disagreement is rejected. Workflow code is tested locally but has not run a publication.

## Automated checks

Validation used the existing connected Mac and pnpm **10.28.2**. After the first
implementation commit, the user explicitly authorized isolated test-only setup.
Checksum-verified official Node runtimes and the official Bun release live in
`../test-tools/`; five fresh projects live in `../framework-smokes/`. Playwright WebKit 2272 was installed
into its normal browser cache. No Signal runtime dependency, hosted service,
credential, or access-policy change was made. The package still has zero runtime
dependencies. Existing public dependency versions changed only in the first
implementation's scoped security cleanup.

| Check | Final result |
|---|---|
| `pnpm run ci` on Node 22.23.3 | Pass: lint, root types, 3,700 unit tests in 55 files, build, exports, boundaries, budgets and release metadata/pack audit |
| `pnpm run ci` on Node 24.21.0 | Pass: same 3,700 tests and gates; matches the publication workflow's Node major |
| `pnpm lint` | Pass; 37 existing warnings and one informational diagnostic |
| `pnpm typecheck` | Pass (contracts/SDK; this root command does not typecheck the report app) |
| `pnpm test:cli:pack` on Node 22.23.3 | npm, pnpm, yarn, Bun 1.4.2 all pass; no package-manager skips |
| Installed package consumer matrix | All four public imports and packed CLI init pass on Node 18.20.8, 20.20.2, 22.23.3 and 24.21.0 |
| Full browser matrix, snapshot updates disabled | **76 passed, 14 intentional skips, 0 failed**: Chromium 30 passed; Firefox/WebKit 23 each; 7 Chromium-only visual tests skipped in each other engine |
| Chromium section visual baselines | Seven new macOS baselines, reviewed against unmodified main and final expected rendering |
| Direct report-app `tsc --noEmit` | 17 baseline errors remain; the same errors reproduce in unmodified base (41 total). No new report-app type errors |

Root CI means **`pnpm run ci`**, not `pnpm ci` (pnpm reserves that command and
reports it unimplemented). The PR template and release checklist now match the
already-correct workflow command.

Final Node 22 compressed closure sizes: runtime **6,967 bytes / 7 KiB**, runtime +
GA4 **9,030 / 9 KiB**, report **14,259 / 15 KiB**, CLI **15,649 / 20 KiB**.
Report static assets: **290,200 / 303,104 bytes**. Ceilings are unchanged; runtime
headroom remains small. The initial overlapping pack/release check saw incomplete
dist files; final pack gates ran sequentially. Later browser failures were traced to a shared-port
collision with another task, not an established SDK build defect.

Node 18/20 are consumer-only checks, not root build targets (`engines.node >=22`
at the root). Both supported build/publish majors were exercised. The CLI pack
gate verifies tarball installs, bundled private contracts, shebang and successful
JSON output through each package manager. No publish command ran.

### Browser findings and reviewed baselines

- An unrelated local preview occupied IPv4 port 4173 while the Signal spike
  used IPv6 on that port; Firefox reached the unrelated site. E2E servers now
  bind explicitly to dedicated `127.0.0.1:44173/44174`, use `--strictPort`, and
  disable existing-server reuse. All test origins share one source, and the spike
  uses its existing report-base environment setting. Other tasks were untouched.
- WebKit's existing scroll-spy failure reproduced on unmodified `8185b846`:
  less than one pixel of the previous section stayed intersecting, so an
  intersection-only trigger left the old link active. Scroll/resize now schedule
  a coalesced animation-frame probe. Existing navigation tests cover all engines.
- Reduced-motion counters now show final values immediately, including below the
  viewport. A regression checks no pending counter hooks and the actual **3.7s**
  wait delta before scrolling. The old Playwright setting was ignored because
  `reducedMotion` belongs inside `use.contextOptions`; that configuration is fixed.
- The original checkout had no tracked section snapshots. All seven Darwin
  Chromium baselines are new. Reference captures from unchanged main were
  compared section by section. Explained differences are final counter values
  (e.g. **0 → 3.7s**, form factors **0/0/0 → 50/35/15%**), the corrected active nav,
  and reading-progress width after the added footer download control. The report
  layout/content otherwise stayed intact. A capture-only stylesheet hides fixed
  navigation/progress chrome so it cannot obscure headings in full-section
  snapshots; separate functional tests exercise navigation. Final images were
  inspected. No Linux/Windows snapshots were fabricated or copied from Darwin.
- macOS WebKit 2272 rejects even a trivial `file://` HTML document when Playwright
  `offline: true` is enabled; it opens normally with JavaScript disabled. WebKit
  file tests therefore record/block every HTTP(S) request without that broken
  emulation flag. Chromium/Firefox retain the flag. All engines retain real
  `file://`, escaping/no-script assertions, zero network requests, storage/cookie
  checks, and print-layout coverage. This is browser emulation coverage, not a
  claim of physically disconnecting the Mac's network.

### Fresh framework matrix

Each fixture installs the locally packed candidate (`0.1.0-rc.4` unchanged), runs
its CLI with sample rate 1/dataLayer/no telemetry, and applies the generated
snippet. Browser checks serve the production build on localhost, confirm a 200
response and SDK initialization, generate a lifecycle event, assert one
`perf_tier_report` with finite LCP, repeat pagehide to verify deduplication, and
require zero page errors/external requests. These are **Chromium/dataLayer**
smokes; the existing compile matrix covers the broader snippet combinations.

| Fresh fixture | Verified version | Result |
|---|---|---|
| Next App Router | Next 16.3.8, React 19.2.8 | Build + browser pass |
| React Router | 7.18.4, React 19.2.8 | Build + browser pass |
| Remix | 2.17.5, React 18.3.1 | Build + browser pass |
| SvelteKit | 3.0.0, Svelte 5.57.1 | Build + browser pass |
| Vanilla | Native modules, static HTML | Browser pass; no build step |

Versions above come from installed package manifests; the CLI detection output
can show the declared range floor (e.g. Remix 2.17.0) instead.

Remix's current scaffold prints a React Router migration notice, so its fresh
fixture follows the [official v2 manual quickstart](https://v2.remix.run/docs/start/quickstart/).
The generated React Router scaffold's external fonts were removed for local-only
verification. Vanilla's generated pinned esm.sh URLs are mapped through an import
map to the **locally packed candidate**, avoiding a misleading test of published
rc4. SvelteKit uses the fresh scaffold's auto-adapter production output and local
preview; no hosted adapter was provisioned. Framework manifests/locks, wizard
JSON, build logs, screenshots and browser/consumer results remain alongside the
checkout. Fixture dependency audit findings do not modify Signal's lockfile.

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

- Four real BigQuery dry-runs remain unrun; their absence is accepted for PR72 merge only. Read-only checks found no `bq` or
  `gcloud`, `.config/gcloud`, `.bigqueryrc`, application-credential environment,
  project environment, or exposed BigQuery connector. No authorized project or
  dataset is known in this task. The user accepted merging without those validations; this is not evidence of SQL execution. No credentials, services, paid query jobs, or new access were
  created. SQL regex/unit checks do not substitute for real dry-runs.
- Live GTM Preview / GA4 DebugView and authorized warehouse ingestion/report URL
  checks require the existing staging destinations. Local spike/collector tests
  do not prove these external integrations.
- Report-app type debt (17 baseline errors) remains outside root typecheck.
- Security findings above remain open, including the separate private graph and
  major Vitest migration. Do not call the repository security-clean.
- npm Trusted Publisher repository/workflow binding after the rename still needs
  operator verification. Package metadata/readiness assertions retain the legacy
  repository name. Credentials/access policy were not inspected or changed.
- Linux functional CI passed on the implementation head. Linux/Windows visual rendering remains unverified locally. The seven new visual
  baselines are for macOS only; no existing Linux baseline was changed.
- Library saving remains blocked on the Mac helper (see below); local deliverables
  are intact. This is a delivery issue, not an SDK runtime failure.
- Intended rc5 version/date and all applicable release gates require approval
  before tagging. No release authorization is implied by local passing checks.

### Library delivery blocker

The read-only Library connector succeeds. The supported upload helper initially
failed before uploads with `hosted apps tools/list request failed: DNS`, then
`... TLS` under the default Python. Using the existing Homebrew Python resolved
that transport issue but failed with **`Library prepare_uploads is not available`**.
No upload was completed; no reconnect/setup UI was offered, and no credentials or
access changes were attempted. Synthetic HTML and desktop/mobile/print captures
remain in `../artifacts/`; upload attempts stopped at the parent's direction.

## Metric references

- [CLS definition and lifecycle caveats](https://web.dev/articles/cls)
- [INP interaction grouping and outlier rule](https://web.dev/articles/inp)
- [Chromium interaction-count fallback](https://github.com/GoogleChrome/web-vitals/blob/main/src/lib/polyfills/interactionCountPolyfill.ts)
- [Google Analytics query sampling](https://support.google.com/analytics/answer/13331292)
