# Privacy Policy

_Source documentation aligned with rc5; see the versioned changelog for release history._

This document describes the privacy posture of Signal — the open-source landing-page telemetry SDK published as `@stroma-labs/signal`, the hosted `/r` Tier Report at `signal.stroma.design/r/`, and the optional Stroma-hosted endpoints the SDK can be configured to talk to.

It is written for two audiences:

- **Operators** integrating Signal into their site, who need to know what their visitors' data does and does not do.
- **Procurement and DPO reviewers** evaluating Signal as a vendor or as a sub-processor of their own analytics stack.

If you find a gap or ambiguity, [open an issue](https://github.com/jonnybmc/stroma-signal/issues) — privacy gaps are bugs.

---

## At a glance

- **Minimized performance capture, not guaranteed anonymity.** The performance runtime does not deliberately collect IP addresses, user IDs, emails, names or full user-agent strings. Page/referrer/resource paths, hostnames and custom target labels can nevertheless contain identifying data. Query/fragment stripping does not remove identifiers in path segments.
- **No cookies in the performance core.** The performance runtime does not read or set cookies. Optional modules and the operator's analytics stack have separate capture/storage behavior.
- **No cross-site tracking.** Signal does not correlate sessions across sites or across visits. Core performance events use independent event IDs; that does not make all captured fields anonymous.
- **Operator-owned data.** Performance events go to whatever sink the operator configures (the operator's own GA4 property, beacon endpoint, or warehouse). Stroma does not receive performance event data via the SDK.
- **Two optional Stroma-hosted endpoints.** A demand-signal endpoint (`/api/v1/intent`) and an install telemetry endpoint (`/api/v1/install`). Intent submission is optional; install telemetry is opt-out, with explicit disclosure. Detail below.
- **Open source.** The SDK is MIT-licensed. Every byte of capture logic is auditable in the public repository.

---

## What the Signal SDK captures

The SDK emits at most once per observed lifecycle, on the first hide/pagehide or manual flush. A bfcache restore starts a fresh lifecycle; ordinary soft navigation does not. Sampling can suppress emission. The full schema is documented in [`docs/signal-technical-reference.md`](./docs/signal-technical-reference.md). Captured fields fall into these categories:

| Category | Examples | Notes |
|---|---|---|
| Web Vitals (W3C standard) | `lcp_ms`, `fcp_ms`, `inp_ms`, `cls`, `ttfb_ms` | Standard browser-exposed performance metrics. Vendor-defined and presence-bound (some are Chromium-only). |
| Navigation Timing breakdown | `vitals.navigation_timing.dns_ms`, `tcp_ms`, `tls_ms`, `request_ms`, `response_ms` | Per-subpart timings derived from `PerformanceNavigationTiming`. |
| Connection substrate hints | `net_tier`, `context.effective_type`, `downlink`, `rtt` | Network classifier derived from TCP handshake span. No geolocation, no IP. |
| Device coarse signals | `device.cores`, `device.memory_gb`, `device.screen.*` | Standard `navigator.hardwareConcurrency`, `navigator.deviceMemory`, `window.screen.*`. Coarse-bucketed only. |
| User-agent family bucket | `context.browser` ∈ {`chrome`, `safari`, `firefox`, `edge`, `other`} | Parsed for browser family only. The full UA string is NOT captured. |
| Page context | `host`, `url`, `ref`, selected resource URLs | Page/referrer/resource origin/path context; query strings and fragments are stripped. Paths and hostnames can still contain identifiers. |
| Event metadata | `event_id`, `ts`, `v` | Per-event UUID and timestamp. |

The repository also defines an optional ad-context capture contract for click identifiers and UTM tags, documented in [`docs/ad-context-capture.md`](./docs/ad-context-capture.md). Rc5's published performance SDK does not implement an `adContextCapture` init option. Any separate operator implementation of that contract needs its own capture, consent and storage review; it is not enabled by installing this SDK.

---

## What the Signal SDK does NOT capture

The performance core has the following capture boundaries. Paths and operator-supplied values can still contain identifying data:

| Field | Status |
|---|---|
| IP address | Not collected as a performance payload field. Network requests expose the client IP to receiving infrastructure; edge logging/retention is a separate operational boundary, not an SDK guarantee. |
| Full user-agent string | Never captured. Parsed to family bucket only. |
| Email address | Never captured by the performance SDK. Captured only via the optional `/api/v1/intent` endpoint when the visitor voluntarily types one into the report's closing modal. |
| User identifier / customer ID | The performance core does not assign visitor IDs. Identifiers can still occur in paths, labels or operator enrichment; optional ad context has its own capture ID and click identifiers. |
| Geolocation | Never captured. |
| Cookies (read or write) | None in the performance core. Review optional modules and downstream analytics separately. |
| Fingerprint hashes | None computed. |
| Document title | Never captured. |
| Page content / text on page | Never captured. |
| Form input contents | Never captured. |
| URL query strings | Never captured by the performance SDK. The optional ad-context module parses known click-ID and UTM keys, then discards the rest. |
| Cross-site session correlation | Not performed by the performance core. This does not guarantee anonymity or prevent operator joins. |

Review this alongside the schema and any optional modules you enable. If you find a capture site in the source that is not justified by a field on the schema, [report it as a bug](https://github.com/jonnybmc/stroma-signal/issues).

---

## Where the data goes

The SDK's default behavior is to send events to **sinks the operator configures** — never to Stroma. Sinks are:

1. **`dataLayer` sink** (GTM / GA4). Events land in the operator's own GA4 property, then optionally export to the operator's BigQuery via Google's standard export pipeline. Stroma does not receive these events.
2. **`beacon` sink**. Events land at an HTTPS endpoint the operator specifies (their own collector or warehouse-ingest endpoint). Stroma does not receive these events.
3. **`callback` sink**. Events are passed to an in-page function. Used by operators who want to do something custom client-side. Stroma does not receive these events.

The SDK has no Stroma-hosted default sink. An operator who runs Signal with default configuration sends nothing to Stroma.

---

## What Stroma receives (and when)

Stroma operates three endpoints that may receive data, each with a distinct disclosure and consent posture:

### 1. The hosted `/r` Tier Report

`https://signal.stroma.design/r/?…`

The report payload is encoded in the URL query string. When an operator opens or shares a report URL, the recipient's browser fetches the static report bundle from Stroma's CDN. The URL parameters carry the aggregated report content; **the underlying raw events stay in the operator's warehouse**.

Stroma's edge logs (Cloudflare access logs) record the URL — which contains the encoded report. Stroma does not parse, persist, or analyse this URL beyond standard CDN log retention. Operators who consider report URLs sensitive should not share them externally.

### 2. The demand-signal endpoint `/api/v1/intent`

`https://api.stroma.design/api/v1/intent`

When a reader of `/r` submits the closing modal with one of the four customer-lens choices, the report's client-side code sends a small intent payload to this endpoint via `sendBeacon`. Stroma receives:

- Event kind (which choice was selected)
- Capture id (per-modal-session UUID generated client-side)
- Optional email (only if the reader voluntarily typed one)
- Optional cadence / pill_id / freeform text (only if relevant to the chosen lens)
- Request metadata is visible to the receiving infrastructure. Server-side storage and edge-log retention are separate from the client payload; this source review does not verify operational logging settings.

The endpoint's purpose is to measure demand for downstream offerings without requiring the operator to instrument anything additional. Email is universally optional — capturing intent in aggregate is the primary purpose; email is the affordance for direct follow-up where the reader wants it.

### 3. The install-telemetry endpoint `/api/v1/install`

`https://api.stroma.design/api/v1/install`

When a developer runs `npx @stroma-labs/signal init`, the CLI wizard sends anonymous install telemetry. Stroma receives:

- Framework + framework version (e.g. `next-app-router`, `16.2.4`)
- Sink choice (`dataLayer` / `beacon` / `callback` / `undecided`)
- Sample rate
- Package manager (`npm` / `pnpm` / `yarn` / `bun`)
- Node version (e.g. `v22.4.0`, capped at 16 chars)
- OS family (`darwin` / `linux` / `win32` / `other`)
- CLI version
- Anonymous `install_capture_id` (UPSERT key per CLI invocation)
- Outcome (`completed` / `aborted` / `error`) and a coarse error category if applicable

Stroma does NOT receive: project name, file paths, file contents, free text, emails, hostnames, full user-agent string.

Opt-out is supported via three mechanisms:
- Per-invocation: `npx @stroma-labs/signal init --no-telemetry`
- Persistent environment variable: `STROMA_TELEMETRY=0`
- Industry standard: `DO_NOT_TRACK=1`

The wizard auto-disables silently in CI / non-TTY environments. A first-run disclosure surfaces the telemetry behaviour before any data is sent.

---

## Sub-processors

The full list of sub-processors that touch any Stroma-side endpoint or hosted surface is maintained at [`docs/sub-processors.md`](./docs/sub-processors.md). The list is reviewed on a quarterly cadence and after any architectural change.

Operators may subscribe to sub-processor changes by watching that file on GitHub.

---

## Data retention

Retention windows for Stroma-side stored events are documented at [`docs/data-retention-sla.md`](./docs/data-retention-sla.md). Headline:

- **Performance events** captured by the SDK: not retained by Stroma at any tier. The SDK sends to operator-owned sinks only.
- **Intent events** (`/api/v1/intent`): retained for operational analytics; specific window in the SLA doc.
- **Install events** (`/api/v1/install`): retained for operational analytics; specific window in the SLA doc.
- **Cloudflare edge access logs**: retained per Cloudflare's standard log retention; Stroma does not extract additional value from these.

---

## Right to erasure

Performance events can contain identifying paths or operator enrichment. Their retention and erasure are the responsibility of the operator receiving them; Stroma has no default performance-event sink. Hosted URL queries and optional endpoint submissions are separate flows.

For data captured via the optional Stroma-hosted endpoints:

- **Install events**: capture is keyed by an anonymous UUID (`install_capture_id`) generated at CLI invocation. The SDK does not attach a user identity. To request removal of an identifiable install record, email **admin@stroma.design** with the `install_capture_id` (visible in the CLI's first-run disclosure when telemetry is enabled).
- **Intent events** with optional email: if a visitor voluntarily provided an email through the report's closing modal, Stroma will erase the corresponding row(s) on request to **admin@stroma.design**. Standard GDPR 30-day response window applies.

Detailed procedure: [`docs/right-to-erasure.md`](./docs/right-to-erasure.md).

---

## Cookies

The performance core reads and sets no cookies. The hosted `/r` report uses browser storage to remember intent submissions; cookie-free does not mean storage-free. The offline brief includes neither cookies nor browser-storage behavior.

Optional ad-context capture and downstream analytics have separate privacy requirements. Review their configuration independently of the performance core.

---

## Browser-level tracking signals honored

The install wizard honors the following environment variables:

- **`DO_NOT_TRACK=1`** (industry-standard environment variable): disables install telemetry.
- **`STROMA_TELEMETRY=0`**: disables install telemetry.

These variables disable CLI telemetry; they are not a browser consent API. Operators must control when performance collection starts according to their own consent and privacy requirements.

---

## Consent regime alignment

This SDK cannot determine whether a deployment requires consent. Captured paths/labels, optional identifiers, analytics destinations and downstream joins all matter. Review the configured data flow with your privacy owner; do not infer consent exemption from cookie-free collection or stripped query strings.

The optional ad-context capture module captures ad-click identifiers (e.g. `gclid`), which are personal data under several regimes when joined to other identifiers. Operators enabling this module should ensure their consent posture supports the capture. Signal's `provenance.consent_state` field surfaces the operator's Google Consent Mode v2 state at capture time so downstream filtering by consent is straightforward.

---

## Breach notification

In the event of a security incident affecting any Stroma-hosted endpoint or stored data:

- Stroma will acknowledge a reported incident within 48 hours.
- A mitigation plan will be communicated within 7 days.
- Material breaches affecting operator data will be disclosed to affected operators within 72 hours of confirmation (aligned with GDPR Article 33 timing).

Vulnerability reporting procedure: [`SECURITY.md`](./SECURITY.md).

---

## Changes to this policy

This policy is versioned alongside the source repository. Material changes will be announced in [`CHANGELOG.md`](./CHANGELOG.md) and surfaced in the relevant SDK release notes.

Historical versions are accessible via the file's git history.

---

## Contact

Questions, concerns, or requests: **admin@stroma.design**

Security disclosures: see [`SECURITY.md`](./SECURITY.md).


## Offline evidence brief

The current source adds a dedicated HTML download generated in the browser. See the [offline brief guide](./docs/offline-evidence-brief.md) for availability, local export and sharing instructions. Original aggregate JSON is preferred; compact report URLs can round
or omit detail. The downloaded file contains a fresh allowlisted projection of
aggregate measurements. Domain and top-page route labels are omitted by default;
an explicit checkbox includes them. Unknown warning text is withheld to avoid
copying identifiers, with a visible notice to review the original source.
Aggregate values themselves may still be sensitive.

The file includes inline CSS and system fonts, with no JavaScript, remote assets,
forms, network requests, browser-storage writes, authentication, or database.
It remains readable with JavaScript disabled and can be printed to PDF. This
applies to the exported file: opening the hosted `/r?...` URL still transmits
its query data to the host and Cloudflare access logs. Hosted optional intent
telemetry is tied to form submission, not passive report viewing; its code and
storage behavior are not included in the offline brief.

Anyone holding a downloaded copy can read and forward it. It is a fixed snapshot,
not a revocable link or access-controlled document. There is no refresh service.
The brief states the aggregate generation time and source window length; the
contract does not supply exact window start/end timestamps.

Core collection captures entry page/referrer paths and selected LCP resource
paths. Query/fragment removal does not remove identifiers in path segments. The
rc5 optional `normalizePath` hook can replace paths with operator route templates;
it does not anonymise hosts, custom target labels, or customer-added identity
fields. Raw events remain with the customer's configured sinks; hosted report
query logging is a separate data flow.
