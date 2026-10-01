export type SignalPathField = 'page' | 'referrer' | 'lcp-resource';
export type SignalPathNormalizer = (pathname: string, field: SignalPathField) => string | null;

/** Apply an operator route template without restoring query/hash data. Fail closed. */
export function normalizeCapturedUrl(
  value: string | null,
  field: SignalPathField,
  normalize?: SignalPathNormalizer
): string | null {
  if (value == null || !normalize) return value;
  try {
    const absolute = !value.startsWith('/');
    const parsed = new URL(value, 'https://signal.invalid');
    const path = normalize(parsed.pathname, field);
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[?#\\\s]/.test(path))
      return null;
    return absolute ? `${parsed.origin}${path}` : path;
  } catch {
    return null;
  }
}
