# Signal

> 🧪 **Release Candidate** — package version `0.1.0-rc.4`; this source README also describes unreleased rc5 preparation.
> The publication workflow sends future prereleases (`-rc.N`, `-beta.N`) to npm `next` and stable releases to `latest`. It does not move existing tags on merge. Registry verification for PR72 found `latest = 0.1.0-rc.4` and `next = 0.1.0-rc.3`; use an exact version for reproducible installs. Unreleased changes below are not part of published rc4.
> The `0.x` line is pre-stable; the API can change before `1.0`.
> See [CHANGELOG.md](https://github.com/jonnybmc/signal/blob/main/CHANGELOG.md) for what shipped and what closes the next version.

A small library that measures what your real users actually experience — their network speed, device capability, and how fast your pages feel — and delivers that data to your own analytics so you can answer questions like *"are mobile users in dense areas getting a fair experience?"* without guesswork.

## Install

```bash
pnpm add @stroma-labs/signal
```

`pnpm`, `npm`, and `yarn` all work. Signal is ESM-only.

If you want to pin to a specific rc instead of tracking `latest`, use the exact version: `pnpm add @stroma-labs/signal@0.1.0-rc.4`.

## What ships

Four entry points — pick what you need:

| Import path                          | What it gives you                                        |
| ------------------------------------ | -------------------------------------------------------- |
| `@stroma-labs/signal`                | The runtime + sinks. **Always start here.**              |
| `@stroma-labs/signal/ga4`            | One-line GA4 / GTM integration via `dataLayer`.          |
| `@stroma-labs/signal/report`         | A preview helper for local QA without a warehouse.       |
| `@stroma-labs/signal/summary`        | Plain-text, JSON, and CSV exports for ad-hoc analysis.   |

The validated source build is 6,967 bytes gzipped for the runtime closure and 9,030 bytes for runtime + GA4. Other entry points are optional; sizes depend on the imported closure and build. See the [validation record](https://github.com/jonnybmc/signal/blob/main/docs/rc5-validation.md) for budgets.

## Three ways to wire it up

Choose the path that matches your existing setup. Mix and match if you want — they're not mutually exclusive.

### 1. Already on GTM and GA4

```ts
import { init } from '@stroma-labs/signal';
import { createDataLayerSink } from '@stroma-labs/signal/ga4';

init({
  sinks: [createDataLayerSink()]
});
```

A `perf_tier_report` event lands in `window.dataLayer` after each page load. Configure it as a custom event in GTM, send it to GA4, and you're done.

### 2. Have your own collector or backend

```ts
import { init, createBeaconSink } from '@stroma-labs/signal';

init({
  sinks: [createBeaconSink({ endpoint: '/rum/signal' })]
});
```

Signal POSTs one event per page load to your endpoint. Use this if you want full control over storage and querying.

### 3. Want app-level control

```ts
import { init, createCallbackSink } from '@stroma-labs/signal';

init({
  sinks: [
    createCallbackSink({
      onReport(event) {
        // do whatever you want with the event
        myAnalytics.track('page_perf', event);
      }
    })
  ]
});
```

## What you get back

One event per page load with everything we measured:

- **Network tier** — `urban`, `moderate`, `constrained_moderate`, or `constrained` from the TCP-handshake span exposed by Navigation Timing, when isolatable. Useful as a diagnostic slice; not a complete network-speed cohort — the richer per-subpart picture lives in `vitals.navigation_timing`.
- **Device tier** — `low`, `mid`, or `high` from real hardware signals (CPU cores, memory, screen)
- **Web Vitals** — LCP, INP, CLS, FCP, TTFB, plus rich attribution (which element was slow, which interaction phase dominated, which third-party scripts loaded before paint)
- **Navigation Timing breakdown** (`vitals.navigation_timing`) — DNS, TCP, TLS, request-to-first-byte, request-to-final-headers, response-download, redirect, service-worker subparts; three named TTFB definitions (`nav_ttfb_ms`, `connection_ttfb_ms`, `activation_adjusted_ttfb_ms` clamped ≥ 0 for prerender); `next_hop_protocol` + transfer/body sizes; plus a `provenance` sub-block flagging Early Hints, prerender activation, and suspected TAO redaction. Warehouse-only — does NOT enter the GA4 lane.
- **Long Animation Frame** story on Chromium 123+ — worst frame and dominant cause (script, layout, style, paint)
- **Background-tab filter** — events captured while the tab was hidden are tagged so they don't poison your percentiles

Zero runtime dependencies. The core SDK sets no cookies. It captures page/referrer paths and selected resource context, which may contain identifiers even after query strings and fragments are stripped. Optional `sampleRate` controls collection. The runtime is opinionated about what *not* to capture — see [why-signal.md](https://github.com/jonnybmc/signal/blob/main/docs/why-signal.md) for the deliberate exclusions.

## Going beyond the SDK

The SDK is just the collection layer. The full story:

1. **Install Signal** — events flow on the next page load
2. **Land them somewhere** — GA4 + BigQuery, your own warehouse, or a callback that hands them to your existing pipeline
3. **Run a URL-builder query** — Signal ships [BigQuery SQL templates](https://github.com/jonnybmc/signal/blob/main/docs/ga4-bigquery-url-builder.sql) that turn warehouse rows into a hosted report URL
4. **Share the URL** — recipients see your real-user performance gap at `signal.stroma.design/r/...`, no login required

The hosted report stops at proof. It shows who's affected, how big the gap is, and where performance becomes poor — not why or how to fix it. That keeps the artifact honest and the file size small.

The report app also exports a [self-contained offline evidence brief](https://github.com/jonnybmc/signal/blob/main/docs/offline-evidence-brief.md). This is an app feature, not a fifth SDK entry point. Hosted URLs expose their query data to hosting logs; offline files omit labels by default but remain readable and forwardable by anyone holding a copy.

## Docs

- **[Why Signal exists](https://github.com/jonnybmc/signal/blob/main/docs/why-signal.md)** — what gap it fills and what it deliberately doesn't do
- **[Marketer quickstart](https://github.com/jonnybmc/signal/blob/main/docs/marketer-quickstart.md)** — non-technical walkthrough, GTM-first
- **[Setup guide for engineers](https://github.com/jonnybmc/signal/blob/main/docs/client-integrations.md)** — the three paths above with more detail
- **[Production report automation](https://github.com/jonnybmc/signal/blob/main/docs/production-report-automation.md)** — keeping the hosted URL fresh from BigQuery
- **[Public API reference](https://github.com/jonnybmc/signal/blob/main/docs/public-api-v0.1.md)** — every export and field
- **[Technical reference](https://github.com/jonnybmc/signal/blob/main/docs/signal-technical-reference.md)** — schemas, thresholds, browser support matrix

## Verification

This package is published with [npm provenance attestation](https://docs.npmjs.com/generating-provenance-statements). Verify after install:

```bash
npm audit signatures
# → "1 package has a verified attestation"
```

That confirms the tarball you installed was built by [this repository's publish workflow](https://github.com/jonnybmc/signal/actions/workflows/publish.yml) on the exact commit referenced in the release notes.

## License

MIT — see [LICENSE](https://github.com/jonnybmc/signal/blob/main/LICENSE).


## Optional route templates (unreleased)

The following additive API and measurement fixes are in source and are not included in the published rc4 tarball.

```ts
init({
  sinks: [yourSink],
  normalizePath: (pathname, field) => pathname.replace(/\/orders\/[^/]+/, '/orders/:id')
});
```

`normalizePath(pathname, field)` receives `page`, `referrer`, or `lcp-resource`.
Return an absolute pathname (starting with `/`) or `null` to omit it. Query,
fragment, whitespace, backslash, and protocol-relative outputs are rejected.
Errors fail closed: the required page field becomes `/`; optional URL fields
become `null`. Referrer/resource origins are preserved. It does not redact
hostnames, operator-supplied `generateTarget` labels, custom sink enrichment,
or optional identity/ad fields. Review those separately.

Path and visibility context are captured at the start of observation (after
prerender activation, and afresh on bfcache restore). Soft navigation does not
start a new measurement lifecycle. CLS reports the largest session window;
observable zero is distinct from unsupported data. INP retains at most 100
slowest interactions, selects by the total interaction count, and reports
`null` when the required rank is outside retained/observable candidates
(including 5,000+ interactions). The fallback count uses Chromium interaction
ID spacing; native `performance.interactionCount` is preferred. Signal still
flushes once on first hide/manual flush per lifecycle, not continuously for
an entire long-lived page visit.
