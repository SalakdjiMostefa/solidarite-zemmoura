// Affiche l'UID d'un compte Authentication à partir de son e-mail : npx tsx scripts/trouver-admin.ts email@exemple.fr
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const compte = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json', 'utf8'));
initializeApp({ credential: cert(compte) });
const email = process.argv[2];
getAuth()
  .getUserByEmail(email)
  .then((u) => console.log(`UID=${u.uid} (créé le ${u.metadata.creationTime})`))
  .catch((e) => console.log(`INTROUVABLE : ${e.code}`))
  .finally(() => process.exit(0));
