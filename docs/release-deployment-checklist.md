# Release Deployment Checklist

Use this as the final release and launch gate for `@stroma-labs/signal` v0.1. It combines the npm-package checks, first-publish preflight, and live pipeline validation in one place.

## Merge and publication are separate

PR72's missing BigQuery validations were accepted **for that merge only**; they remain unrun, not passed. See the [scoped waiver](../packages/signal/RELEASE-GATE.md#pr72-merge-waiver--bigquery-only) and [validation evidence](./rc5-validation.md). Other release gates and existing debt were not blanket-waived.

A merge to `main` runs CI and may update the hosted report through the connected Cloudflare Pages integration. The npm workflow runs only on a published GitHub Release or manual dispatch with an explicit tag. It sends prereleases to `next` and stable versions to `latest`, validating version/tag/prerelease metadata. Merging does not create a release or move existing npm tags.

## 1. One-Time Publish Preflight

Before the first public publish:

- confirm the `@stroma-labs` npm scope exists
- confirm the publishing account has permission to publish `@stroma-labs/signal`
- confirm the npm Trusted Publisher policy on `@stroma-labs/signal` matches this repo + the `Publish` workflow on `main` (Settings → Trusted publishers on npmjs.com). Trusted Publishing is the auth model — there is no `NPM_TOKEN` secret, and adding one would be a regression.
- confirm the publish workflow still keeps `id-token: write` plus `npm publish --provenance`
- confirm the release target is the canonical repo: `jonnybmc/signal`. The package metadata/readiness assertions still contain the legacy `jonnybmc/stroma-signal` name; verify the npm Trusted Publisher repository/workflow binding after the rename before publishing. This checklist does not change credentials or access policy.

## 2. Repo Gates

These must all pass before tagging a release:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm check:release
pnpm test:e2e:smoke
pnpm test:cli:pack
```

Root `pnpm typecheck` checks contracts/SDK, not the report app. The current direct app check retains baseline errors; see the validation record. Run the full browser matrix for browser changes and the four real SQL dry-runs in the package release gate before publication.

Package audit:

```bash
cd packages/signal
pnpm pack --dry-run
```

Expected package outcomes:

- no `.map` files in the tarball
- no runtime `dependencies`
- no leaked `@stroma-labs/signal-contracts` import in built output
- tarball surface limited to `dist/`, `package.json`, and the package README

## 3. Release-Cut Checks

Before publishing `v0.1.0`:

- `packages/signal/package.json` version is the intended release version
- `CHANGELOG.md` moves from `Unreleased` to the actual release date on the release commit
- the Git tag matches the package version exactly, e.g. `v0.1.0`
- the GitHub Release uses that same tag
- the publish workflow runs `pnpm run ci`, installs Chromium, runs `pnpm test:e2e:smoke`, runs `pnpm check:release`, and only then publishes

## 4. Live Staging Validation

Validate both supported persistence paths before calling the release deployment-ready.

### GTM / GA4 path

- deploy Signal with `createDataLayerSink()`
- confirm `perf_tier_report` appears in GTM Preview
- confirm the expected event lands in GA4 DebugView
- run `docs/ga4-bigquery-validation.sql` and confirm rows land
- run `docs/ga4-bigquery-url-builder.sql` and open the returned hosted `/r?...` URL

### Endpoint / warehouse path

- deploy Signal with `createBeaconSink()` or the callback sink path
- confirm one canonical event lands at the collector and validates correctly
- confirm dedupe/idempotency is enforced on `event_id`
- run `docs/normalized-bigquery-validation.sql` and confirm rows land
- run `docs/normalized-bigquery-url-builder.sql` and open the returned hosted `/r?...` URL

## 5. Hosted Report Validation

For the generated hosted report URL:

- `/r` renders the expected artifact without crashing
- `/build` decodes the same URL and shows the expected summary semantics
- the freshness date is present for fresh links
- legacy links show the legacy freshness warning instead of a fake date
- malformed or contradictory URLs fail closed in both `/build` and `/r`

For an offline download, also check local file readability with JavaScript disabled, zero network/storage behavior, omitted default labels, escaping, coverage/fidelity caveats and print layout. See [offline usage](./offline-evidence-brief.md).

## 6. Visual and QA Review

Run the local Chromium visual suite when UI changes are intentional:

```bash
pnpm test:e2e:visual
```

If the diffs are intentional:

```bash
pnpm test:e2e:visual:update
```

The current source includes seven reviewed Darwin Chromium baselines. Linux/Windows visual coverage is not established by those files or by Linux functional smoke CI; create and review platform-specific baselines in their target environment rather than copying Darwin images.

## 7. Operational Controls

Before broad rollout:

- collector validation, rate limiting, and CORS policy are configured intentionally
- warehouse retention is defined for `path`, `referrer`, `lcp_resource_url`, and attribution fields
- the current-report-URL table has an explicit owner
- read/write access to the current-report-URL table is intentionally scoped
- the scheduled query cadence is agreed and monitored
