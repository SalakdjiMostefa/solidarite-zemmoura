/** Formulaire facultatif « J'ai fait un virement » → Firestore donations_declared (lecture admin uniquement) */
import { useEffect, useRef, useState } from 'preact/hooks';
import { createPublic } from '../lib/api';
import { toast } from '../lib/toast';
import { antiSpamOk } from '../lib/antispam';
import { tr, type Lang } from '../i18n';

export default function FormDeclaration({ montant, reference, lang = 'fr' }: { montant: number; reference: string; lang?: Lang }) {
  const T = tr(lang);
  const t = T.don;
  const debut = useRef(Date.now());
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  const [m, setM] = useState(String(montant));

  useEffect(() => setM(String(montant)), [montant]);

  async function onSubmit(e: Event) {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    if (!antiSpamOk(f, debut.current)) return toast(T.commun.patienter, 'error');
    setEnvoi(true);
    try {
      await createPublic('donations_declared', {
        name: String(f.get('name') ?? '').trim().slice(0, 80),
        amount: Math.max(0, Math.min(100000, Number(String(f.get('amount')).replace(',', '.')) || 0)),
        email: String(f.get('email') ?? '').trim().slice(0, 120),
        message: String(f.get('message') ?? '').trim().slice(0, 500),
        reference: reference.slice(0, 40),
      });
      setFait(true);
      toast(t.declOk);
    } catch {
      toast(T.commun.erreurEnvoi, 'error');
    } finally {
      setEnvoi(false);
    }
  }

  if (fait)
    return (
      <div class="carte p-5 text-center">
        <p class="text-3xl" aria-hidden="true">
          🙏
        </p>
        <p class="mt-2 font-semibold">{t.declMerci}</p>
        <p class="text-sm text-encre/75">{t.declMerciTexte}</p>
      </div>
    );

  return (
    <div class="carte p-5">
      <button
        type="button"
        class="flex min-h-11 w-full items-center justify-between text-start text-lg font-medium"
        aria-expanded={ouvert}
        aria-controls="form-declaration"
        onClick={() => setOuvert(!ouvert)}
      >
        {t.declTitre}
        <span aria-hidden="true" class={`transition ${ouvert ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      <p class="text-sm text-encre/70">{t.declTexte}</p>
      {ouvert && (
        <form id="form-declaration" class="mt-4 space-y-3" onSubmit={onSubmit}>
          <div class="pot-de-miel" aria-hidden="true">
            <label>
              {t.nePasRemplir} <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div>
            <label class="etiquette" for="d-nom">
              {t.declNom}
            </label>
            <input id="d-nom" name="name" class="champ" required maxLength={80} autoComplete="name" />
          </div>
          <div>
            <label class="etiquette" for="d-montant">
              {t.montant} (€)
            </label>
            <input
              id="d-montant"
              name="amount"
              class="champ"
              dir="ltr"
              inputMode="decimal"
              required
              value={m}
              onInput={(e) => setM((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="etiquette" for="d-email">
              {t.declEmail}
            </label>
            <input id="d-email" name="email" type="email" dir="ltr" class="champ" maxLength={120} autoComplete="email" />
          </div>
          <div>
            <label class="etiquette" for="d-msg">
              {t.declMessage}
            </label>
            <textarea id="d-msg" name="message" class="champ min-h-24" maxLength={500} />
          </div>
          <p class="text-xs text-encre/60">{t.declMention}</p>
          <button class="btn btn-primaire w-full" disabled={envoi}>
            {envoi ? T.commun.envoi : T.commun.envoyer}
          </button>
        </form>
      )}
    </div>
  );
}
