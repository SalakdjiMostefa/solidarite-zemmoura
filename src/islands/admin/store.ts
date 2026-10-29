/**
 * Couche de données de l'espace admin.
 * - Firebase configuré → Firestore + Firebase Auth.
 * - Sinon → « mode démo » en mémoire (n'importe quel email/mot de passe), pour essayer l'interface.
 */
import { FIREBASE_READY, FIREBASE_CONFIG } from '../../config/site';
import { toEvent } from '../../lib/api';
import { DEMO_CONTACT, DEMO_DONATION, DEMO_EVENTS, DEMO_STATS, DEMO_THEME } from '../../lib/demo-data';
import { autoDonationRef, slugify } from '../../lib/labels';
import type {
  AdminProfile,
  AdminRole,
  AssoEvent,
  ContactSettings,
  DonationSettings,
  GlobalStats,
  ThemeSettings,
} from '../../lib/types';

export const DEMO = !FIREBASE_READY;

export interface InboxItem {
  id: string;
  createdAt: number;
  handled?: boolean;
  [k: string]: unknown;
}

/* ───────────────────────── Mode démo (mémoire) ───────────────────────── */
const mem = {
  events: structuredClone(DEMO_EVENTS) as AssoEvent[],
  stats: { ...DEMO_STATS },
  donation: structuredClone(DEMO_DONATION),
  contact: { ...DEMO_CONTACT },
  theme: { ...DEMO_THEME },
  admins: [{ uid: 'demo', email: 'demo@exemple.fr', name: 'Admin démo', role: 'superadmin' }] as AdminProfile[],
  volunteers: [
    { id: 'v1', createdAt: Date.now() - 86400000, name: 'Karim B.', phone: '+33 6 00 00 00 01', city: 'Saint-Chamond', availability: ['Week-end'] },
  ] as InboxItem[],
  donations_declared: [
    { id: 'd1', createdAt: Date.now() - 3600000, name: 'Nadia', amount: 50, email: '', message: 'Bon courage !', reference: 'RAMADAN2027' },
  ] as InboxItem[],
};
const pause = () => new Promise<void>((r) => setTimeout(r, 250));

/* ───────────────────────── Firebase (chargé à la demande) ───────────────────────── */
async function fb() {
  const [{ db, auth }, fs, au] = await Promise.all([import('../../lib/firebase'), import('firebase/firestore'), import('firebase/auth')]);
  return { db: db(), auth: auth(), fs, au };
}

/* ───────────────────────── Authentification ───────────────────────── */
export async function login(email: string, password: string): Promise<void> {
  if (DEMO) return pause();
  const { auth, au } = await fb();
  await au.signInWithEmailAndPassword(auth, email, password);
}

export async function logout(): Promise<void> {
  if (DEMO) return;
  const { auth, au } = await fb();
  await au.signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  if (DEMO) return pause();
  const { auth, au } = await fb();
  await au.sendPasswordResetEmail(auth, email);
}

/** Observe la session ; renvoie le profil admin (ou null si non connecté / non autorisé) */
export function onSession(cb: (p: AdminProfile | null | 'refuse') => void, demoConnecte: boolean): () => void {
  if (DEMO) {
    cb(demoConnecte ? mem.admins[0] : null);
    return () => {};
  }
  let unsub = () => {};
  fb().then(({ auth, au, db, fs }) => {
    unsub = au.onAuthStateChanged(auth, async (user) => {
      if (!user) return cb(null);
      const snap = await fs.getDoc(fs.doc(db, 'admins', user.uid)).catch(() => null);
      if (!snap?.exists()) return cb('refuse');
      const d = snap.data();
      cb({ uid: user.uid, email: user.email ?? '', name: d.name, role: d.role as AdminRole });
    });
  });
  return () => unsub();
}

/* ───────────────────────── Événements ───────────────────────── */
export async function listEvents(): Promise<AssoEvent[]> {
  if (DEMO) {
    await pause();
    return [...mem.events].sort((a, b) => b.startAt - a.startAt);
  }
  const { db, fs } = await fb();
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'events'), fs.orderBy('startAt', 'desc')));
  return snap.docs.map((d) => toEvent(d.id, d.data()));
}

