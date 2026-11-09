/** Admin (superadmin) — réglages : banque & dons, contacts, thème saisonnier */
import { useEffect, useState } from 'preact/hooks';
import type { AssociationSettings, ContactSettings, DonationSettings, ThemeSettings, ThemeMode } from '../../lib/types';
import { toast } from '../../lib/toast';
import { seasonFor } from '../../lib/season';
import { readDoc, writeDoc } from './store';

type Section = 'association' | 'dons' | 'contact' | 'theme';

export default function ReglagesAdmin() {
  const [section, setSection] = useState<Section>('association');
  return (
    <section>
      <h1 class="mb-4 text-2xl font-medium">Réglages</h1>
      <div class="defile-x mb-5">
        {(
          [
            ['association', '🏛️ Association'],
            ['dons', '🏦 Banque & dons'],
            ['contact', '☎️ Contacts'],
            ['theme', '🌙 Thème'],
          ] as const
        ).map(([k, l]) => (
          <button
            type="button"
            aria-pressed={section === k}
            onClick={() => setSection(k)}
            class={`puce ${section === k ? 'border-emerald-fonce bg-emerald-fonce text-white' : 'border-sable bg-white'}`}
          >
            {l}
          </button>
        ))}
      </div>
      {section === 'association' && <Association />}
      {section === 'dons' && <Dons />}
      {section === 'contact' && <Contact />}
      {section === 'theme' && <Theme />}
    </section>
  );
}

/** Petit utilitaire : formulaire avec bouton Enregistrer */
function Formulaire({ onSave, children }: { onSave: () => Promise<void>; children: preact.ComponentChildren }) {
  const [envoi, setEnvoi] = useState(false);
  return (
    <form
      class="carte max-w-2xl space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnvoi(true);
        try {
          await onSave();
          toast('Réglages enregistrés ✓');
        } catch {
          toast("Échec de l'enregistrement", 'error');
        } finally {
          setEnvoi(false);
        }
      }}
    >
      {children}
      <button class="btn btn-primaire w-full" disabled={envoi}>
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

function Champ({ id, label, value, onInput, ...rest }: { id: string; label: string; value: string; onInput: (v: string) => void } & Record<string, unknown>) {
  return (
    <div>
      <label class="etiquette" for={id}>
        {label}
      </label>
      <input id={id} class="champ" value={value} onInput={(e) => onInput((e.target as HTMLInputElement).value)} {...rest} />
    </div>
  );
}

function Zone({ id, label, aide, value, onInput, ar }: { id: string; label: string; aide?: string; value: string; onInput: (v: string) => void; ar?: boolean }) {
  return (
    <div>
      <label class="etiquette" for={id}>
        {label}
      </label>
      <textarea
        id={id}
        class="champ min-h-32"
        maxLength={2000}
        value={value}
        dir={ar ? 'rtl' : undefined}
        lang={ar ? 'ar' : undefined}
        onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
      />
      {aide && <p class="mt-1 text-xs text-encre/60">{aide}</p>}
    </div>
  );
}

