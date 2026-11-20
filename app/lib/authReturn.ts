// Accept only root-relative same-origin navigation, never schemes or protocol-relative URLs.
export function safeReturnTo(value: string | null | undefined): string | null {
  const unsafe = (text: string) => Array.from(text).some(c => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127 || c.charCodeAt(0) === 92);
  if (!value || value.length > 2048 || !value.startsWith('/') || value.startsWith('//') || unsafe(value)) return null;
  try {
    const decoded = decodeURIComponent(value);
    // Reject encoded path separators and nested escapes; do not allow encoded
    // auth/API segments to bypass the normalized-path denylist. Query encoding stays valid.
    const decodedPath = decoded.split(/[?#]/)[0];
    if (decoded.startsWith('//') || unsafe(decoded) || /%[0-9a-f]{2}/i.test(decodedPath) ||
        /%2f|%5c/i.test(value.split(/[?#]/)[0])) return null;
    const normalized = new URL(decodedPath, 'https://return.invalid');
    if (['auth', 'login', 'logout', 'api'].includes(normalized.pathname.split('/')[1].toLowerCase())) return null;
    const url = new URL(value, 'https://return.invalid');
    if (url.origin !== 'https://return.invalid' || ['auth', 'login', 'logout', 'api'].includes(url.pathname.split('/')[1])) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}
