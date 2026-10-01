import {
  deriveSampleBand,
  explainSignalAggregateIssues,
  SIGNAL_FRESHNESS_UNKNOWN_WARNING,
  SIGNAL_MIN_RACE_OBSERVATIONS,
  type SignalAggregateV1
} from '@stroma-labs/signal-contracts';
import { escapeHtml } from './render-utils';

export interface BriefOptions {
  includeSiteLabels?: boolean;
  source?: 'aggregate' | 'report_url';
}

const NETWORK_TIERS = ['urban', 'moderate', 'constrained_moderate', 'constrained', 'unknown'] as const;
const NAV_PARTS = [
  'dns_ms',
  'tcp_ms',
  'tls_ms',
  'redirect_ms',
  'service_worker_ms',
  'request_to_first_byte_ms',
  'request_to_final_headers_ms',
  'response_download_ms',
  'nav_ttfb_ms',
  'connection_ttfb_ms',
  'activation_adjusted_ttfb_ms'
] as const;
const KNOWN_WARNINGS = new Map([
  ['coverage_marginal', 'Coverage is close to the minimum reporting threshold; treat comparisons cautiously.'],
  ['Sample size below the recommended preview threshold.', 'Sample size is below the recommended preview threshold.'],
  ['Act 2 cannot render a comparable race with the current data.', 'There is insufficient comparable cohort evidence.'],
  [SIGNAL_FRESHNESS_UNKNOWN_WARNING, 'Generation time is unknown; freshness cannot be assessed.']
]);
const label = (value: string): string => value.replaceAll('_', ' ');
const number = (value: number | null | undefined): string =>
  value == null ? 'Not available' : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);

