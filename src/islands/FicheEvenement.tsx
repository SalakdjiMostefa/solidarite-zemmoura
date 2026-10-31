/**
 * Fiche événement (URL partageable : /evenements/voir?id=slug, ou /ar/evenements/voir?id=slug).
 * Photo, galerie à balayer au doigt, infos, collecte, partage.
 */
import { useEffect, useState } from 'preact/hooks';
import { getEventBySlug } from '../lib/api';
import type { AssoEvent } from '../lib/types';
import { typeLabel, lieuLabel, formatRange, cld, whatsappShare, eventUrl, TYPE_META } from '../lib/labels';
import { titreEv, descEv, bilanEv, attrs } from '../lib/contenu';
import { tr, lien, type Lang } from '../i18n';
import { copyText } from '../lib/toast';
import { Barre } from './ui/Barre';
import { Illustration } from './ui/Illustration';
import { Carrousel } from './ui/Carrousel';
import { EtatVide } from './ui/EventCard';

export default function FicheEvenement({
  lang = 'fr',
  slug,
  initialEvent,
}: {
  lang?: Lang;
  slug?: string;
  initialEvent?: AssoEvent;
}) {
  const T = tr(lang);
  const t = T.fiche;
  const [ev, setEv] = useState<AssoEvent | null | undefined>(initialEvent);

  useEffect(() => {
    const id = slug || new URLSearchParams(location.search).get('id');
    if (!id) {
      if (!initialEvent) setEv(null);
      return;
    }
    getEventBySlug(id)
      .then((e) => {
        if (e) {
          setEv(e);
          document.title = `${titreEv(e, lang).texte} · ${T.meta.nom}`;
          document.querySelector('meta[name="description"]')?.setAttribute('content', descEv(e, lang).texte.slice(0, 155));
        } else if (!initialEvent) {
          setEv(null);
        }
      })
      .catch(() => {
        if (!initialEvent) setEv(null);
      });
  }, [slug]);

  if (ev === undefined) {
    return (
      <div class="space-y-4" aria-busy="true">
        <div class="squelette aspect-[16/9] w-full" />
        <div class="squelette h-8 w-2/3" />
        <div class="squelette h-4 w-1/2" />
        <div class="squelette h-24 w-full" />
      </div>
    );
  }
  if (ev === null) {
    return (
      <div class="space-y-6">
        <EtatVide titre={t.introuvable} texte={t.introuvableTexte} />
        <p class="text-center">
          <a href={lien('/evenements', lang)} class="btn btn-primaire">
            {t.retour}
          </a>
        </p>
      </div>
    );
  }

  const origin = typeof location !== 'undefined' ? location.origin : 'https://solidarite-zemoura.web.app';
  const url = new URL(eventUrl(ev.slug, lang), origin).href;
  const passe = ev.endAt < Date.now();
  const photos = [...(ev.coverImage ? [ev.coverImage] : []), ...ev.gallery];
  const ref = ev.donationRef ?? '';
  const titre = titreEv(ev, lang);
  const sousTitre = lang === 'fr' ? ev.titleAr : titre.lang === 'ar' ? ev.title : undefined;
  const desc = descEv(ev, lang);
  const bilan = bilanEv(ev, lang);

  return (
    <article>
      <a href={lien('/evenements', lang)} class="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-encre/70 hover:text-encre">
        <span aria-hidden="true">{T.commun.flecheRetour}</span> {t.retour}
      </a>

      {/* Galerie : carrousel (balayage, flèches, points) */}
      <div class="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-xl2">
        {photos.length > 0 ? (
          <Carrousel label={t.galerie} photos={photos.map((p, i) => ({ src: cld(p, 1200), alt: `${titre.texte} — ${i + 1}/${photos.length}` }))} />
        ) : (
          <div class="aspect-[16/9] overflow-hidden">
            <Illustration type={ev.type} />
          </div>
        )}
      </div>
      {ev.coverCredit && (
        <p class="mt-1.5 px-1 text-xs text-encre/45" dir="ltr" style={{ textAlign: 'end' }}>
          {lang === 'ar' ? 'صورة' : 'Photo'} : {ev.coverCredit}
        </p>
      )}

      <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <p class="flex items-center gap-2 text-sm text-encre/60">
            <span class="h-2 w-2 rounded-full" style={{ background: TYPE_META[ev.type].color }} aria-hidden="true" />
            {typeLabel(ev.type, lang)}
          </p>
          <h1 class="mt-2 text-3xl font-medium sm:text-4xl" {...attrs(titre)}>
            {titre.texte}
          </h1>
          {sousTitre && (
            <p class="mt-1 text-lg text-encre/55" lang={lang === 'fr' ? 'ar' : 'fr'} dir={lang === 'fr' ? 'rtl' : 'ltr'}>
              {sousTitre}
            </p>
          )}
          <ul class="mt-5 space-y-2 text-[17px]">
            <li class="flex gap-2">
              <span aria-hidden="true">📅</span>
              <span>{formatRange(ev.startAt, ev.endAt, lang)}</span>
            </li>
            <li class="flex gap-2">
              <span aria-hidden="true">📍</span>
              <span>
                {lieuLabel(ev.location, lang)}
                {ev.address ? ` — ${ev.address}` : ''}
              </span>
            </li>
            {ev.volunteersNeeded && (
              <li class="flex gap-2">
                <span aria-hidden="true">🤝</span>
                <span>
                  {t.benevoles(ev.volunteersCount)}{' '}
                  <a class="font-semibold text-emerald-fonce underline" href={lien('/benevole', lang)}>
                    {t.meProposer}
                  </a>
                </span>
              </li>
            )}
          </ul>
          <div class="mt-6 whitespace-pre-line text-[17px] leading-relaxed" {...attrs(desc)}>
            {desc.texte}
          </div>

          {passe && ev.report?.text && (
            <section class="mt-8 rounded-xl2 border-s-2 border-emerald bg-white p-5">
              <h2 class="text-2xl font-medium">{t.bilan}</h2>
              <p class="mt-2 whitespace-pre-line" {...attrs(bilan)}>
                {bilan.texte}
              </p>
              {ev.report.photos.length > 0 && (
                <div class="defile-x mt-4">
                  {ev.report.photos.map((p, i) => (
                    <img src={cld(p, 600)} alt={`${t.bilan} — ${i + 1}`} class="h-40 w-60 shrink-0 snap-start rounded-xl object-cover" loading="lazy" />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {(ev.goalAmount || !passe) && (
            <div class="carte space-y-4 p-5">
              {ev.goalAmount ? <Barre actuel={ev.raisedAmount ?? 0} objectif={ev.goalAmount} lang={lang} /> : null}
              {!passe && (
                <a href={`${lien('/don', lang)}?ref=${encodeURIComponent(ref)}#virement`} class="btn btn-don w-full">
                  {t.soutenir}
                </a>
              )}
              {ref && (
                <p class="text-center text-sm text-encre/70">
                  {t.reference} <strong class="font-mono" dir="ltr">{ref}</strong>
                </p>
              )}
            </div>
          )}
          <div class="carte p-5">
            <h2 class="mb-3 text-lg font-medium">{t.partager}</h2>
            <div class="flex flex-wrap gap-2">
              <a class="btn btn-whatsapp flex-1" href={whatsappShare(`${titre.texte} — ${T.meta.nom}\n${url}`)} target="_blank" rel="noopener">
                WhatsApp
              </a>
              <a
                class="btn flex-1 bg-[#1877F2] text-white"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener"
              >
                Facebook
              </a>
              <button type="button" class="btn btn-secondaire w-full" onClick={() => copyText(url, t.lienCopie)}>
                {t.copierLien}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
