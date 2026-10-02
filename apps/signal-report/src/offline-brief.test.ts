import { SIGNAL_FRESHNESS_UNKNOWN_WARNING, signalReportScenarioFixtures } from '@stroma-labs/signal-contracts';
import { describe, expect, it } from 'vitest';
import { buildOfflineBriefModel, renderOfflineBrief } from './offline-brief';

const firstFixture = signalReportScenarioFixtures[0];
if (!firstFixture) throw new Error('Missing fixture');

describe('offline evidence brief', () => {
  it.each(signalReportScenarioFixtures)('renders $id with warnings and no active content', (fixture) => {
    const html = renderOfflineBrief(fixture.aggregate);
    expect(html).toContain('Engineering handoff');
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain('@media print');
    expect(html).not.toMatch(/<(script|form|iframe|img|link)\b|\b(src|href)=|localStorage|sendBeacon|bootReport/);
    expect(html).not.toContain(fixture.aggregate.domain);
    if (fixture.aggregate.top_page_path && fixture.aggregate.top_page_path !== '/')
      expect(html).not.toContain(fixture.aggregate.top_page_path);
    expect(html).toContain(String(fixture.aggregate.sample_size));
  });

  it('drops identifiers and arbitrary text from bytes, preserving the existence of withheld warnings', () => {
    const aggregate = structuredClone(firstFixture.aggregate);
    aggregate.domain = 'private-customer.example';
    aggregate.top_page_path = '/customers/secret-person';
    aggregate.warnings.push('secret-person@example.test', 'coverage_marginal');
    Object.assign(aggregate, { privateNote: 'SECRET', unexpected: { token: 'secret-person' } });
    const html = renderOfflineBrief(aggregate);
    expect(html).not.toMatch(/private-customer|secret-person|SECRET/);
    expect(html).toContain('additional source warning(s) withheld');
    expect(html).toContain('Coverage is close to the minimum');
  });

  it('includes only explicitly requested, escaped labels', () => {
    const aggregate = structuredClone(firstFixture.aggregate);
    aggregate.top_page_path = '/<script>alert("secret")</script>';
    const html = renderOfflineBrief(aggregate, { includeSiteLabels: true });
    expect(html).toContain(aggregate.domain);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('does not invent freshness for a legacy URL and discloses URL fidelity', () => {
    const aggregate = structuredClone(firstFixture.aggregate);
    aggregate.warnings.push(SIGNAL_FRESHNESS_UNKNOWN_WARNING);
    const model = buildOfflineBriefModel(aggregate, { source: 'report_url' });
    expect(model.generatedAt).toBeNull();
    expect(model.source).toContain('rounded or omitted');
    expect(renderOfflineBrief(aggregate)).toContain('Generated Unknown');
  });
});

it('preserves navigation observation counts and true zero while retaining missing values', () => {
  const aggregate = structuredClone(firstFixture.aggregate);
  const zero = { observations: 100, p25: 0, p50: 0, p75: 0 };
  const missing = { observations: 5, p25: null, p50: null, p75: null };
  aggregate.navigation_timing_story = {
    subparts: {
      dns_ms: { observations: 80, p25: 5.2, p50: 10.5, p75: 25.75 },
      tcp_ms: zero,
      tls_ms: zero,
      redirect_ms: zero,
      service_worker_ms: missing,
      request_to_first_byte_ms: zero,
      request_to_final_headers_ms: zero,
      response_download_ms: zero,
      nav_ttfb_ms: zero,
      connection_ttfb_ms: zero,
      activation_adjusted_ttfb_ms: missing
    },
    dominant_ttfb_subpart: null,
    dominant_ttfb_subpart_strict_observations: 0,
    next_hop_protocol_histogram: { h2: 100, h3: 0, 'http/1.1': 0, other: 0 },
    provenance_roll_up: {
      early_hints_share_pct: 0,
      activation_adjusted_share_pct: 0,
      timing_redacted_suspected_share_pct: 0
    }
  };
  const model = buildOfflineBriefModel(aggregate);
  expect(model.navigation[0]).toMatchObject({ observations: 80, p75: 25.75 });
  expect(model.navigation.find((row) => row.part === 'tcp ms')?.p75).toBe(0);
  expect(model.navigation.find((row) => row.part === 'service worker ms')?.p75).toBeNull();
  expect(renderOfflineBrief(aggregate)).toContain('25.75');
});
