/**
 * Accès aux données publiques.
 * - Si Firebase est configuré : lecture Firestore.
 * - Sinon : données de démonstration (pour voir le site tout de suite).
 * Firestore est importé dynamiquement pour ne charger le SDK que lorsque c'est nécessaire.
 */
import { FIREBASE_READY } from '../config/site';
import {
  DEMO_CONTACT,
  DEMO_DONATION,
  DEMO_EVENTS,
  DEMO_STATS,
  DEMO_THEME,
} from './demo-data';
import type {
  AssoEvent,
  ContactSettings,
  DonationSettings,
  GlobalStats,
  ThemeSettings,
} from './types';

/** Convertit un document Firestore en AssoEvent (Timestamp → ms) */
export function toEvent(id: string, data: Record<string, any>): AssoEvent {
  const ms = (v: any) => (v?.toMillis ? v.toMillis() : typeof v === 'number' ? v : Date.parse(v ?? '') || 0);
  return {
    gallery: [],
    ...data,
    id,
    slug: data.slug ?? id,
    startAt: ms(data.startAt),
    endAt: ms(data.endAt),
    createdAt: data.createdAt ? ms(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? ms(data.updatedAt) : undefined,
  } as unknown as AssoEvent;
}

async function fs() {
  const [{ db }, firestore] = await Promise.all([import('./firebase'), import('firebase/firestore')]);
  return { db: db(), ...firestore };
}

/** Tous les événements publiés (triés par date) */
export async function getPublishedEvents(): Promise<AssoEvent[]> {
  if (!FIREBASE_READY) return [...DEMO_EVENTS].sort((a, b) => a.startAt - b.startAt);
  const { db, collection, query, where, orderBy, getDocs } = await fs();
  const snap = await getDocs(query(collection(db, 'events'), where('status', '==', 'published'), orderBy('startAt', 'asc')));
  return snap.docs.map((d) => toEvent(d.id, d.data())).filter((e) => !e.hidden);
}

/** Un événement publié par son slug */
export async function getEventBySlug(slug: string): Promise<AssoEvent | null> {
  if (!FIREBASE_READY) return DEMO_EVENTS.find((e) => e.slug === slug) ?? null;
  const { db, collection, query, where, limit, getDocs } = await fs();
  const snap = await getDocs(
    query(collection(db, 'events'), where('status', '==', 'published'), where('slug', '==', slug), limit(1)),
  );
  const doc = snap.docs[0];
  return doc ? toEvent(doc.id, doc.data()) : null;
}

/** Lecture d'un document de réglages avec valeur par défaut */
async function getDocOr<T>(path: [string, string], fallback: T): Promise<T> {
  if (!FIREBASE_READY) return fallback;
  try {
    const { db, doc, getDoc } = await fs();
    const snap = await getDoc(doc(db, path[0], path[1]));
    return snap.exists() ? ({ ...fallback, ...snap.data() } as T) : fallback;
  } catch (err) {
    console.warn('Lecture Firestore impossible', path, err);
    return fallback;
  }
}

export const getStats = () => getDocOr<GlobalStats>(['stats', 'global'], DEMO_STATS);
export const getDonationSettings = () => getDocOr<DonationSettings>(['settings', 'donation'], DEMO_DONATION);
export const getContactSettings = () => getDocOr<ContactSettings>(['settings', 'contact'], DEMO_CONTACT);
export const getThemeSettings = () => getDocOr<ThemeSettings>(['settings', 'theme'], DEMO_THEME);
/** Abonnement temps réel aux stats (pour le pont animé). Renvoie une fonction de désabonnement. */
export function watchStats(cb: (s: GlobalStats) => void): () => void {
  if (!FIREBASE_READY) {
    cb(DEMO_STATS);
    return () => {};
  }
  let unsub = () => {};
  let cancelled = false;
  fs().then(({ db, doc, onSnapshot }) => {
    if (cancelled) return;
    unsub = onSnapshot(doc(db, 'stats', 'global'), (snap) => {
      cb({ ...DEMO_STATS, ...(snap.data() as GlobalStats | undefined) });
    });
  });
  return () => {
    cancelled = true;
    unsub();
  };
}

/** Création publique (formulaires) : bénévoles & déclarations de virement */
export async function createPublic(
  col: 'volunteers' | 'donations_declared',
  data: Record<string, unknown>,
): Promise<void> {
  if (!FIREBASE_READY) {
    console.info('[mode démo] envoi simulé', col, data);
    await new Promise((r) => setTimeout(r, 600));
    return;
  }
  const { db, collection, addDoc, serverTimestamp } = await fs();
  await addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });
}