/** Textes de la page « L'association » et informations légales */
function Association() {
  const [a, setA] = useState<AssociationSettings | null>(null);
  useEffect(() => {
    readDoc('settings/association').then(setA);
  }, []);
  if (!a) return <p>Chargement…</p>;
  const maj = (patch: Partial<AssociationSettings>) => setA({ ...a, ...patch });
  return (
    <Formulaire onSave={() => writeDoc('settings/association', a)}>
      <p class="text-sm text-encre/70">
        Ces informations s'affichent sur la page « L'association » et dans les mentions légales. Un champ vide affiche « À compléter ».
      </p>

      <fieldset class="space-y-3">
        <legend class="text-lg font-medium">Notre histoire</legend>
        <Zone id="a-h1" label="1er paragraphe" value={a.histoire1} onInput={(v) => maj({ histoire1: v })} />
        <Zone
          id="a-h2"
          label="2e paragraphe"
          aide="Date de création, fondateurs, première action… Remplacez le texte entre crochets."
          value={a.histoire2}
          onInput={(v) => maj({ histoire2: v })}
        />
        <details class="rounded-xl bg-creme p-3">
          <summary class="min-h-11 cursor-pointer content-center text-sm font-semibold">Version arabe (facultative)</summary>
          <p class="my-2 text-xs text-encre/60">
            Vide = l'ancienne traduction arabe s'affiche. Si vous changez le texte français, pensez à mettre à jour l'arabe.
          </p>
          <div class="space-y-3">
            <Zone id="a-h1-ar" label="الفقرة الأولى" value={a.histoire1Ar ?? ''} onInput={(v) => maj({ histoire1Ar: v })} ar />
            <Zone id="a-h2-ar" label="الفقرة الثانية" value={a.histoire2Ar ?? ''} onInput={(v) => maj({ histoire2Ar: v })} ar />
          </div>
        </details>
      </fieldset>

      <fieldset class="space-y-3">
        <legend class="text-lg font-medium">Informations légales</legend>
        <div class="grid gap-3 sm:grid-cols-2">
          <Champ id="a-rna" label="N° RNA" placeholder="W421234567" value={a.rna} onInput={(v) => maj({ rna: v.toUpperCase() })} class="champ font-mono" />
          <Champ id="a-siret" label="SIRET (facultatif)" placeholder="123 456 789 00012" value={a.siret} onInput={(v) => maj({ siret: v })} class="champ font-mono" />
        </div>
        <Champ
          id="a-president"
          label="Président(e) — directeur(trice) de la publication"
          placeholder="Prénom Nom"
          value={a.president}
          onInput={(v) => maj({ president: v })}
        />
        <Champ id="a-adresse" label="Adresse du siège" value={a.address} onInput={(v) => maj({ address: v })} />
        <Champ id="a-banque" label="Nom de la banque" value={a.bankName} onInput={(v) => maj({ bankName: v })} />
        <p class="text-xs text-encre/60">Le titulaire du compte, l'IBAN et le BIC se modifient dans « 🏦 Banque & dons ».</p>
      </fieldset>
    </Formulaire>
  );
}

function Dons() {
  const [d, setD] = useState<DonationSettings | null>(null);
  useEffect(() => {
    readDoc('settings/donation').then(setD);
  }, []);
  if (!d) return <p>Chargement…</p>;
  return (
    <Formulaire onSave={() => writeDoc('settings/donation', d)}>
      <Champ id="r-titulaire" label="Titulaire du compte (exactement comme sur le RIB)" value={d.holder} onInput={(v) => setD({ ...d, holder: v })} required />
      <Champ id="r-iban" label="IBAN" value={d.iban} onInput={(v) => setD({ ...d, iban: v.toUpperCase() })} required class="champ font-mono" />
      <Champ id="r-bic" label="BIC" value={d.bic} onInput={(v) => setD({ ...d, bic: v.toUpperCase() })} required class="champ font-mono" />
      <Champ id="r-helloasso" label="Lien HelloAsso (dons par carte bancaire)" placeholder="https://www.helloasso.com/associations/..." value={d.helloAssoUrl ?? ''} onInput={(v) => setD({ ...d, helloAssoUrl: v })} />
      <label class="flex min-h-11 items-center gap-3">
        <input type="checkbox" class="h-6 w-6 accent-emerald-fonce" checked={d.taxReceipt} onChange={(e) => setD({ ...d, taxReceipt: (e.target as HTMLInputElement).checked })} />
        <span>
          Afficher « réduction d'impôt de 66 % »
          <span class="block text-xs text-encre/60">Seulement si l'association est habilitée à émettre des reçus fiscaux.</span>
        </span>
      </label>
      <fieldset class="space-y-3">
        <legend class="etiquette">Montants rapides et message d'impact</legend>
        {d.amounts.map((a, i) => (
          <div class="grid grid-cols-[96px_1fr] gap-2 rounded-xl bg-creme p-2">
            <input
              class="champ row-span-2 w-24 shrink-0"
              inputMode="numeric"
              aria-label={`Montant ${i + 1}`}
              value={a.value}
              onInput={(e) => {
                const amounts = [...d.amounts];
                amounts[i] = { ...a, value: Number((e.target as HTMLInputElement).value) || 0 };
                setD({ ...d, amounts });
              }}
            />
            <input
              class="champ"
              aria-label={`Impact du montant ${i + 1}`}
              value={a.impact}
              onInput={(e) => {
                const amounts = [...d.amounts];
                amounts[i] = { ...a, impact: (e.target as HTMLInputElement).value };
                setD({ ...d, amounts });
              }}
            />
            <input
              class="champ"
              dir="rtl"
              lang="ar"
              placeholder="بالعربية (اختياري)"
              aria-label={`Impact du montant ${i + 1} en arabe`}
              value={a.impactAr ?? ''}
              onInput={(e) => {
                const amounts = [...d.amounts];
                amounts[i] = { ...a, impactAr: (e.target as HTMLInputElement).value };
                setD({ ...d, amounts });
              }}
            />
          </div>
        ))}
      </fieldset>
    </Formulaire>
  );
}

