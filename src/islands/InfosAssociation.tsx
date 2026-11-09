/**
 * Textes et infos légales de l'association, modifiables dans Admin → Réglages → Association
 * (settings/association) et Banque & dons (settings/donation).
 * Le HTML statique contient les valeurs par défaut ; elles sont remplacées dès le chargement.
 */
import { useEffect, useState } from 'preact/hooks';
import { getAssociation, getDonationSettings } from '../lib/api';
import { DEMO_ASSOCIATION, DEMO_DONATION } from '../lib/demo-data';
import { lien, tr, type Lang } from '../i18n';
import type { AssociationSettings, DonationSettings } from '../lib/types';

function useAssociation() {
  const [a, setA] = useState<AssociationSettings>(DEMO_ASSOCIATION);
  useEffect(() => {
    getAssociation().then(setA).catch(() => {});
  }, []);
  return a;
}

/** Valeur saisie, ou « À compléter » */
const ou = (v: string | undefined, lang: Lang) => v?.trim() || tr(lang).association.aCompleter;

/** Adresse du siège : traduction arabe tant que c'est l'adresse d'origine */
const adresse = (a: AssociationSettings, lang: Lang) =>
  lang === 'ar' && a.address.trim() === DEMO_ASSOCIATION.address ? 'سان شامون (42400)، فرنسا' : ou(a.address, lang);

/** « Notre histoire » — deux paragraphes */
export function Histoire({ lang = 'fr' }: { lang?: Lang }) {
  const a = useAssociation();
  const t = tr(lang).association;
  // En arabe : texte arabe saisi dans l'admin, sinon la traduction d'origine du site
  const paragraphes = lang === 'ar' ? [a.histoire1Ar?.trim() || t.histoire1, a.histoire2Ar?.trim() || t.histoire2] : [a.histoire1, a.histoire2];
  return (
    <div class="mt-4 space-y-4 text-lg leading-relaxed">
      {paragraphes
        .filter((p) => p?.trim())
        .map((p) => (
          <p class="whitespace-pre-line">{p}</p>
        ))}
    </div>
  );
}

/** Bloc « Statut légal » de la page L'association */
export function StatutLegal({ lang = 'fr' }: { lang?: Lang }) {
  const a = useAssociation();
  const [d, setD] = useState<DonationSettings>(DEMO_DONATION);
  useEffect(() => {
    getDonationSettings().then(setD).catch(() => {});
  }, []);
  const t = tr(lang).association;
  return (
    <div class="carte p-6">
      <h2 class="text-2xl font-medium">{t.statut}</h2>
      <dl class="mt-3 grid gap-2 sm:grid-cols-[200px_1fr]">
        <dt class="font-semibold">{t.forme}</dt>
        <dd>{t.formeValeur}</dd>
        <dt class="font-semibold">N° RNA</dt>
        <dd dir="ltr" class="text-start">
          {ou(a.rna, lang)}
        </dd>
        <dt class="font-semibold">SIRET</dt>
        <dd dir="ltr" class="text-start">
          {ou(a.siret, lang)}
        </dd>
        <dt class="font-semibold">{t.siege}</dt>
        <dd>{adresse(a, lang)}</dd>
        <dt class="font-semibold">{t.banque}</dt>
        <dd>{ou(a.bankName, lang)}</dd>
        <dt class="font-semibold">{t.titulaire}</dt>
        <dd>{ou(d.holder, lang)}</dd>
        <dt class="font-semibold">IBAN</dt>
        <dd class="break-all text-start font-mono text-[15px]" dir="ltr">
          {d.iban}
        </dd>
        <dt class="font-semibold">BIC</dt>
        <dd class="text-start font-mono text-[15px]" dir="ltr">
          {d.bic}
        </dd>
      </dl>
      <a href={lien('/don', lang)} class="btn btn-secondaire mt-5">
        {t.donVirement}
      </a>
    </div>
  );
}

/** Ligne « Éditeur du site » des mentions légales */
export function Editeur({ lang = 'fr', nom }: { lang?: Lang; nom: string }) {
  const a = useAssociation();
  const texte =
    lang === 'ar'
      ? `${nom}، جمعية خاضعة لقانون 1901 — رقم RNA: ${ou(a.rna, lang)} · المقرّ: ${adresse(a, lang)} · مدير النشر: ${ou(a.president, lang)}`
      : `${nom}, association loi 1901 — N° RNA : ${ou(a.rna, lang)} · Siège : ${adresse(a, lang)} · Directeur de la publication : ${ou(a.president, lang)}`;
  return <p>{texte}</p>;
}
