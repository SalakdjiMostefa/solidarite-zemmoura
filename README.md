# Solidarité Zemmoura — تضامن زمورة

Site web de l'association **Solidarité Zemmoura** (Saint-Chamond ⇄ Zemmoura).
Astro + Tailwind CSS + îlots Preact, données Firebase Firestore, photos Cloudinary, hébergement Firebase Hosting (offre gratuite Spark).

> 💡 **Mode démo** : tant que le fichier `.env` n'a pas de clés Firebase, le site fonctionne avec des données d'exemple
> et l'espace `/admin` accepte n'importe quel email/mot de passe (les modifications ne sont pas sauvegardées).
> Pratique pour découvrir le site avant de tout configurer.

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Lancer le site en local](#2-lancer-le-site-en-local)
3. [Créer le projet Firebase](#3-créer-le-projet-firebase)
4. [Créer le compte Cloudinary](#4-créer-le-compte-cloudinary)
5. [Remplir le fichier .env](#5-remplir-le-fichier-env)
6. [Remplir la base et créer le premier superadmin](#6-remplir-la-base-et-créer-le-premier-superadmin)
7. [Déployer](#7-déployer)
8. [Brancher le nom de domaine](#8-brancher-le-nom-de-domaine)
9. [Structure du projet](#9-structure-du-projet)

---

## 1. Prérequis

- **Node.js 22** (ou 20.3+) : https://nodejs.org (version LTS).
- Un compte **Google** (pour Firebase) et un compte **Cloudinary** (gratuit).
- L'outil Firebase en ligne de commande :

```bash
npm install -g firebase-tools
```

## 2. Lancer le site en local

Dans le dossier du projet :

```bash
npm install
```

```bash
npm run dev
```

Ouvrez http://localhost:4321. Le site s'affiche en mode démo.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement automatique |
| `npm run build` | Vérification TypeScript + construction du site dans `dist/` |
| `npm run preview` | Affiche le site construit (comme en production) |
| `npm run seed` | Remplit Firestore avec les données d'exemple |
| `npm run deploy` | Construit puis déploie sur Firebase |

## 3. Créer le projet Firebase

1. Allez sur https://console.firebase.google.com puis **Ajouter un projet**. Nommez-le par exemple `solidarite-zemoura`. Google Analytics n'est pas nécessaire.
2. **Firestore** : menu *Build > Firestore Database > Créer une base de données*.
   - Emplacement : `eur3 (europe-west)`.
   - Mode : **production**. Les règles du projet seront déployées ensuite.
3. **Authentification** : menu *Build > Authentication > Commencer*.
   - Activez **Adresse e-mail/Mot de passe**.
   - Dans *Paramètres > Actions utilisateur*, **décochez « Autoriser la création de comptes »** si l'option existe : seuls les admins créent des comptes.
4. **Application web** : *Paramètres du projet (⚙️) > Vos applications > icône `</>`*.
   - Donnez un nom, **cochez Firebase Hosting**, puis validez.
   - Copiez les valeurs de `firebaseConfig` : vous en aurez besoin à l'étape 5.
5. Dans le fichier `.firebaserc`, remplacez `votre-projet` par l'identifiant du projet.
6. Connectez l'outil en ligne de commande :

```bash
firebase login
```

7. Déployez les règles de sécurité et les index :

```bash
firebase deploy --only firestore
```

## 4. Créer le compte Cloudinary

Cloudinary sert à stocker les photos, car l'offre gratuite de Firebase n'inclut pas Storage.

1. Créez un compte gratuit sur https://cloudinary.com.
2. Sur le tableau de bord, notez votre **Cloud name**.
3. Allez dans *Settings (⚙️) > Upload > Upload presets > Add upload preset*.
   - **Signing mode : Unsigned** (obligatoire).
   - Folder : `solidarite-zemoura`.
   - Facultatif : *Incoming transformation* `c_limit,w_1600` par sécurité.
   - Enregistrez, puis notez le **nom du preset**.
4. Pour le floutage des visages (`e_blur_faces`) : dans *Settings > Security*, vérifiez que **Strict transformations** est **désactivé**.

## 5. Remplir le fichier .env

Copiez `.env.example` vers `.env`. Le fichier existe déjà en local, et il n'est jamais envoyé sur Git. Remplissez ensuite :

```ini
PUBLIC_SITE_URL=https://solidarite-zemoura.web.app   # ou votre nom de domaine

PUBLIC_FIREBASE_API_KEY=...            # valeurs copiées à l'étape 3.4
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...

PUBLIC_CLOUDINARY_CLOUD_NAME=...       # étape 4
PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

PUBLIC_BANK_HOLDER=Association Solidarité Zemmoura
PUBLIC_BANK_IBAN=FR76 ....
PUBLIC_BANK_BIC=....
PUBLIC_CONTACT_EMAIL=...
PUBLIC_CONTACT_PHONE=+336...
PUBLIC_CONTACT_WHATSAPP=336...         # sans le +
PUBLIC_CONTACT_FACEBOOK=https://www.facebook.com/...
```

> Les clés `PUBLIC_FIREBASE_*` ne sont pas secrètes : elles finissent de toute façon dans le navigateur. La sécurité repose sur `firestore.rules`.
> En revanche, **ne publiez jamais** le fichier `service-account.json` de l'étape 6.

Les coordonnées bancaires et les contacts du `.env` sont des valeurs par défaut. Une fois en ligne, un superadmin peut les modifier depuis **/admin > Réglages**, sans redéployer. Ce point concerne la page Don ; les pages Contact et Aide lisent le `.env` au moment du build.

## 6. Remplir la base et créer le premier superadmin

1. **Créer votre compte** : Console Firebase > *Authentication > Utilisateurs > Ajouter un utilisateur*. Saisissez votre email et un mot de passe, puis **copiez l'UID** affiché.
2. **Clé de service** (uniquement pour le script) : *Paramètres du projet > Comptes de service > Générer une nouvelle clé privée*. Enregistrez le fichier sous `service-account.json` à la racine du projet.
3. Lancez le script, en remplaçant `VOTRE_UID` par l'UID copié :

```bash
npm run seed -- --superadmin=VOTRE_UID
```

Le script crée 6 événements d'exemple, les chiffres clés et les réglages. Il donne aussi le rôle **superadmin** à votre compte.
Ensuite, les autres membres sont ajoutés directement depuis **/admin > Équipe**.

> Sans le script, vous pouvez créer à la main dans Firestore un document `admins/VOTRE_UID` avec les champs `email` (texte) et `role` = `superadmin` (texte).

4. Supprimez ou rangez `service-account.json` en lieu sûr.

## 7. Déployer

```bash
npm run deploy
```

Le site est en ligne sur `https://<projet>.web.app`.
Pour ne redéployer que le site, sans toucher aux règles :

```bash
firebase deploy --only hosting
```

> Les événements, photos et chiffres sont lus en direct depuis Firestore : **inutile de redéployer** quand un admin publie un événement.

## 8. Brancher le nom de domaine

1. Console Firebase > *Hosting > Ajouter un domaine personnalisé*, puis saisissez par exemple `solidarite-zemoura.fr`.
2. Chez votre registraire (OVH, Gandi, IONOS…), ajoutez les enregistrements **TXT** puis **A** indiqués par Firebase.
3. Attendez la propagation, de quelques minutes à 24 h. Le certificat HTTPS est automatique.
4. Mettez `PUBLIC_SITE_URL=https://solidarite-zemoura.fr` dans `.env`, puis redéployez avec `npm run deploy`. C'est cette valeur qui sert au sitemap, au robots.txt et aux aperçus WhatsApp.

## 9. Structure du projet

```
├── astro.config.mjs        # Astro + Preact + Tailwind + PWA + sitemap
├── firebase.json           # Hosting (cache, en-têtes) + Firestore
├── firestore.rules         # Sécurité : qui lit / écrit quoi
├── firestore.indexes.json
├── .env.example
├── public/                 # logo (images/logo.png), photos, favicon, icônes PWA, og-image
├── scripts/
│   ├── seed.ts             # données d'exemple + premier superadmin
│   ├── test-calendrier.ts  # vérifie les dates (hégire, jours fériés)
│   └── generer-icones.mjs  # régénère favicon, icônes et og-image depuis public/images/logo.png
└── src/
    ├── config/site.ts      # configuration centrale (nom, contacts, banque, nav)
    ├── i18n/               # traductions FR / AR (tous les textes du site public)
    ├── views/              # pages écrites une fois, rendues en FR (/…) et en AR (/ar/…)
    ├── styles/global.css   # design system : tokens couleurs, typo, composants
    ├── layouts/BaseLayout.astro   # <head> SEO, en-tête, menu, bouton Don, pied de page
    ├── components/         # SVG : frise amazighe, montagnes, logo, décors saisonniers
    ├── lib/                # firebase, accès données, SEPA/EPC, thème saisonnier, Cloudinary…
    ├── islands/            # composants interactifs Preact (pont, dons, calendrier, listes…)
    │   └── admin/          # application d'administration
    └── pages/              # une page = une URL
```

### Langues (français / arabe)

- Le site public existe en **français** (`/…`) et en **arabe** (`/ar/…`, de droite à gauche). Le bouton « العربية / Français » de l'en-tête permet de passer de l'un à l'autre.
- Tous les textes fixes sont dans `src/i18n/index.ts` (un bloc `fr`, un bloc `ar`). Pour corriger une traduction, il suffit de modifier ce fichier.
- Chaque page est écrite une seule fois dans `src/views/`, avec un paramètre `lang`. Les fichiers de `src/pages/` et `src/pages/ar/` se contentent de l'appeler.
- Les événements ont des champs arabes facultatifs (titre, description, bilan), à remplir dans l'admin. Quand ils sont vides, la version arabe affiche le texte français.
- L'espace admin reste en français.

### Accès à l'administration

Un lien discret **🔒 Espace admin** se trouve en bas de chaque page, dans le pied de page. On peut aussi taper directement `/admin` après l'adresse du site.

### Calendrier de l'accueil

- Il affiche la date du jour en grégorien et en hégire, puis le compte à rebours vers le prochain événement de l'association, la prochaine fête musulmane et le prochain jour férié en France.
- Les fêtes suivies sont : nouvel an de l'hégire, Achoura, Mawlid, Isra wal Miraj, Ramadan, Laylat al-Qadr, Aïd al-Fitr, Arafat et Aïd al-Adha.
- Les calculs sont dans `src/lib/calendrier.ts`. Les dates de l'hégire suivent le calendrier Umm al-Qura et peuvent différer d'un jour de l'observation locale de la lune.
- Pour vérifier les calculs :

```bash
npx tsx scripts/test-calendrier.ts
```

### Points techniques

- **Fiche événement** : `/evenements/voir?id=<slug>`. Une seule page statique lit l'identifiant dans l'URL, ce qui permet des liens partageables sans redéployer.
- **Thème saisonnier** : calculé avec `Intl.DateTimeFormat('fr-u-ca-islamic-umalqura')`, sans aucune dépendance. Les admins peuvent le forcer ou le couper depuis *Réglages > Thème*.
- **QR code de virement** : format EPC/SEPA (`src/lib/sepa.ts`), généré dans le navigateur.
- **Aucun paiement en ligne**, aucun cookie tiers. L'anti-spam repose sur un champ « pot de miel » et un délai minimal de 3 s.

---

Site réalisé par **Salakdji M**.
