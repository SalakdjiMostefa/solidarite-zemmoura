/**
 * Toasts accessibles : un seul conteneur `aria-live` (dans BaseLayout),
 * alimenté par un CustomEvent. Utilisable depuis n'importe quel îlot.
 */
export function toast(message: string, kind: 'ok' | 'error' = 'ok') {
  window.dispatchEvent(new CustomEvent('sz:toast', { detail: { message, kind } }));
}

/** Copie dans le presse-papiers avec repli pour vieux navigateurs */
export async function copyText(text: string, label = 'Copié'): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(`${label} ✓`);
}