/** Slug unique à partir du titre */
async function slugUnique(title: string, startAt: number, exclureId?: string): Promise<string> {
  const base = slugify(title) || `evenement-${new Date(startAt).getFullYear()}`;
  const existants = (await listEvents()).filter((e) => e.id !== exclureId).map((e) => e.slug);
  let slug = base;
  let i = 2;
  while (existants.includes(slug)) slug = `${base}-${i++}`;
  return slug;
}

export type EventInput = Omit<AssoEvent, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'createdBy'>;

/** Nettoie un objet : Firestore refuse les valeurs `undefined` */
function propre<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

export async function saveEvent(input: EventInput, uid: string, id?: string): Promise<AssoEvent> {
  const slug = await slugUnique(input.title, input.startAt, id);
  const donationRef = input.donationRef?.trim() || autoDonationRef(input.type, input.startAt);
  const data = propre({ ...input, slug, donationRef });

  if (DEMO) {
    await pause();
    if (id) {
      const i = mem.events.findIndex((e) => e.id === id);
      mem.events[i] = { ...mem.events[i], ...data, updatedAt: Date.now() };
      return mem.events[i];
    }
    const ev: AssoEvent = { ...data, id: slug, createdAt: Date.now(), updatedAt: Date.now(), createdBy: uid };
    mem.events.push(ev);
    return ev;
  }

  const { db, fs } = await fb();
  const payload = {
    ...data,
    startAt: fs.Timestamp.fromMillis(input.startAt),
    endAt: fs.Timestamp.fromMillis(input.endAt),
    updatedAt: fs.serverTimestamp(),
  };
  if (id) {
    await fs.updateDoc(fs.doc(db, 'events', id), payload);
    return { ...data, id };
  }
  const ref = await fs.addDoc(fs.collection(db, 'events'), { ...payload, createdAt: fs.serverTimestamp(), createdBy: uid });
  return { ...data, id: ref.id };
}

export async function patchEvent(id: string, patch: Partial<AssoEvent>): Promise<void> {
  if (DEMO) {
    const e = mem.events.find((x) => x.id === id);
    if (e) Object.assign(e, patch);
    return pause();
  }
  const { db, fs } = await fb();
  await fs.updateDoc(fs.doc(db, 'events', id), { ...propre(patch), updatedAt: fs.serverTimestamp() });
}

export async function deleteEvent(id: string): Promise<void> {
  if (DEMO) {
    mem.events = mem.events.filter((e) => e.id !== id);
    return pause();
  }
  const { db, fs } = await fb();
  await fs.deleteDoc(fs.doc(db, 'events', id));
}

/** Duplique un événement : dates +1 an, titre avec l'année suivante, brouillon, compteurs à zéro */
export function duplicateInput(ev: AssoEvent): EventInput {
  const plusUnAn = (ms: number) => {
    const d = new Date(ms);
    d.setFullYear(d.getFullYear() + 1);
    return d.getTime();
  };
  const annee = new Date(ev.startAt).getFullYear();
  const titre = ev.title.includes(String(annee)) ? ev.title.replace(String(annee), String(annee + 1)) : ev.title;
  const startAt = plusUnAn(ev.startAt);
  const { id: _id, slug: _slug, createdAt: _c, updatedAt: _u, createdBy: _b, report: _r, ...reste } = ev;
  return {
    ...reste,
    title: titre,
    startAt,
    endAt: plusUnAn(ev.endAt),
    raisedAmount: 0,
    donationRef: autoDonationRef(ev.type, startAt),
    status: 'draft',
    hidden: false,
  };
}

/* ───────────────────────── Stats & réglages ───────────────────────── */
type DocMap = {
  'stats/global': GlobalStats;
  'settings/donation': DonationSettings;
  'settings/contact': ContactSettings;
  'settings/theme': ThemeSettings;
};

