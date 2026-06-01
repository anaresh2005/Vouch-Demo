/**
 * Opens an external URL in a new tab, escaping iframe sandboxing.
 * Uses a dynamically created anchor element which reliably opens
 * in a new tab even from within sandboxed iframes.
 */
export function openExternal(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
