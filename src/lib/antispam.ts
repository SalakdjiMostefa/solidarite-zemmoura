/**
 * Anti-spam sans cookie ni service tiers :
 *  - champ « pot de miel » (website) qui doit rester vide ;
 *  - délai minimal de 3 secondes entre l'affichage et l'envoi.
 */
export const DELAI_MIN_MS = 3000;

export function antiSpamOk(form: FormData, debut: number): boolean {
  if (String(form.get('website') ?? '').length > 0) return false;
  return Date.now() - debut >= DELAI_MIN_MS;
}
