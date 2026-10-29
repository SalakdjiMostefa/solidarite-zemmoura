/**
 * Remplit Firestore avec des données d'exemple :
 * 6 événements (passés et à venir), stats et réglages.
 *
 * Prérequis : une clé de compte de service (Console Firebase > Paramètres > Comptes de service
 * > Générer une nouvelle clé privée) enregistrée dans ./service-account.json (jamais commitée).
 *
 * Lancement :  npm run seed
 * Option    :  npm run seed -- --superadmin=UID_DU_COMPTE   (crée le premier superadmin)
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { DEMO_EVENTS, DEMO_STATS, DEMO_DONATION, DEMO_CONTACT, DEMO_THEME } from '../src/lib/demo-data';

const chemin = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
const compte = JSON.parse(readFileSync(chemin, 'utf8'));
initializeApp({ credential: cert(compte) });
const db = getFirestore();

async function main() {
  console.log(`→ Projet : ${compte.project_id}`);

  const batch = db.batch();
  for (const ev of DEMO_EVENTS) {
    const { id, ...data } = ev;
    batch.set(db.collection('events').doc(id), {
      ...JSON.parse(JSON.stringify(data)), // retire les undefined
      startAt: Timestamp.fromMillis(ev.startAt),
      endAt: Timestamp.fromMillis(ev.endAt),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: 'seed',
    });
  }
  batch.set(db.doc('stats/global'), DEMO_STATS);
  batch.set(db.doc('settings/donation'), DEMO_DONATION);
  batch.set(db.doc('settings/contact'), DEMO_CONTACT);
  batch.set(db.doc('settings/theme'), DEMO_THEME);
  await batch.commit();
  console.log(`✓ ${DEMO_EVENTS.length} événements, stats et réglages écrits`);

  // Premier superadmin (optionnel) : --superadmin=UID
  const arg = process.argv.find((a) => a.startsWith('--superadmin='));
  if (arg) {
    const uid = arg.split('=')[1];
    const user = await getAuth().getUser(uid);
    await db.doc(`admins/${uid}`).set({ email: user.email, name: user.displayName ?? '', role: 'superadmin', createdAt: FieldValue.serverTimestamp() });
    console.log(`✓ ${user.email} est maintenant superadmin`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('✗ Erreur :', e);
    process.exit(1);
  });
