'use client';
import useSWR from 'swr';

const fetcher = async (u) => {
  const r = await fetch(u);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};

/** useApi('/api/students?page=1') – pass null to skip */
export const useApi = (url, opts) => useSWR(url, fetcher, { keepPreviousData: true, ...opts });

export async function api(url, method = 'GET', body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
}

/** Upload a file to Cloudinary through /api/upload -> { url, publicId, name, size } */
export async function upload(file, folder = 'misc') {
  const f = new FormData();
  f.append('file', file);
  f.append('folder', folder);
  const r = await fetch('/api/upload', { method: 'POST', body: f });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Upload failed');
  return j;
}

export const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null && v !== 'all')).toString();

export const toast = (message, type = 'success') => window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));

/** try an async action and toast the result */
export async function run(fn, success) {
  try { const r = await fn(); if (success) toast(success); return r; } catch (e) { toast(e.message, 'error'); return null; }
}

export const fmtDate = (d, o = { day: '2-digit', month: 'short', year: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-IN', o) : '–');
export const fmtTime = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
export const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const thisMonth = () => todayKey().slice(0, 7);
export const downloadCSV = (name, rows) => {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name; a.click();
};
