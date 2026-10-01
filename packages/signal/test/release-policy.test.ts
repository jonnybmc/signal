import { describe, expect, it } from 'vitest';
import { resolveNpmTag } from '../../../scripts/resolve-npm-tag.mjs';

describe('npm release policy', () => {
  it('routes RCs to next for release events and manual dispatch', () => {
    expect(resolveNpmTag('0.1.0-rc.5', 'v0.1.0-rc.5', 'true')).toBe('next');
    expect(resolveNpmTag('0.1.0-rc.5', 'v0.1.0-rc.5', '')).toBe('next');
  });
  it('routes stable versions to latest', () => {
    expect(resolveNpmTag('0.1.0', 'v0.1.0', 'false')).toBe('latest');
  });
  it.each([
    ['0.1.0-rc.5', 'v0.1.0-rc.4', 'true'],
    ['0.1.0-rc.5', 'v0.1.0-rc.5', 'false'],
    ['0.1.0', 'v0.1.0', 'true'],
    ['not-a-version', 'vnot-a-version', ''],
    ['0.1.0', undefined, '']
  ])('rejects inconsistent release inputs', (version, tag, prerelease) => {
    expect(() => resolveNpmTag(version, tag, prerelease)).toThrow();
  });
});