const memDocs = (): DocMap => ({
  'stats/global': mem.stats,
  'settings/donation': mem.donation,
  'settings/contact': mem.contact,
  'settings/theme': mem.theme,
});

export async function readDoc<K extends keyof DocMap>(path: K): Promise<DocMap[K]> {
  const defaut = structuredClone(memDocs()[path]);
  if (DEMO) return defaut;
  const { db, fs } = await fb();
  const [c, d] = path.split('/');
  const snap = await fs.getDoc(fs.doc(db, c, d));
  return snap.exists() ? ({ ...defaut, ...snap.data() } as DocMap[K]) : defaut;
}

export async function writeDoc<K extends keyof DocMap>(path: K, value: DocMap[K]): Promise<void> {
  if (DEMO) {
    if (path === 'stats/global') mem.stats = value as GlobalStats;
    if (path === 'settings/donation') mem.donation = value as DonationSettings;
    if (path === 'settings/contact') mem.contact = value as ContactSettings;
    if (path === 'settings/theme') mem.theme = value as ThemeSettings;
    return pause();
  }
  const { db, fs } = await fb();
  const [c, d] = path.split('/');
  await fs.setDoc(fs.doc(db, c, d), { ...value, updatedAt: fs.serverTimestamp() });
}

/* ───────────────────────── Boîte de réception ───────────────────────── */
export async function listInbox(col: 'volunteers' | 'donations_declared'): Promise<InboxItem[]> {
  if (DEMO) {
    await pause();
    return [...mem[col]];
  }
  const { db, fs } = await fb();
  const snap = await fs.getDocs(fs.query(fs.collection(db, col), fs.orderBy('createdAt', 'desc'), fs.limit(200)));
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, id: d.id, createdAt: data.createdAt?.toMillis?.() ?? 0 };
  });
}

export async function setHandled(col: 'volunteers' | 'donations_declared', id: string, handled: boolean): Promise<void> {
  if (DEMO) {
    const it = mem[col].find((x) => x.id === id);
    if (it) it.handled = handled;
    return;
  }
  const { db, fs } = await fb();
  await fs.updateDoc(fs.doc(db, col, id), { handled });
}

/* ───────────────────────── Gestion des admins (superadmin) ───────────────────────── */
export async function listAdmins(): Promise<AdminProfile[]> {
  if (DEMO) return [...mem.admins];
  const { db, fs } = await fb();
  const snap = await fs.getDocs(fs.collection(db, 'admins'));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AdminProfile, 'uid'>) }));
}

/**
 * Crée un compte admin SANS déconnecter le superadmin :
 * on utilise une seconde instance Firebase (pas besoin de Cloud Functions).
 */
export async function createAdmin(email: string, password: string, name: string, role: AdminRole): Promise<void> {
  if (DEMO) {
    mem.admins.push({ uid: `demo-${Date.now()}`, email, name, role });
    return pause();
  }
  const [{ initializeApp, deleteApp }, au, { db }, fs] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('../../lib/firebase'),
    import('firebase/firestore'),
  ]);
  const second = initializeApp(FIREBASE_CONFIG, `creation-${Date.now()}`);
  try {
    const cred = await au.createUserWithEmailAndPassword(au.getAuth(second), email, password);
    await fs.setDoc(fs.doc(db(), 'admins', cred.user.uid), { email, name, role, createdAt: fs.serverTimestamp() });
    await au.signOut(au.getAuth(second));
  } finally {
    await deleteApp(second);
  }
}

export async function updateAdminRole(uid: string, role: AdminRole): Promise<void> {
  if (DEMO) {
    const a = mem.admins.find((x) => x.uid === uid);
    if (a) a.role = role;
    return;
  }
  const { db, fs } = await fb();
  await fs.updateDoc(fs.doc(db, 'admins', uid), { role });
}

export async function removeAdmin(uid: string): Promise<void> {
  if (DEMO) {
    mem.admins = mem.admins.filter((a) => a.uid !== uid);
    return;
  }
  const { db, fs } = await fb();
  await fs.deleteDoc(fs.doc(db, 'admins', uid));
}