// A new projection, never a spread/serialization of the caller's aggregate.
// Unknown fields and arbitrary warning text cannot reach the exported bytes.
export function buildOfflineBriefModel(aggregate: SignalAggregateV1, options: BriefOptions = {}) {
  if (explainSignalAggregateIssues(aggregate).length)
    throw new Error('Invalid aggregate. Validate the source before exporting.');
  const warnings = aggregate.warnings
    .map((warning) => KNOWN_WARNINGS.get(warning))
    .filter((warning): warning is string => warning != null);
  const omittedWarnings = aggregate.warnings.filter((warning) => !KNOWN_WARNINGS.has(warning)).length;
  if (omittedWarnings)
    warnings.push(
      `${omittedWarnings} additional source warning(s) withheld because they may contain identifying text. Review the original aggregate before acting.`
    );
  if (aggregate.mode === 'preview') warnings.push('Preview mode: preliminary evidence, not a production conclusion.');
  if (!aggregate.experience_funnel)
    warnings.push('Legacy aggregate: measured interaction/funnel coverage is unavailable.');
  if (!aggregate.navigation_timing_story) warnings.push('Navigation timing evidence is unavailable.');
  if (aggregate.coverage.unclassified_network_share > 0)
    warnings.push(
      `${number(aggregate.coverage.unclassified_network_share)}% of the measured audience has no network classification.`
    );
  if (aggregate.race_fallback_reason) warnings.push(`Comparison limitation: ${label(aggregate.race_fallback_reason)}.`);
  const comparison = aggregate.comparison_tier;
  const rows = (['lcp', 'fcp', 'ttfb'] as const).map((metric) => {
    const urban = aggregate.vitals.urban;
    const other = aggregate.vitals.comparison;
    const comparable =
      comparison !== 'none' &&
      metric === aggregate.race_metric &&
      urban[`${metric}_observations`] >= SIGNAL_MIN_RACE_OBSERVATIONS &&
      other[`${metric}_observations`] >= SIGNAL_MIN_RACE_OBSERVATIONS &&
      urban[`${metric}_coverage`] >= 50 &&
      other[`${metric}_coverage`] >= 50;
    return {
      metric: metric.toUpperCase(),
      urban: urban[`${metric}_ms`],
      comparison: other[`${metric}_ms`],
      urbanCount: urban[`${metric}_observations`],
      comparisonCount: other[`${metric}_observations`],
      urbanCoverage: urban[`${metric}_coverage`],
      comparisonCoverage: other[`${metric}_coverage`],
      comparable
    };
  });
  const selected = rows.find((row) => row.comparable && row.urban != null && row.comparison != null);
  const gap =
    selected && selected.urban != null && selected.comparison != null
      ? `${selected.metric} p75 is ${number(Math.abs(selected.comparison - selected.urban))} ms ${selected.comparison >= selected.urban ? 'higher' : 'lower'} for ${label(comparison)} than urban (${number(selected.comparison)} vs ${number(selected.urban)} ms).`
      : 'There is not enough comparable evidence to report a cohort experience gap.';
  const prompts: string[] = [];
  if (selected)
    prompts.push(
      `Investigate the ${selected.metric} difference between these measured cohorts. Reproduce with representative devices and connections; the aggregate does not establish a cause.`
    );
  const inp = aggregate.inp_story;
  if (inp?.dominant_phase && (inp.dominant_phase_share_pct ?? 0) >= 35)
    prompts.push(
      `Inspect interaction traces for ${label(inp.dominant_phase)}: it is the largest measured phase in ${number(inp.dominant_phase_share_pct)}% of attributed interactions. Confirm coverage before generalising.`
    );
  if (aggregate.navigation_timing_story)
    prompts.push(
      'Inspect navigation timing distributions alongside their observation counts. Connection reuse and missing timing can change which requests enter each distribution.'
    );
  if (prompts.length < 2)
    prompts.push(
      'Collect more representative observations and verify missing metric coverage before prioritising a change.'
    );
  return {
    mode: aggregate.mode === 'production' ? 'Production' : 'Preview',
    band: deriveSampleBand(aggregate.sample_size),
    generatedAt: aggregate.warnings.includes(SIGNAL_FRESHNESS_UNKNOWN_WARNING) ? null : aggregate.generated_at,
    periodDays: aggregate.period_days,
    sample: aggregate.sample_size,
    classified: aggregate.classified_sample_size,
    networkCoverage: aggregate.coverage.network_coverage,
    lcpCoverage: aggregate.coverage.lcp_coverage,
    reuseShare: aggregate.coverage.connection_reuse_share,
    excludedBackground: aggregate.coverage.excluded_background_sessions ?? null,
    site: options.includeSiteLabels ? aggregate.domain : null,
    path: options.includeSiteLabels ? aggregate.top_page_path : null,
    source:
      options.source === 'report_url'
        ? 'Decoded report URL (rounded or omitted fields may reduce fidelity).'
        : 'Original aggregate JSON.',
    network: NETWORK_TIERS.map((tier) => ({ tier: label(tier), share: aggregate.network_distribution[tier] })),
    devices: (['low', 'mid', 'high'] as const).map((tier) => ({ tier, share: aggregate.device_distribution[tier] })),
    comparison: label(comparison),
    rows,
    gap,
    navigation: (aggregate.navigation_timing_story ? NAV_PARTS : []).map((part) => ({
      part: label(part),
      observations: aggregate.navigation_timing_story?.subparts[part].observations ?? 0,
      p75: aggregate.navigation_timing_story?.subparts[part].p75 ?? null
    })),
    inpPhase: inp?.dominant_phase ? label(inp.dominant_phase) : null,
    inpShare: inp?.dominant_phase_share_pct ?? null,
    inpCoverage: aggregate.experience_funnel?.active_stages.includes('inp')
      ? NETWORK_TIERS.filter((tier) => tier !== 'unknown').map((tier) => ({
          tier: label(tier),
          coverage: aggregate.experience_funnel?.stages.inp.tiers[tier].coverage ?? 0,
          poorShare: aggregate.experience_funnel?.stages.inp.tiers[tier].poor_share ?? 0
        }))
      : [],
    warnings: [...new Set(warnings)],
    prompts: prompts.slice(0, 3)
  };
}

