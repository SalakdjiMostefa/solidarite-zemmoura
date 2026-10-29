/** Formulaire « Devenir bénévole » → Firestore volunteers (création publique, lecture admin) */
import { useRef, useState } from 'preact/hooks';
import { createPublic } from '../lib/api';
import { toast } from '../lib/toast';
import { antiSpamOk } from '../lib/antispam';
import { tr, lien, type Lang } from '../i18n';

export default function FormBenevole({ lang = 'fr' }: { lang?: Lang }) {
  const T = tr(lang);
  const t = T.benevole;
  // Les disponibilités sont toujours enregistrées en français (lisibles dans l'admin)
  const disposFr = tr('fr').benevole.listeDispos;
  const debut = useRef(Date.now());
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);

  async function onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const f = new FormData(form);
    if (!antiSpamOk(f, debut.current)) return toast(T.commun.patienter, 'error');
    if (!f.get('consent')) return toast(t.consentementManquant, 'error');
    setEnvoi(true);
    try {
      await createPublic('volunteers', {
        name: String(f.get('name') ?? '').trim().slice(0, 80),
        phone: String(f.get('phone') ?? '').trim().slice(0, 30),
        city: String(f.get('city') ?? '').trim().slice(0, 80),
        availability: f.getAll('dispo').map(String).slice(0, 10),
        message: String(f.get('message') ?? '').trim().slice(0, 500),
      });
      setFait(true);
    } catch {
      toast(T.commun.erreurEnvoi, 'error');
    } finally {
      setEnvoi(false);
    }
  }

  if (fait)
    return (
      <div class="carte p-8 text-center" role="status">
        <p class="text-5xl" aria-hidden="true">
          🤝
        </p>
        <h2 class="mt-3 text-2xl font-medium">{t.merci}</h2>
        <p class="mt-2 text-encre/75">{t.merciTexte}</p>
      </div>
    );

  return (
    <form class="carte space-y-4 p-5 sm:p-6" onSubmit={onSubmit}>
      <div class="pot-de-miel" aria-hidden="true">
        <label>
          {T.don.nePasRemplir} <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <label class="etiquette" for="b-nom">
          {t.nom}
        </label>
        <input id="b-nom" name="name" class="champ" required maxLength={80} autoComplete="name" />
      </div>
      <div>
        <label class="etiquette" for="b-tel">
          {t.tel}
        </label>
        <input id="b-tel" name="phone" type="tel" dir="ltr" class="champ" required maxLength={30} autoComplete="tel" inputMode="tel" />
      </div>
      <div>
        <label class="etiquette" for="b-ville">
          {t.ville}
        </label>
        <input id="b-ville" name="city" class="champ" required maxLength={80} autoComplete="address-level2" placeholder={t.villeExemple} />
      </div>
      <fieldset>
        <legend class="etiquette">{t.dispos}</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          {t.listeDispos.map((d, i) => (
            <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-sable bg-white px-3 has-[:checked]:border-encre">
              <input type="checkbox" name="dispo" value={disposFr[i]} class="h-5 w-5 accent-encre" />
              {d}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label class="etiquette" for="b-msg">
          {t.mot}
        </label>
        <textarea id="b-msg" name="message" class="champ min-h-24" maxLength={500} placeholder={t.motExemple} />
      </div>
      <label class="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" class="mt-1 h-5 w-5 shrink-0 accent-encre" required />
        <span>
          {t.consentement}{' '}
          <a class="underline" href={`${lien('/mentions-legales', lang)}#confidentialite`}>
            {t.politique}
          </a>
          ).
        </span>
      </label>
      <button class="btn btn-primaire w-full" disabled={envoi}>
        {envoi ? T.commun.envoi : t.bouton}
      </button>
    </form>
  );
}
