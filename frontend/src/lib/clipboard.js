/**
 * Copies text to the clipboard, working even outside a secure context.
 * `navigator.clipboard` only exists on HTTPS/localhost — production
 * currently runs on a plain-HTTP IP with no domain/TLS cert yet, where
 * `navigator.clipboard` is undefined and calling it throws. Falls back to
 * the older `execCommand('copy')` path (via a hidden textarea), which
 * doesn't require a secure context, so copy buttons keep working either
 * way. Returns true/false instead of throwing so callers can just branch
 * on the result.
 */
export async function copyText(text) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path below
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