export function renderOfflineBrief(aggregate: SignalAggregateV1, options: BriefOptions = {}): string {
  const model = buildOfflineBriefModel(aggregate, options);
  const e = escapeHtml;
  const list = (items: string[]) => `<ul>${items.map((item) => `<li>${e(item)}</li>`).join('')}</ul>`;
  const generated = model.generatedAt == null ? 'Unknown' : new Date(model.generatedAt).toISOString();
  const windowLabel = `${number(model.periodDays)} ${model.periodDays === 1 ? 'day' : 'days'}`;
  const handoff = `Signal evidence brief • ${model.mode} • ${model.band} sample band\nGenerated: ${generated}; source window length: ${windowLabel} (exact boundaries not supplied).\n${model.sample} measured sessions; ${model.classified} classified. Network coverage ${model.networkCoverage}%; LCP coverage ${model.lcpCoverage}%.\n${model.gap}\n${model.prompts.join('\n')}\nLimitations: ${model.warnings.join(' ') || 'Review coverage for each metric.'}\nNo measured revenue, conversion impact, or causal diagnosis. Snapshot only; anyone holding it can read and forward it.`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; connect-src 'none'; script-src 'none'; img-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">
<title>Signal evidence brief</title><style>
*{box-sizing:border-box}body{margin:0;background:#f1f3ef;color:#182b28;font:16px/1.6 system-ui,-apple-system,sans-serif}main{max-width:1060px;margin:auto;padding:48px 28px}header{border-top:6px solid #206b58;padding-top:24px}h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.1;letter-spacing:-.04em;margin:12px 0}h2{font-size:1.4rem;margin:0 0 16px}h3{font-size:1rem}.eyebrow{text-transform:uppercase;letter-spacing:.15em;font-size:.75rem;font-weight:700}.lede{font-size:1.3rem;max-width:800px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.card,section{background:#fff;border:1px solid #cbd6cd;border-radius:12px;padding:24px;margin:24px 0}.card{margin:0}.value{font-size:2rem;font-weight:650;display:block}.muted{color:#52635e;font-size:.9rem}.notice{border-left:5px solid #966321;background:#fff9ec}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;vertical-align:top;padding:10px 8px;border-bottom:1px solid #dce3dc}th{font-weight:650}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:.9rem}li{margin:8px 0}footer{font-size:.85rem}p{overflow-wrap:anywhere}.table-wrap{overflow-x:auto}@media(max-width:650px){main{padding:24px 14px}.cards{grid-template-columns:1fr}section{padding:18px}th,td{padding:8px 4px}}@media print{@page{size:A4;margin:14mm}body{background:white;font-size:10pt}main{padding:0;max-width:none}h1{font-size:28pt}.card,section{border-radius:0;margin:12px 0;padding:12px}.cards{display:flex}.card{flex:1}h2,h3{break-after:avoid}tr,.card,section,header,footer{break-inside:avoid}thead{display:table-header-group}.table-wrap{overflow:visible}pre{white-space:pre-wrap}footer{border-top:1px solid #aaa}}
</style></head><body><main>
<header><p class="eyebrow">Signal / Evidence brief</p><h1>Measured experience.<br>Ready for investigation.</h1><p class="lede">${e(model.gap)}</p><p>${e(model.mode)} · ${e(model.band)} sample band · Generated ${e(generated)}</p>${model.site != null ? `<p>Site label: ${e(model.site)}${model.path ? ` · Route label: ${e(model.path)}` : ''}</p>` : '<p class="muted">Site and route labels omitted.</p>'}</header>
<div class="cards"><div class="card"><span class="value">${number(model.sample)}</span>measured sessions</div><div class="card"><span class="value">${windowLabel}</span>source window length</div><div class="card"><span class="value">${number(model.networkCoverage)}%</span>network classification coverage</div></div>
<section class="notice"><h2>Read this evidence in context</h2><p>${e(model.source)} Generation time is not a verified measurement end time; exact window boundaries are not supplied. This file is a fixed snapshot and never refreshes.</p>${list(model.warnings.length ? model.warnings : ['No source warnings were supplied. Coverage limitations still apply.'])}<p>No causal diagnosis, lost revenue, conversion impact, or predicted uplift is measured here.</p></section>
<section><h2>Audience and coverage</h2><p>${number(model.classified)} classified sessions; LCP coverage ${number(model.lcpCoverage)}%; connection reuse ${number(model.reuseShare)}%; excluded background sessions: ${number(model.excludedBackground)}.</p><div class="table-wrap"><table><thead><tr><th>Network cohort</th><th>Measured audience share</th></tr></thead><tbody>${model.network.map((row) => `<tr><td>${e(row.tier)}</td><td>${number(row.share)}%</td></tr>`).join('')}</tbody></table></div><p>Device tier shares: ${model.devices.map((row) => `${e(row.tier)} ${number(row.share)}%`).join(' · ')}. These are hardware tiers, not mobile/desktop labels.</p></section>
<section><h2>Load experience by cohort</h2><p>p75 timings in milliseconds. Observation counts and metric coverage are shown independently for urban and ${e(model.comparison)} cohorts. Values without enough comparable coverage are descriptive only.</p><div class="table-wrap"><table><thead><tr><th>Metric</th><th>Urban p75 / count / coverage</th><th>${e(model.comparison)} p75 / count / coverage</th><th>Comparison</th></tr></thead><tbody>${model.rows.map((row) => `<tr><th>${e(row.metric)}</th><td>${number(row.urban)} ms / ${number(row.urbanCount)} / ${number(row.urbanCoverage)}%</td><td>${number(row.comparison)} ms / ${number(row.comparisonCount)} / ${number(row.comparisonCoverage)}%</td><td>${row.comparable ? 'Selected, sufficient coverage' : 'No comparison claim'}</td></tr>`).join('')}</tbody></table></div></section>
<section><h2>Interaction evidence</h2><p>Dominant attributed INP phase: ${e(model.inpPhase ?? 'Not available')}; phase share: ${number(model.inpShare)}${model.inpShare == null ? '' : '%'}. Attribution describes measured timing, not a root cause.</p>${model.inpCoverage.length ? `<table><thead><tr><th>Cohort</th><th>INP coverage</th><th>Poor share among observed</th></tr></thead><tbody>${model.inpCoverage.map((row) => `<tr><td>${e(row.tier)}</td><td>${number(row.coverage)}%</td><td>${number(row.poorShare)}%</td></tr>`).join('')}</tbody></table>` : '<p>Comparable INP coverage is unavailable. Missing interactions are not evidence of fast responsiveness.</p>'}</section>
<section><h2>Navigation timing evidence</h2>${model.navigation.length ? `<p>Subparts can have different denominators; do not sum their p75 values or infer a causal ranking.</p><table><thead><tr><th>Subpart</th><th>p75 (ms)</th><th>Observations</th></tr></thead><tbody>${model.navigation.map((row) => `<tr><td>${e(row.part)}</td><td>${number(row.p75)}</td><td>${number(row.observations)}</td></tr>`).join('')}</tbody></table>` : '<p>Navigation timing evidence is unavailable in this source. Missing timing is not zero latency. Collect sufficient comparable observations before investigating individual subparts.</p>'}</section>
<section><h2>Next investigations</h2>${list(model.prompts)}</section>
<section><h2>Engineering handoff</h2><p class="muted">Select and copy the text below into your existing ticket. Use your browser’s Print command to save a PDF.</p><pre>${e(handoff)}</pre></section>
<footer>Generated locally from allowlisted aggregate measurements. No scripts, remote assets, forms, storage, or network calls are included. Site labels are optional; aggregate measurements can still be sensitive. Anyone holding this file can read and forward it. Copies cannot be revoked.</footer>
</main></body></html>`;
}

export function downloadOfflineBrief(aggregate: SignalAggregateV1, options: BriefOptions = {}): void {
  const url = URL.createObjectURL(
    new Blob([renderOfflineBrief(aggregate, options)], { type: 'text/html;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'signal-evidence-brief.html';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
