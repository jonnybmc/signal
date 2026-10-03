# Offline evidence brief

The report app can export a self-contained `signal-evidence-brief.html` for a review or engineering handoff. This companion-app feature is documented in rc5, alongside the separately published SDK; it is not a new SDK entry point. The existing hosted URL format remains compatible.

## Export from original aggregate JSON

1. Open `/build/` in the report app. For local processing, run `pnpm dev:report` from an already installed checkout and open `http://localhost:4174/build/`.
2. Choose **Aggregate JSON** and replace the synthetic fixture with your validated `SignalAggregateV1`. This input expects an aggregate, not raw event rows or a SQL diagnostic string.
3. Leave **Include site and route labels in the downloaded file** unchecked unless recipients need those labels and you intend to disclose them.
4. Select **Download evidence brief**. The app validates the current input before exporting. You do not need to generate or open a hosted URL first. Valid JSON can still export when it is too large for the URL encoder.
5. Open the downloaded HTML locally. Check sample size, generation time, coverage and limitations before forwarding it. Copy the **Engineering handoff** text into your existing ticket, or use the browser's Print command to save a PDF.

Original JSON is preferred because compact URLs can round values and omit optional detail. Editing builder inputs clears previous links, copy feedback and decoded previews; regenerate or revalidate a URL before copying it.

## Export from an existing report URL

In `/build/`, choose **Report URL**, paste a full valid URL, and select **Download evidence brief**. Alternatively, open the hosted report and use the download control under **Take the evidence with you**. The file labels its URL-derived source and warns about lost detail; it cannot reconstruct fields that were not encoded.

Opening a hosted `/r?...` URL sends its query string, including encoded aggregate data, to the hosting infrastructure and Cloudflare access logs. A later offline download does not remove that exposure. For sensitive source data, use the local builder with original aggregate JSON and avoid opening or sharing a hosted report URL. The builder and hosted shell themselves require JavaScript; the exported file does not.

## What the file includes

- Allowlisted aggregate measurements, sample/coverage information, cohort metric counts, available interaction and navigation evidence, limitations and investigation prompts.
- The aggregate's generation time, or an explicit unknown value, and source window length. The contract does not provide exact start/end timestamps. Generation time is not the time you clicked Download.
- Domain and top-page path only when explicitly selected. Labels are escaped as text. Unknown source warning text is withheld with a visible count and a reminder to inspect the original aggregate.
- Inline CSS, system fonts, print styling and selectable handoff text. It remains readable with JavaScript disabled.

The renderer validates the canonical contract and constructs a fresh projection. It does not serialize the hosted page, `bootReport`, raw events or arbitrary source fields. No scripts, telemetry, forms, remote assets, network calls, browser-storage writes, authentication or database are included. Its content security policy blocks active/network content. These properties apply to the exported HTML, not to the hosted application's fonts, scripts or optional intent form.

## Interpretation and sharing limits

Omitting identifiers reduces disclosure; it does not guarantee anonymity. Aggregate measurements, small cohorts and optional labels may still be sensitive. Anyone holding the file can read and forward it. There is no password, access check, refresh service or revocation of downloaded copies. Regenerate and distribute a new file when the underlying evidence changes.

Missing metrics are not zero. Compare only cohorts with adequate observations and coverage, and inspect withheld warnings in the source. Timing percentiles can have different denominators and must not be summed into a causal ranking. The brief does not measure revenue, conversion impact or root cause; its handoff prompts call for further investigation.

See [privacy](../PRIVACY.md#offline-evidence-brief), [aggregation rules](./aggregation-spec.md) and [validation evidence](./rc5-validation.md#offline-evidence-review).
