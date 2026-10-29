/**
 * Espace admin (/admin) — 100 % utilisable au téléphone.
 * Connexion Firebase Auth puis tableau de bord par onglets (barre en bas sur mobile).
 */
import { useEffect, useState } from 'preact/hooks';
import type { AdminProfile } from '../../lib/types';
import { DEMO, login, logout, onSession, resetPassword } from './store';
import { toast } from '../../lib/toast';
import EvenementsAdmin from './EvenementsAdmin';
import StatsAdmin from './StatsAdmin';
import MessagesAdmin from './MessagesAdmin';
import ReglagesAdmin from './ReglagesAdmin';
import AdminsAdmin from './AdminsAdmin';

type Onglet = 'evenements' | 'stats' | 'messages' | 'reglages' | 'admins';

const ONGLETS: { id: Onglet; label: string; icone: string; superadmin?: boolean }[] = [
  { id: 'evenements', label: 'Événements', icone: '📅' },
  { id: 'stats', label: 'Chiffres', icone: '📊' },
  { id: 'messages', label: 'Messages', icone: '📥' },
  { id: 'reglages', label: 'Réglages', icone: '⚙️', superadmin: true },
  { id: 'admins', label: 'Équipe', icone: '👥', superadmin: true },
];

export default function AdminApp() {
  const [profil, setProfil] = useState<AdminProfile | null | 'refuse' | undefined>(undefined);
  const [demoConnecte, setDemoConnecte] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>('evenements');

  useEffect(() => onSession(setProfil, demoConnecte), [demoConnecte]);

  if (profil === undefined) return <p class="py-20 text-center text-encre/60">Chargement…</p>;
  if (profil === null || profil === 'refuse')
    return (
      <Connexion
        refuse={profil === 'refuse'}
        onDemo={() => setDemoConnecte(true)}
      />
    );

  const visibles = ONGLETS.filter((o) => !o.superadmin || profil.role === 'superadmin');

  return (
    <div class="pb-24 md:pb-0">
      {DEMO && (
        <p class="mb-4 rounded-xl bg-safran-clair p-3 text-sm">
          <strong>Mode démo</strong> : Firebase n'est pas encore configuré (fichier <code>.env</code>). Les modifications restent en mémoire et
          disparaissent au rechargement.
        </p>
      )}
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm text-encre/60">Bonjour {profil.name || profil.email}</p>
          <p class="text-xs font-semibold uppercase tracking-wider text-terracotta-fonce">
            {profil.role === 'superadmin' ? 'Super-admin' : 'Éditeur'}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-secondaire min-h-11 px-4 text-sm"
          onClick={async () => {
            await logout();
            setDemoConnecte(false);
            setProfil(null);
          }}
        >
          Se déconnecter
        </button>
      </div>

      {/* Onglets : en haut sur ordinateur, barre fixe en bas sur téléphone */}
      <nav
        class="pb-safe fixed inset-x-0 bottom-0 z-40 grid border-t border-sable bg-white md:static md:mb-6 md:flex md:gap-2 md:border-0 md:bg-transparent"
        style={{ gridTemplateColumns: `repeat(${visibles.length}, minmax(0, 1fr))` }}
        aria-label="Sections de l'administration"
      >
        {visibles.map((o) => (
          <button
            type="button"
            onClick={() => setOnglet(o.id)}
            aria-current={onglet === o.id ? 'page' : undefined}
            class={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold md:min-h-11 md:flex-row md:gap-2 md:rounded-full md:px-4 md:text-base ${
              onglet === o.id ? 'text-emerald-fonce md:bg-emerald-fonce md:text-white' : 'text-encre/70 md:bg-white'
            }`}
          >
            <span class="text-xl md:text-base" aria-hidden="true">
              {o.icone}
            </span>
            {o.label}
          </button>
        ))}
      </nav>

      {onglet === 'evenements' && <EvenementsAdmin profil={profil} />}
      {onglet === 'stats' && <StatsAdmin />}
      {onglet === 'messages' && <MessagesAdmin />}
      {onglet === 'reglages' && profil.role === 'superadmin' && <ReglagesAdmin />}
      {onglet === 'admins' && profil.role === 'superadmin' && <AdminsAdmin moi={profil.uid} />}
    </div>
  );
}

function Connexion({ refuse, onDemo }: { refuse: boolean; onDemo: () => void }) {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function onSubmit(e: Event) {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      await login(email.trim(), mdp);
      if (DEMO) onDemo();
    } catch {
      setErreur('Email ou mot de passe incorrect.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form class="carte mx-auto max-w-sm space-y-4 p-6" onSubmit={onSubmit}>
      <h1 class="text-2xl font-medium">Espace admin</h1>
      {refuse && (
        <p class="rounded-xl bg-grenade/10 p-3 text-sm text-grenade-fonce" role="alert">
          Ce compte n'a pas accès à l'administration. Demandez à un super-admin de vous ajouter.
        </p>
      )}
      {DEMO && <p class="rounded-xl bg-safran-clair p-3 text-sm">Mode démo : saisissez n'importe quel email et mot de passe.</p>}
      <div>
        <label class="etiquette" for="a-email">
          Email
        </label>
        <input id="a-email" type="email" class="champ" required autoComplete="username" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
      </div>
      <div>
        <label class="etiquette" for="a-mdp">
          Mot de passe
        </label>
        <input
          id="a-mdp"
          type="password"
          class="champ"
          required
          autoComplete="current-password"
          value={mdp}
          onInput={(e) => setMdp((e.target as HTMLInputElement).value)}
        />
      </div>
      {erreur && (
        <p class="text-sm font-semibold text-grenade-fonce" role="alert">
          {erreur}
        </p>
      )}
      <button class="btn btn-primaire w-full" disabled={envoi}>
        {envoi ? 'Connexion…' : 'Se connecter'}
      </button>
      <button
        type="button"
        class="block min-h-11 w-full text-sm text-emerald-fonce underline"
        onClick={async () => {
          if (!email) return toast("Saisissez d'abord votre email.", 'error');
          await resetPassword(email).catch(() => {});
          toast('Si ce compte existe, un email de réinitialisation a été envoyé.');
        }}
      >
        Mot de passe oublié ?
      </button>
      <a href="/" class="block min-h-11 border-t border-sable pt-3 text-center text-sm text-encre/70 hover:text-encre">
        ← Retour au site
      </a>
    </form>
  );
}
