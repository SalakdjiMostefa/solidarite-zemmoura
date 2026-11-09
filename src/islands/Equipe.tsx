/**
 * Page « L'association » — l'équipe, par sections (ex. « Responsables en France »,
 * « Responsables en Algérie »). Données gérées dans l'admin (onglet Bureau → settings/team).
 * Tant que rien n'est saisi, on affiche le bureau « à compléter ».
 */
import { useEffect, useState } from 'preact/hooks';
import { getTeam } from '../lib/api';
import { cld } from '../lib/labels';
import type { TeamMember, TeamSection } from '../lib/types';
import { tr, type Lang } from '../i18n';

const initiale = (nom: string) => (nom.trim()[0] ?? '?').toUpperCase();

function Carte({ m, lang, aCompleter }: { m: TeamMember; lang: Lang; aCompleter: string }) {
  const role = lang === 'ar' && m.roleAr ? m.roleAr : m.role;
  return (
    <div class="carte p-5 text-center">
      {m.photo ? (
        <img src={cld(m.photo, 200)} alt="" width="80" height="80" loading="lazy" class="mx-auto h-20 w-20 rounded-full border border-sable object-cover" />
      ) : (
        <div
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-sable bg-pierre font-titre text-2xl text-encre/70"
          aria-hidden="true"
        >
          {m.name ? initiale(m.name) : initiale(role)}
        </div>
      )}
      <p class="mt-3 font-semibold">{m.name || aCompleter}</p>
      <p class="text-sm text-encre/70">{role}</p>
    </div>
  );
}

export default function Equipe({ lang = 'fr' }: { lang?: Lang }) {
  const t = tr(lang).association;
  const [sections, setSections] = useState<TeamSection[] | null>(null);

  useEffect(() => {
    getTeam()
      .then((d) => setSections((d.sections ?? []).filter((s) => s.members?.length)))
      .catch(() => setSections([]));
  }, []);

  const grille = 'mt-6 grid grid-cols-2 gap-4 md:grid-cols-4';

  // Chargement : cartes vides (même hauteur, pas de saut de mise en page)
  if (sections === null)
    return (
      <div>
        <h2 class="titre-section">{t.bureau}</h2>
        <div class={grille} aria-hidden="true">
          {[0, 1, 2, 3].map(() => (
            <div class="carte h-44 animate-pulse bg-pierre/60" />
          ))}
        </div>
      </div>
    );

  // Rien de saisi dans l'admin : bureau « à compléter »
  if (sections.length === 0)
    return (
      <div>
        <h2 class="titre-section">{t.bureau}</h2>
        <div class={grille}>
          {t.roles.map((role) => (
            <Carte m={{ name: '', role }} lang={lang} aCompleter={t.aCompleter} />
          ))}
        </div>
      </div>
    );

  return (
    <div class="space-y-12">
      {sections.map((s) => (
        <div>
          <h2 class="titre-section">{lang === 'ar' && s.titleAr ? s.titleAr : s.title}</h2>
          <div class={grille}>
            {s.members.map((m) => (
              <Carte m={m} lang={lang} aCompleter={t.aCompleter} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
