/** Admin — déclarations de virement et inscriptions bénévoles (lecture réservée aux admins) */
import { useEffect, useState } from 'preact/hooks';
import { formatEuro } from '../../lib/labels';
import { listInbox, setHandled, type InboxItem } from './store';

type Col = 'donations_declared' | 'volunteers';

const dateCourte = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MessagesAdmin() {
  const [col, setCol] = useState<Col>('donations_declared');
  const [items, setItems] = useState<InboxItem[] | null>(null);

  useEffect(() => {
    setItems(null);
    listInbox(col).then(setItems).catch(() => setItems([]));
  }, [col]);

  const basculer = async (it: InboxItem) => {
    await setHandled(col, it.id, !it.handled);
    setItems((l) => l?.map((x) => (x.id === it.id ? { ...x, handled: !x.handled } : x)) ?? null);
  };

  return (
    <section>
      <h1 class="mb-4 text-2xl font-medium">Messages reçus</h1>
      <div class="mb-4 inline-flex rounded-full bg-sable p-1" role="tablist">
        {(
          [
            ['donations_declared', 'Virements déclarés'],
            ['volunteers', 'Bénévoles'],
          ] as const
        ).map(([k, l]) => (
          <button
            type="button"
            role="tab"
            aria-selected={col === k}
            onClick={() => setCol(k)}
            class={`min-h-11 rounded-full px-4 text-sm font-semibold ${col === k ? 'bg-white text-emerald-fonce shadow' : 'text-encre/70'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {items === null && <p class="py-10 text-center text-encre/60">Chargement…</p>}
      {items?.length === 0 && <p class="carte p-6 text-center text-encre/70">Rien pour l'instant.</p>}

      <ul class="space-y-3">
        {items?.map((it) => (
          <li class={`carte p-4 ${it.handled ? 'opacity-60' : ''}`}>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-lg font-bold">{String(it.name ?? '—')}</p>
                <p class="text-xs text-encre/60">{it.createdAt ? dateCourte.format(new Date(it.createdAt)) : ''}</p>
              </div>
              {col === 'donations_declared' && (
                <p class="font-titre text-2xl font-medium text-emerald-fonce">{formatEuro(Number(it.amount) || 0)}</p>
              )}
            </div>
            {col === 'donations_declared' ? (
              <div class="mt-2 space-y-1 text-sm">
                {it.reference ? (
                  <p>
                    Réf. <span class="font-mono font-semibold">{String(it.reference)}</span>
                  </p>
                ) : null}
                {it.email ? (
                  <p>
                    <a class="text-emerald-fonce underline" href={`mailto:${it.email}`}>
                      {String(it.email)}
                    </a>
                  </p>
                ) : null}
                {it.message ? <p class="italic text-encre/80">« {String(it.message)} »</p> : null}
              </div>
            ) : (
              <div class="mt-2 space-y-1 text-sm">
                <p>📍 {String(it.city ?? '')}</p>
                {Array.isArray(it.availability) && it.availability.length > 0 && <p>🗓️ {(it.availability as string[]).join(', ')}</p>}
                {it.message ? <p class="italic text-encre/80">« {String(it.message)} »</p> : null}
                <div class="flex gap-2 pt-2">
                  <a class="btn btn-secondaire flex-1 text-sm" href={`tel:${it.phone}`}>
                    📞 Appeler
                  </a>
                  <a class="btn btn-whatsapp flex-1 text-sm" href={`https://wa.me/${String(it.phone ?? '').replace(/[^\d]/g, '')}`} target="_blank" rel="noopener">
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            )}
            <label class="mt-3 flex min-h-11 items-center gap-3 border-t border-sable pt-2 text-sm font-semibold">
              <input type="checkbox" class="h-5 w-5 accent-emerald-fonce" checked={!!it.handled} onChange={() => basculer(it)} />
              {col === 'donations_declared' ? 'Virement reçu / traité' : 'Contacté'}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
