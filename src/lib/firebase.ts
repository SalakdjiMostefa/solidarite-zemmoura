/**
 * Initialisation Firebase (SDK modulaire).
 * Chargé uniquement par les îlots qui en ont besoin, pour garder le JS initial léger.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { FIREBASE_CONFIG, FIREBASE_READY } from '../config/site';

let app: FirebaseApp | undefined;

function getApp(): FirebaseApp {
  if (!FIREBASE_READY) throw new Error('Firebase non configuré : remplissez le fichier .env');
  if (!app) app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
  return app;
}

export const db = (): Firestore => getFirestore(getApp());
export const auth = (): Auth => getAuth(getApp());
export { FIREBASE_READY };
