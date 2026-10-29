# Guide de A à Z : gérer et déployer le site tout seul

Ce guide est écrit pour **ton PC Windows** et **ce projet précis**. Suis les étapes dans l'ordre la première fois ; ensuite, la [routine de mise à jour](#7-la-routine-modifier--tester--mettre-en-ligne--sauvegarder) suffit.

| Élément | Valeur |
|---|---|
| Site en ligne | https://solidarite-zemmoura.web.app |
| Espace admin | https://solidarite-zemmoura.web.app/admin |
| Projet Firebase | `solidarite-zemmoura` → https://console.firebase.google.com/project/solidarite-zemmoura |
| Code sur GitHub | https://github.com/SalakdjiMostefa/solidarite-zemmoura |
| Dossier sur ton PC | `C:\Users\salak\Downloads\prompte\solidarite-zemoura` |
| Compte admin du site | `solidarite.zemmourah@gmail.com` (super-admin) |

---

## Sommaire

1. [Comprendre en 1 minute](#1-comprendre-en-1-minute)
2. [Ouvrir un terminal dans le projet](#2-ouvrir-un-terminal-dans-le-projet)
3. [Vérifier les outils installés](#3-vérifier-les-outils-installés)
4. [Voir le site sur ton PC avant de publier](#4-voir-le-site-sur-ton-pc-avant-de-publier)
5. [Où modifier quoi](#5-où-modifier-quoi)
6. [Mettre le site en ligne (déployer)](#6-mettre-le-site-en-ligne-déployer)
7. [La routine : modifier → tester → mettre en ligne → sauvegarder](#7-la-routine-modifier--tester--mettre-en-ligne--sauvegarder)
8. [Git et GitHub : sauvegarder le code](#8-git-et-github--sauvegarder-le-code)
9. [Brancher Cloudinary (photos depuis l'admin)](#9-brancher-cloudinary-photos-depuis-ladmin)
10. [Gérer les admins](#10-gérer-les-admins)
11. [Les données : ce qui est dans le code, ce qui est dans Firebase](#11-les-données--ce-qui-est-dans-le-code-ce-qui-est-dans-firebase)
12. [Brancher un nom de domaine](#12-brancher-un-nom-de-domaine)
13. [Revenir en arrière si une mise en ligne casse le site](#13-revenir-en-arrière-si-une-mise-en-ligne-casse-le-site)
14. [Travailler depuis un autre PC](#14-travailler-depuis-un-autre-pc)
15. [Sécurité : les règles d'or](#15-sécurité--les-règles-dor)
16. [Problèmes fréquents et solutions](#16-problèmes-fréquents-et-solutions)
17. [Aide-mémoire des commandes](#17-aide-mémoire-des-commandes)

---

## 1. Comprendre en 1 minute

Le site a **deux parties** qui vivent à des endroits différents :

| Partie | Où elle vit | Comment la changer |
|---|---|---|
| **Le site lui-même** : pages, textes fixes, design, traductions, photos de `public/` | Dans le **code** sur ton PC, puis en ligne sur **Firebase Hosting** | Tu modifies les fichiers, puis tu **redéploies** (`npm run deploy`) |
| **Le contenu vivant** : événements, chiffres clés, messages, réglages (IBAN, montants, thème) | Dans la base **Firestore** | Directement depuis **l'espace admin** du site, **sans redéployer** |

👉 Pour publier un événement ou changer un chiffre : **l'admin suffit**, aucun terminal.
👉 Pour changer un texte de page, le design, une traduction : **code + déploiement**.

---

## 2. Ouvrir un terminal dans le projet

Toutes les commandes de ce guide se tapent **dans le dossier du projet**.

**Méthode simple :** ouvre l'Explorateur Windows, va dans `C:\Users\salak\Downloads\prompte\solidarite-zemoura`, clique dans la **barre d'adresse**, tape `powershell` puis **Entrée**. Un terminal s'ouvre directement au bon endroit.

**Ou** ouvre « Windows PowerShell » et tape :

```powershell
cd C:\Users\salak\Downloads\prompte\solidarite-zemoura
```

> ⚠️ Pas Google Cloud Shell : il tourne chez Google et ne voit pas les fichiers de ton PC.

---

## 3. Vérifier les outils installés

À faire une fois (ou si une commande « n'est pas reconnue ») :

```powershell
node -v
```

Doit afficher `v22…` (ou `v20.3` et plus). Sinon, installe **Node.js LTS** depuis https://nodejs.org puis rouvre le terminal.

```powershell
git --version
```

Sinon, installe Git depuis https://git-scm.com (options par défaut).

```powershell
npx firebase --version
```

L'outil Firebase est déjà inclus dans le projet : pas besoin de l'installer à part.

Si le dossier `node_modules` n'existe pas (nouveau PC, dossier copié…) :

```powershell
npm install
```

---

## 4. Voir le site sur ton PC avant de publier

```powershell
npm run dev
```

Ouvre **http://localhost:4321** dans ton navigateur. Chaque fois que tu enregistres un fichier, la page se met à jour toute seule. Pour arrêter : **Ctrl + C** dans le terminal.

> Le site local utilise la **vraie base Firestore** (les clés sont dans `.env`). Ce que tu fais dans `/admin` en local modifie donc les **vraies données** du site en ligne.

---

## 5. Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| Un texte du site (FR ou AR), un titre, un bouton | `src/i18n/index.ts` (bloc `fr` puis bloc `ar`) |
| Nom de l'association, n° RNA, adresse, « réalisé par » | `src/config/site.ts` |
| IBAN, BIC, téléphones, e-mail, Facebook, YouTube, TikTok | `.env` (puis redéployer) |
| Couleurs, polices, styles généraux | `src/styles/global.css` |
| Logo | Remplacer `public/images/logo.png`, puis `node scripts/generer-icones.mjs` |
| Photos du foot / des événements d'exemple | `public/images/foot/`, `public/images/evenements/` |
| Mise en page d'une page | `src/views/` (une page = un fichier, utilisé en FR et en AR) |
| Événements, chiffres clés, montants des dons, thème | **Espace admin** (pas le code) |

Pour éditer les fichiers, le plus confortable est **Visual Studio Code** (https://code.visualstudio.com) : *Fichier → Ouvrir le dossier* → `solidarite-zemoura`.

---

## 6. Mettre le site en ligne (déployer)

### 6.1 Première fois sur un PC : se connecter à Firebase

```powershell
npx firebase login
```

Une page Google s'ouvre : choisis **salakdjimostefa@gmail.com** et autorise. À ne refaire que si on te dit « Failed to authenticate ».

### 6.2 Vérifier que le projet est le bon

```powershell
npx firebase use
```

Doit afficher `solidarite-zemmoura`. Sinon : `npx firebase use solidarite-zemmoura`.

### 6.3 Déployer

```powershell
npm run deploy
```

Cette commande fait tout, dans l'ordre :
1. **vérifie le code** (s'il y a une erreur, rien n'est mis en ligne — c'est voulu) ;
2. **construit** le site dans le dossier `dist` ;
3. **envoie** le site et les règles de sécurité sur Firebase.

À la fin, tu dois voir **`Deploy complete!`** et l'adresse `https://solidarite-zemmoura.web.app`.

### 6.4 Vérifier

Ouvre le site en **navigation privée** (Ctrl + Maj + N) pour éviter l'ancienne version en cache. Les changements peuvent mettre **1 à 2 minutes** à apparaître partout.

> ❌ N'utilise **jamais** `firebase init` : la configuration existe déjà et cette commande peut l'écraser.

---

## 7. La routine : modifier → tester → mettre en ligne → sauvegarder

```powershell
npm run dev
```
→ tu modifies, tu vérifies sur http://localhost:4321, puis **Ctrl + C**.

```powershell
npm run deploy
```
→ le site est en ligne.

```powershell
git add -A
```

```powershell
git commit -m "Décris ici ce que tu as changé"
```

```powershell
git push
```
→ le code est sauvegardé sur GitHub.

---

## 8. Git et GitHub : sauvegarder le code

Le code est sur **https://github.com/SalakdjiMostefa/solidarite-zemmoura** (branche `main`).

| Commande | À quoi ça sert |
|---|---|
| `git status` | Voir les fichiers modifiés depuis la dernière sauvegarde |
| `git add -A` | Préparer **tous** les changements |
| `git commit -m "message"` | Créer un point de sauvegarde avec un message clair |
| `git push` | Envoyer les sauvegardes sur GitHub |
| `git log --oneline` | Voir l'historique des sauvegardes |
| `git pull` | Récupérer les changements faits ailleurs (autre PC, GitHub) |

**Ce qui n'est jamais envoyé sur GitHub** (réglé dans `.gitignore`) : le fichier `.env`, les clés `service-account.json` / `*firebase-adminsdk*.json`, `node_modules`, `dist`.

> 🔓 Le dépôt est actuellement **public** : tout le monde peut lire le code. Rien de secret n'y est, mais tu peux le rendre privé : GitHub → ton dépôt → **Settings** → tout en bas **Change visibility** → **Make private**.

Si `git push` demande de se connecter : une fenêtre GitHub s'ouvre, connecte-toi avec ton compte et autorise. C'est mémorisé ensuite.

---

## 9. Brancher Cloudinary (photos depuis l'admin)

Sans Cloudinary, les photos **déjà intégrées** au site s'affichent, mais **l'envoi de nouvelles photos depuis l'admin ne fonctionne pas**. À faire une fois (≈ 5 min) :

1. Crée un compte gratuit sur https://cloudinary.com (avec l'e-mail de l'association).
2. Sur le **Dashboard**, note le **Cloud name** (ex. `dxyz12ab`).
3. **Settings** (⚙️) → **Upload** → **Upload presets** → **Add upload preset** :
   - **Signing mode : Unsigned** ← obligatoire ;
   - **Folder** : `solidarite-zemoura` ;
   - **Save**, puis note le **nom du preset** (ex. `site_zemmoura`).
4. **Settings → Security** : vérifie que **Strict transformations** est **désactivé** (nécessaire pour « Flouter les visages »).
5. Ouvre le fichier `.env` du projet (avec VS Code ou le Bloc-notes) et remplis :
   ```ini
   PUBLIC_CLOUDINARY_CLOUD_NAME=dxyz12ab
   PUBLIC_CLOUDINARY_UPLOAD_PRESET=site_zemmoura
   ```
6. Redéploie :
   ```powershell
   npm run deploy
   ```
7. Test : `/admin` → modifier un événement → **🖼️ Galerie** → ajoute une photo → enregistre → la photo doit apparaître sur la page de l'événement.

---

## 10. Gérer les admins

**Première connexion / mot de passe oublié :**
1. Va sur https://solidarite-zemmoura.web.app/admin.
2. Tape `solidarite.zemmourah@gmail.com` puis clique **« Mot de passe oublié ? »**.
3. Ouvre l'e-mail reçu (regarde aussi les **spams**) et choisis le mot de passe.

**Ajouter un bénévole admin** (connecté en super-admin) :
`/admin` → onglet **👥 Équipe** → **Ajouter un membre** → nom, e-mail, mot de passe provisoire, rôle :
- **Éditeur** : événements et chiffres ;
- **Super-admin** : tout, y compris les réglages et l'équipe.

Transmets le mot de passe provisoire **de vive voix** ; la personne le change ensuite avec « Mot de passe oublié ? ».

**Retirer un accès :** onglet **👥 Équipe** → **Retirer**.

Le guide pour les bénévoles (publier un événement, ajouter des photos…) est dans **`GUIDE-ADMIN.md`**.

---

## 11. Les données : ce qui est dans le code, ce qui est dans Firebase

- Les événements, chiffres et réglages **en ligne** sont dans **Firestore**. On les gère dans l'admin.
- Le fichier `src/lib/demo-data.ts` ne sert **qu'au tout premier remplissage** de la base (déjà fait le 29/10/2026).

> ⚠️ **Ne relance pas `npm run seed`.** Ce script **réécrit** les événements d'exemple, les chiffres clés et les réglages : il écraserait les modifications faites dans l'admin.

**Voir ou corriger les données à la main** (en cas de besoin) : console Firebase → **Firestore Database** → collections `events`, `stats`, `settings`, `admins`, `volunteers`, `donations_declared`.

**Les règles de sécurité** (qui a le droit de lire / écrire) sont dans `firestore.rules`. Elles sont renvoyées à chaque `npm run deploy`.

---

## 12. Brancher un nom de domaine

1. Achète le nom (ex. `solidarite-zemmoura.fr`) chez un registraire : OVH, Gandi, IONOS… (≈ 10 €/an).
2. Console Firebase → **Hosting** → **Ajouter un domaine personnalisé** → tape le domaine.
3. Firebase affiche des enregistrements **TXT** puis **A** : copie-les dans la zone DNS de ton registraire.
4. Attends (quelques minutes à 24 h). Le HTTPS s'active tout seul.
5. Dans `.env`, change :
   ```ini
   PUBLIC_SITE_URL=https://solidarite-zemmoura.fr
   ```
   puis `npm run deploy` (pour le sitemap, le robots.txt et les aperçus WhatsApp).

---

## 13. Revenir en arrière si une mise en ligne casse le site

**Le plus rapide (sans terminal) :** console Firebase → **Hosting** → tableau **Historique des versions** → sur la version précédente : **⋮ → Restaurer**. Le site revient en quelques secondes.

**Côté code**, pour annuler les modifications pas encore sauvegardées :

```powershell
git restore .
```

> ⚠️ Cette commande efface définitivement les changements non commités. Vérifie avant avec `git status`.

---

## 14. Travailler depuis un autre PC

```powershell
git clone https://github.com/SalakdjiMostefa/solidarite-zemmoura.git
```

```powershell
cd solidarite-zemmoura
```

```powershell
npm install
```

Puis **recrée le fichier `.env`** : copie `.env.example` en `.env` et remplis les valeurs. Les clés Firebase se trouvent dans la console : ⚙️ **Paramètres du projet → Général → Vos applications → Configuration**. Ensuite `npx firebase login`, et tu peux utiliser `npm run dev` / `npm run deploy`.

> 💡 Garde une copie de ton `.env` dans un endroit sûr (gestionnaire de mots de passe, clé USB) : il n'est pas sur GitHub.

---

## 15. Sécurité : les règles d'or

1. **Jamais** de mot de passe, de fichier `.env` ou de clé `*.json` envoyé par e-mail, WhatsApp, ou mis sur GitHub.
2. La clé de service (`firebase-adminsdk…json`) donne **tous les droits** sur la base : **supprime-la** quand tu n'en as plus besoin (console Google Cloud → IAM → Comptes de service → `firebase-adminsdk-fbsvc` → **Clés** → supprimer). Celle du 29/10/2026 (`75756b5e…`) est à révoquer.
3. Le mot de passe de l'admin du site doit être **différent** de celui de la boîte Gmail.
4. Les clés `PUBLIC_FIREBASE_*` ne sont pas secrètes (elles sont dans le site public) : la protection vient de `firestore.rules`.
5. Ne publie jamais de photo où un **enfant** ou une **personne aidée** est reconnaissable (option « Flouter les visages » dans l'admin).

---

## 16. Problèmes fréquents et solutions

| Message / problème | Solution |
|---|---|
| `npm` / `node` / `git` n'est pas reconnu | Installer l'outil (étape 3), puis **fermer et rouvrir** le terminal |
| `Cannot find module…` ou erreur au démarrage | `npm install` |
| `Failed to authenticate, have you run firebase login?` | `npx firebase login` |
| `npm run deploy` s'arrête avec des erreurs rouges `error ts(…)` | Une erreur dans le code : lis le fichier et la ligne indiqués, corrige, relance. Rien n'a été mis en ligne |
| Le site en ligne ne montre pas mes changements | Navigation privée, attendre 1–2 min, vider le cache (Ctrl + F5) |
| Les événements ne s'affichent plus (« Connexion impossible ») | Vérifier `.env` (clés `PUBLIC_FIREBASE_*`) puis redéployer ; vérifier dans la console que Firestore existe toujours |
| « Ce compte n'a pas accès à l'administration » | Le compte existe mais n'est pas dans `admins` : l'ajouter via 👥 Équipe (super-admin), ou dans Firestore → collection `admins` → document avec l'UID, champs `email` et `role` = `superadmin` |
| L'envoi de photo échoue dans l'admin | Cloudinary non configuré ou preset pas en **Unsigned** (étape 9) |
| `git push` refusé (`rejected`, `fetch first`) | `git pull` puis `git push` |
| Le port 4321 est déjà utilisé | Un `npm run dev` tourne déjà dans un autre terminal : le fermer (Ctrl + C) |

---

## 17. Aide-mémoire des commandes

| Je veux… | Commande |
|---|---|
| Aller dans le projet | `cd C:\Users\salak\Downloads\prompte\solidarite-zemoura` |
| Installer / réparer les dépendances | `npm install` |
| Voir le site en local | `npm run dev` |
| Vérifier sans publier | `npm run build` |
| **Mettre en ligne** | `npm run deploy` |
| Se connecter à Firebase | `npx firebase login` |
| Voir le projet Firebase actif | `npx firebase use` |
| Sauvegarder le code | `git add -A` puis `git commit -m "…"` puis `git push` |
| Récupérer le code à jour | `git pull` |
| Régénérer favicon et icônes après changement de logo | `node scripts/generer-icones.mjs` |
| Vérifier les dates du calendrier | `npx tsx scripts/test-calendrier.ts` |

---

*Site réalisé par Salakdji M.*
