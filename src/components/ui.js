'use client';
import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';

export const cn = (...a) => a.filter(Boolean).join(' ');
export const inr = (n) => { const v = Number(n || 0); return (v < 0 ? '-' : '') + '₹' + Math.abs(v).toLocaleString('en-IN'); };

const TONES = {
  green: ['bg-emerald-50 text-emerald-700 ring-emerald-600/15', 'bg-emerald-500'],
  red: ['bg-rose-50 text-rose-700 ring-rose-600/15', 'bg-rose-500'],
  yellow: ['bg-amber-50 text-amber-700 ring-amber-600/20', 'bg-amber-500'],
  purple: ['bg-brand-50 text-brand-700 ring-brand-600/15', 'bg-brand-500'],
  blue: ['bg-sky-50 text-sky-700 ring-sky-600/15', 'bg-sky-500'],
  gray: ['bg-slate-100 text-slate-600 ring-slate-500/10', 'bg-slate-400'],
  orange: ['bg-orange-50 text-orange-700 ring-orange-600/15', 'bg-orange-500'],
};
const STATUS = { active: 'green', paid: 'green', present: 'green', published: 'green', sent: 'green', inactive: 'red', absent: 'red', overdue: 'red', due: 'red', failed: 'red', partial: 'yellow', pending: 'yellow', onhold: 'yellow', onleave: 'orange', scheduled: 'orange', late: 'orange', draft: 'gray' };
const LABEL = { onhold: 'On Hold', onleave: 'On Leave' };

export const Badge = ({ tone = 'gray', children, className, dot }) => (
  <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', TONES[tone][0], className)}>
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full', TONES[tone][1])} />}{children}
  </span>
);
export const StatusBadge = ({ s }) => (
  <Badge dot tone={STATUS[s] || 'gray'}>{LABEL[s] || (s ? s[0].toUpperCase() + s.slice(1).replace('_', ' ') : '–')}</Badge>
);

const AV = ['from-violet-500 to-indigo-500', 'from-sky-500 to-blue-600', 'from-emerald-400 to-teal-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500'];
export const Avatar = ({ src, name = '?', size = 36 }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm" />
  ) : (
    <span style={{ width: size, height: size, fontSize: size / 2.7 }} className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-2 ring-white shadow-sm', AV[(name.charCodeAt(0) || 0) % AV.length])}>
      {name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
    </span>
  );

export const PageHeader = ({ icon: Icon, title, sub, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="flex items-center gap-4">
      {Icon && <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow"><Icon className="h-6 w-6" /></span>}
      <div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-ink-500">{sub}</p>}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2.5">{children}</div>
  </div>
);

const STAT = {
  purple: ['from-violet-500 to-indigo-600', 'bg-violet-500/10'], blue: ['from-sky-500 to-blue-600', 'bg-sky-500/10'],
  green: ['from-emerald-400 to-teal-600', 'bg-emerald-500/10'], red: ['from-rose-400 to-red-500', 'bg-rose-500/10'], orange: ['from-amber-400 to-orange-500', 'bg-orange-500/10'],
};
export const Stat = ({ icon: Icon, label, value, sub, tone = 'purple', subTone }) => (
  <div className="card relative min-w-0 overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-pop">
    <span className={cn('absolute -right-7 -top-7 h-24 w-24 rounded-full', STAT[tone][1])} />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 pt-0.5 text-[13px] font-medium leading-snug text-ink-500">{label}</div>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', STAT[tone][0])}><Icon className="h-5 w-5" /></span>
    </div>
    <div className="relative mt-3 text-[22px] font-extrabold leading-none tracking-tight text-ink sm:text-2xl">{value}</div>
    {sub && <div className={cn('relative mt-1.5 truncate text-xs font-medium', subTone || 'text-ink-500')}>{sub}</div>}
  </div>
);

export const Empty = ({ icon: Icon = Inbox, title = 'Nothing here yet', hint, action }) => (
  <div className="flex flex-col items-center px-4 py-10 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"><Icon className="h-7 w-7" /></span>
    <div className="mt-3 text-sm font-bold text-ink">{title}</div>
    {hint && <p className="mt-1 max-w-xs text-sm text-ink-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Card = ({ title, icon: Icon, action, children, className }) => (
  <section className={cn('card', className)}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-[15px] font-bold text-ink">
          {Icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></span>}{title}
        </h2>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const Field = ({ label, required, children, className }) => (
  <label className={cn('block', className)}>
    <span className="lbl">{label}{required && <span className="text-rose-500"> *</span>}</span>
    {children}
  </label>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex flex-wrap gap-x-7 gap-y-1 border-b border-ink/[.08]">
    {tabs.map((t) => {
      const [v, l] = Array.isArray(t) ? t : [t, t];
      return (
        <button key={v} onClick={() => onChange(v)} className={cn('relative pb-3 pt-1 text-sm font-semibold transition', value === v ? 'text-brand-700' : 'text-ink-500 hover:text-ink')}>
          {l}
          {value === v && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-gradient-to-r from-brand-500 to-brand-700" />}
        </button>
      );
    })}
  </div>
);

export function Table({ cols, rows, loading, empty = 'Nothing here yet', onRowClick, activeId }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={c.h + i} className={cn('whitespace-nowrap border-y border-ink/[.06] bg-brand-50/50 px-3 py-3 text-left text-xs font-semibold text-ink-500 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r', c.cls)}>{c.h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && !rows?.length ? (
            <tr><td colSpan={cols.length} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-500" /></td></tr>
          ) : rows?.length ? rows.map((r, i) => (
            <tr key={r._id || i} onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cn('group transition', onRowClick && 'cursor-pointer', activeId && activeId === r._id ? 'bg-brand-50' : 'hover:bg-brand-50/40')}>
              {cols.map((c, j) => <td key={c.h + j} className={cn('whitespace-nowrap border-b border-ink/[.05] px-3 py-3 align-middle group-last:border-0', c.cls)}>{c.render(r, i)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={cols.length}><Empty title={empty} /></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, pages, total, limit, onPage, label = 'records' }) {
  const from = total ? (page - 1) * limit + 1 : 0, to = Math.min(page * limit, total);
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-500">
      <span>Showing <b className="text-ink">{from}–{to}</b> of <b className="text-ink">{total}</b> {label}</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-ink/10 bg-white p-1.5 transition hover:bg-brand-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        {nums.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && n - nums[i - 1] > 1 && <span>…</span>}
            <button onClick={() => onPage(n)} className={cn('h-8 min-w-8 rounded-lg px-2 text-sm font-semibold transition', n === page ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-glow' : 'border border-ink/10 bg-white hover:bg-brand-50')}>{n}</button>
          </span>
        ))}
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-ink/10 bg-white p-1.5 transition hover:bg-brand-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={cn('max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-pop', width)} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between border-b border-ink/[.06] pb-4">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-brand-50 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Toggle = ({ checked, onChange }) => (
  <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
    className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-emerald-500' : 'bg-ink-300')}>
    <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
  </button>
);

export const Spinner = () => <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600" />;

export function Toaster() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const h = (e) => {
      const id = Math.random();
      setList((l) => [...l, { id, ...e.detail }]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener('toast', h);
    return () => window.removeEventListener('toast', h);
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-[60] space-y-2">
      {list.map((t) => (
        <div key={t.id} className={cn('flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-pop', t.type === 'error' ? 'bg-rose-600' : 'bg-ink')}>
          <span className={cn('h-2 w-2 rounded-full', t.type === 'error' ? 'bg-rose-200' : 'bg-emerald-400')} />{t.message}
        </div>
      ))}
    </div>
  );
}