function Contact() {
  const [c, setC] = useState<ContactSettings | null>(null);
  useEffect(() => {
    readDoc('settings/contact').then(setC);
  }, []);
  if (!c) return <p>Chargement…</p>;
  return (
    <Formulaire onSave={() => writeDoc('settings/contact', c)}>
      <Champ id="c-wa" label="WhatsApp (format international sans +, ex. 33612345678)" value={c.whatsapp} onInput={(v) => setC({ ...c, whatsapp: v.replace(/\D/g, '') })} inputMode="numeric" />
      <Champ id="c-tel" label="Téléphone" value={c.phone} onInput={(v) => setC({ ...c, phone: v })} type="tel" />
      <Champ id="c-tel2" label="Second téléphone (facultatif)" value={c.phone2 ?? ''} onInput={(v) => setC({ ...c, phone2: v })} type="tel" />
      <Champ id="c-email" label="Email" value={c.email} onInput={(v) => setC({ ...c, email: v })} type="email" />
      <Champ id="c-fb" label="Page Facebook (lien)" value={c.facebook} onInput={(v) => setC({ ...c, facebook: v })} type="url" />
      <Champ id="c-yt" label="YouTube (lien)" value={c.youtube ?? ''} onInput={(v) => setC({ ...c, youtube: v })} type="url" />
      <Champ id="c-tt" label="TikTok (lien)" value={c.tiktok ?? ''} onInput={(v) => setC({ ...c, tiktok: v })} type="url" />
    </Formulaire>
  );
}

function Theme() {
  const [t, setT] = useState<ThemeSettings | null>(null);
  useEffect(() => {
    readDoc('settings/theme').then(setT);
  }, []);
  if (!t) return <p>Chargement…</p>;
  const auto = seasonFor();
  const options: [ThemeMode, string, string][] = [
    ['auto', 'Automatique', `Selon la date (aujourd'hui : ${auto === 'ramadan' ? 'Ramadan' : auto === 'aid' ? 'Aïd' : auto === 'fin-annee' ? "fin d'année" : 'aucun décor'})`],
    ['off', 'Désactivé', 'Jamais de décor saisonnier'],
    ['ramadan', 'Forcer Ramadan', 'Croissant, lanternes, bleu nuit'],
    ['aid', 'Forcer Aïd', 'Décor festif'],
    ['fin-annee', "Forcer fin d'année", 'Guirlandes'],
  ];
  return (
    <Formulaire
      onSave={async () => {
        await writeDoc('settings/theme', t);
        try {
          localStorage.setItem('sz-theme-mode', t.mode);
        } catch {}
      }}
    >
      <fieldset class="space-y-2">
        <legend class="etiquette">Décor saisonnier du site</legend>
        {options.map(([k, l, d]) => (
          <label class={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${t.mode === k ? 'border-emerald-fonce bg-emerald/5' : 'border-sable bg-white'}`}>
            <input type="radio" name="theme" class="h-5 w-5 accent-emerald-fonce" checked={t.mode === k} onChange={() => setT({ mode: k })} />
            <span>
              <span class="block font-bold">{l}</span>
              <span class="block text-xs text-encre/60">{d}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </Formulaire>
  );
}
