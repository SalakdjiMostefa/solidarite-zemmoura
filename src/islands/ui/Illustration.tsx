/**
 * Emplacement d'image par type d'événement, en attendant les vraies photos :
 * fond très clair teinté de la couleur du type + un pictogramme au trait.
 */
import type { EventType } from '../../lib/types';
import { TYPE_META } from '../../lib/labels';

const PICTO: Record<EventType, string> = {
  ramadan: 'M172 70 A30 30 0 1 0 186 120 A24 24 0 1 1 172 70 Z',
  'aid-fitr': 'M160 66 L167 88 L190 88 L171 102 L178 124 L160 110 L142 124 L149 102 L130 88 L153 88 Z',
  'aid-kebir': 'M160 66 L167 88 L190 88 L171 102 L178 124 L160 110 L142 124 L149 102 L130 88 L153 88 Z',
  'fin-annee': 'M120 80 Q160 110 200 80 M135 90 v8 M160 97 v8 M185 90 v8',
  'action-zemoura': 'M120 120 L145 82 L160 100 L178 74 L200 120 Z',
  sport: 'M160 72 a26 26 0 1 0 0.1 0 Z M160 84 l11 8 -4 13 h-14 l-4 -13 Z',
  autre: 'M140 76 h40 v40 h-40 Z M140 96 h40',
};

export function Illustration({ type }: { type: EventType }) {
  const c = TYPE_META[type].color;
  return (
    <svg viewBox="0 0 320 200" class="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="320" height="200" fill={c} fill-opacity="0.1" />
      <path d={PICTO[type]} fill="none" stroke={c} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
  );
}
