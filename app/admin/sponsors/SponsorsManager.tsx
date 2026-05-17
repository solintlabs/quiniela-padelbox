'use client';

import { useState, useTransition } from 'react';
import type { Sponsor } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Actions {
  create: (formData: FormData) => Promise<void>;
  update: (formData: FormData) => Promise<void>;
  toggle: (formData: FormData) => Promise<void>;
  delete: (formData: FormData) => Promise<void>;
  reorder: (formData: FormData) => Promise<void>;
}

interface Props {
  sponsors: Sponsor[];
  blobConfigured: boolean;
  actions: Actions;
}

export function SponsorsManager({ sponsors, blobConfigured, actions }: Props) {
  return (
    <div className="space-y-10">
      <NewSponsorForm blobConfigured={blobConfigured} onCreate={actions.create} />

      <section>
        <h2 className="font-display text-xl mb-3">Lista actual</h2>
        {sponsors.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay patrocinadores. Añade uno arriba.</p>
        ) : (
          <ul className="space-y-2">
            {sponsors.map((s, i) => (
              <SponsorRow
                key={s.id}
                sponsor={s}
                first={i === 0}
                last={i === sponsors.length - 1}
                blobConfigured={blobConfigured}
                actions={actions}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NewSponsorForm({ blobConfigured, onCreate }: { blobConfigured: boolean; onCreate: Actions['create'] }) {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [url, setUrl] = useState('');
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/sponsors/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo subir');
      setLogoUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo');
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    const fd = new FormData();
    fd.append('name', name);
    fd.append('logoUrl', logoUrl);
    fd.append('url', url);
    startTransition(async () => {
      await onCreate(fd);
      setName('');
      setLogoUrl('');
      setUrl('');
    });
  }

  return (
    <section className="rounded-xl border border-line bg-bg-elev p-5">
      <h2 className="font-display text-xl">Añadir patrocinador</h2>
      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3 mt-4">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.18em] text-muted">Nombre *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required placeholder="DELISH! BURGERS" />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.18em] text-muted">URL del sitio (opcional)</label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://delish.com" />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs uppercase tracking-[0.18em] text-muted">Logo</label>
          <div className="flex flex-wrap items-center gap-3">
            {blobConfigured && (
              <label className="cursor-pointer inline-flex items-center h-10 px-4 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:brightness-95">
                {uploading ? 'Subiendo…' : '📎 Subir archivo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                  disabled={uploading}
                />
              </label>
            )}
            <span className="text-xs text-muted">o</span>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://… (pega URL pública)"
              className="flex-1 min-w-[260px]"
            />
          </div>
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
          {logoUrl && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="preview" className="h-10 w-auto bg-bg rounded border border-line p-1" />
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="text-xs text-muted hover:text-danger"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending || uploading || !name.trim()}>
            {pending ? 'Guardando…' : 'Añadir patrocinador'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SponsorRow({
  sponsor,
  first,
  last,
  blobConfigured,
  actions,
}: {
  sponsor: Sponsor;
  first: boolean;
  last: boolean;
  blobConfigured: boolean;
  actions: Actions;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className={`rounded-xl border bg-bg-elev p-4 ${sponsor.enabled ? 'border-line' : 'border-line opacity-60'}`}>
      {editing ? (
        <EditForm sponsor={sponsor} blobConfigured={blobConfigured} onUpdate={actions.update} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-20 h-12 bg-bg rounded flex items-center justify-center shrink-0">
            {sponsor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-10 max-w-[72px] object-contain" />
            ) : (
              <span className="text-[10px] text-muted">sin logo</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{sponsor.name}</p>
            {sponsor.url && <p className="text-xs text-muted truncate">{sponsor.url}</p>}
          </div>
          <form action={actions.reorder} className="flex flex-col gap-0.5">
            <input type="hidden" name="id" value={sponsor.id} />
            <button name="dir" value="up" disabled={first} className="text-xs px-2 py-0.5 rounded hover:bg-bg disabled:opacity-30">↑</button>
            <button name="dir" value="down" disabled={last} className="text-xs px-2 py-0.5 rounded hover:bg-bg disabled:opacity-30">↓</button>
          </form>
          <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded border border-line hover:bg-bg">Editar</button>
          <form action={actions.toggle}>
            <input type="hidden" name="id" value={sponsor.id} />
            <Button type="submit" variant={sponsor.enabled ? 'secondary' : 'primary'} size="sm">
              {sponsor.enabled ? 'Ocultar' : 'Activar'}
            </Button>
          </form>
          <form action={actions.delete}>
            <input type="hidden" name="id" value={sponsor.id} />
            <button type="submit" className="text-xs px-2 py-1 text-danger hover:bg-danger/10 rounded" title="Borrar">
              🗑
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function EditForm({
  sponsor,
  blobConfigured,
  onUpdate,
  onCancel,
}: {
  sponsor: Sponsor;
  blobConfigured: boolean;
  onUpdate: Actions['update'];
  onCancel: () => void;
}) {
  const [name, setName] = useState(sponsor.name);
  const [logoUrl, setLogoUrl] = useState(sponsor.logoUrl ?? '');
  const [url, setUrl] = useState(sponsor.url ?? '');
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/sponsors/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo subir');
      setLogoUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo');
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('id', sponsor.id);
    fd.append('name', name);
    fd.append('logoUrl', logoUrl);
    fd.append('url', url);
    startTransition(async () => {
      await onUpdate(fd);
      onCancel();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-[0.18em] text-muted">Nombre</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-[0.18em] text-muted">URL del sitio</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label className="text-xs uppercase tracking-[0.18em] text-muted">Logo</label>
        <div className="flex flex-wrap items-center gap-3">
          {blobConfigured && (
            <label className="cursor-pointer inline-flex items-center h-9 px-3 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:brightness-95">
              {uploading ? 'Subiendo…' : '📎 Reemplazar'}
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }} disabled={uploading} />
            </label>
          )}
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" className="flex-1 min-w-[220px]" />
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="preview" className="mt-2 h-10 w-auto bg-bg rounded border border-line p-1" />
        )}
      </div>
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" disabled={pending || uploading}>{pending ? 'Guardando…' : 'Guardar'}</Button>
        <button type="button" onClick={onCancel} className="px-4 text-sm text-muted">Cancelar</button>
      </div>
    </form>
  );
}
