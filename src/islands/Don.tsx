/**
 * Page de don : virement bancaire SEPA direct ou carte bancaire (HelloAsso).
 * Montants rapides, choix de l'action → référence, coordonnées + copier, QR code SEPA (EPC),
 * bouton direct HelloAsso, et formulaire facultatif « J'ai fait un virement ».
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import QRCode from 'qrcode';
import { getDonationSettings, getPublishedEvents } from '../lib/api';
import { DEMO_DONATION } from '../lib/demo-data';
import type { DonationSettings } from '../lib/types';
import { epcPayload, formatIban } from '../lib/sepa';
import { copyText } from '../lib/toast';
import { formatEuro, typeLabel } from '../lib/labels';
import { titreEv } from '../lib/contenu';
import { tr, type Lang } from '../i18n';
import FormDeclaration from './FormDeclaration';

interface Action {
  ref: string;
  label: string;
}

export default function Don({ lang = 'fr' }: { lang?: Lang }) {
  const T = tr(lang);
  const t = T.don;
  const fixes: Action[] = [
    { ref: 'DON-ZEMMOURA', label: t.actionUtile },
    { ref: 'COUFFIN', label: t.actionCouffins },
  ];
  const [settings, setSettings] = useState<DonationSettings>(DEMO_DONATION);
  const [actions, setActions] = useState<Action[]>(fixes);
  const [montant, setMontant] = useState<number>(25);
  const [libre, setLibre] = useState('');
  const [ref, setRef] = useState('DON-ZEMMOURA');
  const [qr, setQr] = useState('');
  const [mode, setMode] = useState<'virement' | 'cb'>('virement');

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const m = Number(p.get('montant'));
    if (m > 0) {
      setMontant(m);
      setLibre(String(m));
    }
    const r = p.get('ref');
    if (r) setRef(r.toUpperCase().slice(0, 35));

    getDonationSettings().then(setSettings);
    getPublishedEvents()
      .then((evs) => {
        const ext = evs
          .filter((e) => e.endAt >= Date.now() && e.donationRef)
          .map((e) => ({ ref: e.donationRef!, label: `${typeLabel(e.type, lang)} — ${titreEv(e, lang).texte}` }));
        const toutes = [...fixes, ...ext];
        if (r && !toutes.some((a) => a.ref === r.toUpperCase())) toutes.push({ ref: r.toUpperCase(), label: r.toUpperCase() });
        setActions(toutes);
      })
      .catch(() => {});
  }, []);

  const impactDe = (a: DonationSettings['amounts'][number]) => (lang === 'ar' && a.impactAr ? a.impactAr : a.impact);
  const impact = useMemo(() => {
    const exact = settings.amounts.find((a) => a.value === montant);
    if (exact) return impactDe(exact);
    const inf = [...settings.amounts].reverse().find((a) => a.value <= montant);
    return inf ? t.depasse(impactDe(inf)) : t.chaqueEuro;
  }, [montant, settings]);

  // Régénère le QR à chaque changement
  useEffect(() => {
    const payload = epcPayload({ name: settings.holder, iban: settings.iban, bic: settings.bic, amount: montant, reference: ref });
    QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#231B16', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [montant, ref, settings]);

  const choisir = (v: number) => {
    setMontant(v);
    setLibre('');
  };

  const lignes: [string, string, string][] = [
    [t.titulaire, settings.holder, settings.holder],
    ['IBAN', formatIban(settings.iban), settings.iban.replace(/\s/g, '')],
    ['BIC', settings.bic, settings.bic],
    [t.montant, formatEuro(montant), String(montant)],
    [t.referenceLabel, ref, ref],
  ];

  const helloAssoUrl = settings.helloAssoUrl || 'https://www.helloasso.com/associations/solidarite-zemmoura';

  return (
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div class="space-y-8">
        {/* 1. Montant */}
        <section class="carte p-5 sm:p-6" aria-labelledby="t-montant">
          <h2 id="t-montant" class="text-2xl font-medium">
            <span class="me-2 text-terracotta-fonce">1.</span>
            {t.etape1}
          </h2>
          <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {settings.amounts.map((a) => (
              <button
                type="button"
                aria-pressed={montant === a.value && !libre}
                onClick={() => choisir(a.value)}
                class={`min-h-14 rounded-xl border text-xl font-medium transition ${
                  montant === a.value && !libre ? 'border-encre bg-encre text-white' : 'border-sable bg-white hover:border-encre/40'
                }`}
              >
                {a.value} €
              </button>
            ))}
          </div>
          <label class="etiquette mt-4" for="libre">
            {t.autreMontant}
          </label>
          <input
            id="libre"
            class="champ text-lg"
            inputMode="decimal"
            dir="ltr"
            placeholder={t.exemple}
            value={libre}
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value.replace(',', '.');
              setLibre(v);
              const n = parseFloat(v);
              if (n > 0) setMontant(Math.round(n * 100) / 100);
            }}
          />
          <p class="mt-4 rounded-xl bg-safran-clair/60 p-3 font-medium text-encre" aria-live="polite">
            {impact}
          </p>
          {settings.taxReceipt && <p class="mt-3 text-sm text-encre/80">{t.impot(formatEuro(montant), formatEuro(montant * 0.34))}</p>}
        </section>

        {/* 2. Action */}
        <section class="carte p-5 sm:p-6" aria-labelledby="t-action">
          <h2 id="t-action" class="text-2xl font-medium">
            <span class="me-2 text-terracotta-fonce">2.</span>
            {t.etape2}
          </h2>
          <div class="mt-4 space-y-2">
            {actions.map((a) => (
              <label
                class={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 transition ${
                  ref === a.ref ? 'border-encre bg-pierre' : 'border-sable bg-white'
                }`}
              >
                <input type="radio" name="action" class="h-5 w-5 accent-encre" checked={ref === a.ref} onChange={() => setRef(a.ref)} />
                <span class="flex-1">{a.label}</span>
                <span class="font-mono text-xs text-encre/60" dir="ltr">
                  {a.ref}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* 3. Choix du mode de paiement */}
        <section id="paiement" class="carte scroll-mt-24 p-5 sm:p-6" aria-labelledby="t-mode">
          <h2 id="t-mode" class="text-2xl font-medium">
            <span class="me-2 text-terracotta-fonce">3.</span>
            {t.modeDon}
          </h2>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('virement')}
              class={`flex flex-col rounded-xl border p-4 text-start transition ${
                mode === 'virement' ? 'border-emerald-fonce bg-emerald-fonce/5 shadow-sm' : 'border-sable bg-white hover:border-encre/40'
              }`}
            >
              <div class="flex items-center justify-between">
                <span class="font-semibold text-encre">{t.parVirement}</span>
                <span class={`h-4 w-4 rounded-full border-2 ${mode === 'virement' ? 'border-emerald-fonce bg-emerald-fonce' : 'border-sable'}`} />
              </div>
              <span class="mt-1 text-xs text-encre/70">{t.parVirementDesc}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('cb')}
              class={`flex flex-col rounded-xl border p-4 text-start transition ${
                mode === 'cb' ? 'border-emerald-fonce bg-emerald-fonce/5 shadow-sm' : 'border-sable bg-white hover:border-encre/40'
              }`}
            >
              <div class="flex items-center justify-between">
                <span class="font-semibold text-encre">{t.parCarte}</span>
                <span class={`h-4 w-4 rounded-full border-2 ${mode === 'cb' ? 'border-emerald-fonce bg-emerald-fonce' : 'border-sable'}`} />
              </div>
              <span class="mt-1 text-xs text-encre/70">{t.parCarteDesc}</span>
            </button>
          </div>

          {mode === 'cb' ? (
            <div class="mt-6 rounded-2xl border border-emerald-fonce/20 bg-pierre/60 p-5 text-center">
              <p class="font-medium text-encre sm:text-lg">
                {formatEuro(montant)} · {actions.find((a) => a.ref === ref)?.label ?? ref}
              </p>
              <p class="mt-2 text-sm text-encre/75">{t.helloAssoInfo}</p>
              <a
                href={helloAssoUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-don mx-auto mt-5 inline-flex text-base"
              >
                {t.donnerParCarte(formatEuro(montant))} ↗
              </a>
            </div>
          ) : (
            <div class="mt-6">
              <p class="text-sm text-encre/80">{t.consigne(formatEuro(montant), ref)}</p>
              <dl class="mt-4 space-y-3">
                {lignes.map(([k, affiche, copie]) => (
                  <div class="flex items-center gap-3 rounded-xl bg-creme p-3">
                    <div class="min-w-0 flex-1">
                      <dt class="text-xs font-semibold uppercase tracking-wider text-encre/60">{k}</dt>
                      <dd class="break-all font-mono text-[15px] font-semibold sm:text-base" dir="ltr" style={{ textAlign: 'start' }}>
                        {affiche}
                      </dd>
                    </div>
                    <button type="button" class="btn btn-secondaire shrink-0 px-4 text-sm" onClick={() => copyText(copie, `${k} — ${T.commun.copie}`)}>
                      {T.commun.copier}
                    </button>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      </div>

      <aside class="space-y-6 lg:sticky lg:top-24 lg:self-start">
        {mode === 'virement' && (
          <div class="carte p-5 text-center">
            <h2 class="text-xl font-medium">{t.qrTitre}</h2>
            <p class="mt-1 text-sm text-encre/75">{t.qrTexte}</p>
            <div
              class="mx-auto mt-4 w-full max-w-[240px] rounded-xl border border-sable bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
              role="img"
              aria-label={t.qrAria(formatEuro(montant), settings.holder, ref)}
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <p class="mt-3 text-xs text-encre/60">{t.qrNote}</p>
            <p class="mt-3 rounded-lg bg-safran-clair/40 p-2 text-xs font-medium text-encre/80">{t.aideMobile}</p>
          </div>
        )}
        <FormDeclaration montant={montant} reference={ref} lang={lang} />
      </aside>
    </div>
  );
}
