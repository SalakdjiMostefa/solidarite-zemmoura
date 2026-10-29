/** Admin (superadmin) — gestion de l'équipe : ajouter un admin, changer son rôle, le retirer */
import { useEffect, useState } from 'preact/hooks';
import type { AdminProfile, AdminRole } from '../../lib/types';
import { toast } from '../../lib/toast';
import { createAdmin, listAdmins, removeAdmin, updateAdminRole } from './store';

export default function AdminsAdmin({ moi }: { moi: string }) {
  const [admins, setAdmins] = useState<AdminProfile[] | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const charger = () => listAdmins().then(setAdmins);
  useEffect(() => {
    charger();
  }, []);

  async function ajouter(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const f = new FormData(form);
    setEnvoi(true);
    try {
      await createAdmin(String(f.get('email')).trim(), String(f.get('password')), String(f.get('name')).trim(), f.get('role') as AdminRole);
      toast('Compte créé ✓ Transmettez le mot de passe en main propre.');
      form.reset();
      charger();
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      toast(
        code === 'auth/email-already-in-use'
          ? 'Cet email a déjà un compte.'
          : code === 'auth/weak-password'
            ? 'Mot de passe trop faible (8 caractères minimum).'
            : 'Création impossible.',
        'error',
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section class="space-y-6">
      <h1 class="text-2xl font-medium">Équipe d'administration</h1>
      <ul class="space-y-3">
        {admins?.map((a) => (
          <li class="carte flex flex-wrap items-center gap-3 p-4">
            <div class="min-w-0 flex-1">
              <p class="font-bold">{a.name || a.email}</p>
              <p class="truncate text-sm text-encre/60">{a.email}</p>
            </div>
            <select
              class="champ w-auto"
              aria-label={`Rôle de ${a.email}`}
              value={a.role}
              disabled={a.uid === moi}
              onChange={async (e) => {
                await updateAdminRole(a.uid, (e.target as HTMLSelectElement).value as AdminRole);
                toast('Rôle modifié');
                charger();
              }}
            >
              <option value="editor">Éditeur</option>
              <option value="superadmin">Super-admin</option>
            </select>
            {a.uid !== moi && (
              <button
                type="button"
                class="btn bg-grenade/10 px-4 text-sm text-grenade-fonce"
                onClick={async () => {
                  if (!confirm(`Retirer l'accès de ${a.email} ?`)) return;
                  await removeAdmin(a.uid);
                  toast('Accès retiré');
                  charger();
                }}
              >
                Retirer
              </button>
            )}
          </li>
        ))}
      </ul>

      <form class="carte max-w-lg space-y-4 p-5" onSubmit={ajouter}>
        <h2 class="text-xl font-medium">Ajouter un membre</h2>
        <div>
          <label class="etiquette" for="n-nom">
            Prénom / nom
          </label>
          <input id="n-nom" name="name" class="champ" required maxLength={60} />
        </div>
        <div>
          <label class="etiquette" for="n-email">
            Email
          </label>
          <input id="n-email" name="email" type="email" class="champ" required autoComplete="off" />
        </div>
        <div>
          <label class="etiquette" for="n-mdp">
            Mot de passe provisoire
          </label>
          <input id="n-mdp" name="password" type="text" class="champ font-mono" required minLength={8} autoComplete="new-password" />
          <p class="mt-1 text-xs text-encre/60">La personne pourra le changer via « Mot de passe oublié ».</p>
        </div>
        <div>
          <label class="etiquette" for="n-role">
            Rôle
          </label>
          <select id="n-role" name="role" class="champ">
            <option value="editor">Éditeur — événements et chiffres</option>
            <option value="superadmin">Super-admin — tout, y compris réglages et équipe</option>
          </select>
        </div>
        <button class="btn btn-primaire w-full" disabled={envoi}>
          {envoi ? 'Création…' : 'Créer le compte'}
        </button>
      </form>
    </section>
  );
}
