'use client';
import { useState } from 'react';
import { Megaphone, Search, Pencil, Trash2, Eye, Send, BookOpen, Umbrella, Star, FileText, Calendar, Clock, FilePen } from 'lucide-react';
import { useApi, api, run, qs, fmtDate } from '@/lib/client';
import { Stat, Card, Table, Pager, Tabs, StatusBadge, Badge, PageHeader, Toggle, Field, cn } from '@/components/ui';

const TYPES = [['general', 'General', 'General Notice', 'Institute updates, important information', FileText, 'blue'], ['exam', 'Exam', 'Exam Notice', 'Exam schedule, syllabus, instructions', BookOpen, 'purple'], ['holiday', 'Holiday', 'Holiday Notice', 'Holidays, institute closure', Umbrella, 'orange'], ['event', 'Event', 'Event Notice', 'PTM, workshops, special events', Star, 'red']];
const blank = { type: 'general', title: '', body: '', audience: ['students', 'parents'], scheduledAt: '', whatsapp: true };

export default function Notices() {
  const [f, setF] = useState({ type: 'all', q: '', page: 1 });
  const [n, setN] = useState(blank);
  const [editId, setEditId] = useState(null);
  const limit = 7;
  const set = (o) => setF((x) => ({ ...x, page: 1, ...o }));
  const { data, isLoading, mutate } = useApi(`/api/notices?${qs({ ...f, limit })}`);
  const st = data?.stats || {};
  const tone = Object.fromEntries(TYPES.map((t) => [t[0], t[5]]));

  const submit = async (status) => {
    if (!n.title.trim()) return run(async () => { throw new Error('Add a title first'); });
    const body = { ...n, status, scheduledAt: n.scheduledAt || undefined };
    const r = await run(() => (editId ? api(`/api/notices/${editId}`, 'PUT', { ...body, ...(status === 'published' ? { publishedAt: new Date() } : {}) }) : api('/api/notices', 'POST', body)), status === 'draft' ? 'Draft saved' : 'Notice published');
    if (r) { setN(blank); setEditId(null); mutate(); }
  };
  const del = async (x) => { if (confirm(`Delete “${x.title}”?`)) { await run(() => api(`/api/notices/${x._id}`, 'DELETE'), 'Notice deleted'); mutate(); } };
  const toggleAud = (a) => setN({ ...n, audience: n.audience.includes(a) ? n.audience.filter((x) => x !== a) : [...n.audience, a] });

  return (
    <div className="space-y-5">
      <PageHeader icon={Megaphone} title="Notice & Announcements" sub="Create and manage notices, exam updates, holidays and send to students & parents." />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat icon={Megaphone} tone="purple" label="Total Notices" value={st.total ?? '–'} />
        <Stat icon={Send} tone="green" label="Published" value={st.published ?? 0} />
        <Stat icon={Clock} tone="orange" label="Scheduled" value={st.scheduled ?? 0} />
        <Stat icon={FilePen} tone="red" label="Drafts" value={st.draft ?? 0} />
        <Stat icon={Eye} tone="blue" label="Total Views" value={(st.views ?? 0).toLocaleString('en-IN')} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card>
          <Tabs value={f.type} onChange={(v) => set({ type: v })} tabs={[['all', 'All Notices'], ['exam', 'Exams'], ['holiday', 'Holidays'], ['event', 'Events'], ['general', 'General']]} />
          <div className="relative my-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="inp pl-9" placeholder="Search notice…" value={f.q} onChange={(e) => set({ q: e.target.value })} /></div>
          <Table loading={isLoading} rows={data?.data} empty="No notices yet" cols={[
            { h: 'Title', render: (x) => <div><div className="flex items-center gap-2 font-semibold">{x.title}<Badge tone={tone[x.type]} className="px-2 py-0.5 text-[10px] capitalize">{x.type}</Badge></div><div className="max-w-[200px] truncate text-xs text-ink-500">{x.body}</div></div> },
            { h: 'Status', render: (x) => <StatusBadge s={x.status} /> },
            { h: 'Date', render: (x) => <span className="text-xs">{fmtDate(x.publishedAt || x.scheduledAt || x.createdAt, { day: '2-digit', month: 'short' })}</span> },
            { h: 'Views', render: (x) => <span className="flex items-center gap-1"><Eye className="h-4 w-4 text-brand-600" />{x.views}</span> },
            { h: 'Actions', render: (x) => <div className="flex gap-2"><button onClick={() => { setEditId(x._id); setN({ ...blank, ...x, scheduledAt: x.scheduledAt?.slice(0, 16) || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil className="h-4 w-4 text-brand-600" /></button><button onClick={() => del(x)}><Trash2 className="h-4 w-4 text-red-500" /></button></div> },
          ]} />
          <Pager page={f.page} pages={data?.pages || 1} total={data?.total || 0} limit={limit} onPage={(p) => setF({ ...f, page: p })} label="notices" />
        </Card>

        <div className="space-y-5">
          <Card title={editId ? 'Edit Notice' : 'Create New Notice'} icon={Megaphone}>
            <div className="mb-3 grid grid-cols-2 gap-2">{TYPES.map(([k, , l, d, I]) => <button key={k} onClick={() => setN({ ...n, type: k })} className={cn('flex items-center gap-2 rounded-xl border p-2 text-left', n.type === k ? 'border-brand-500 bg-brand-50' : 'bg-white')}><I className="h-5 w-5 shrink-0 text-brand-600" /><span className="text-xs font-bold leading-tight">{l}</span></button>)}</div>
            <div className="space-y-3">
              <Field label="Title" required><input className="inp" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} /></Field>
              <Field label="Message"><textarea rows={4} className="inp" value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} /></Field>
              <Field label="Schedule (optional)"><input type="datetime-local" className="inp" value={n.scheduledAt} onChange={(e) => setN({ ...n, scheduledAt: e.target.value })} /></Field>
            </div>
          </Card>
          <Card title="Send to Audience">
            <div className="space-y-2">{['students', 'parents', 'teachers'].map((a) => <label key={a} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={n.audience.includes(a)} onChange={() => toggleAud(a)} />{a}</label>)}</div>
            <div className="my-3 flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-sm font-semibold"><span>Also send on WhatsApp</span><Toggle checked={n.whatsapp} onChange={(v) => setN({ ...n, whatsapp: v })} /></div>
            <div className="grid grid-cols-[auto_1fr] gap-2"><button className="btn border" onClick={() => submit('draft')}>Save draft</button><button className="btn-primary" onClick={() => submit('published')}><Send className="h-4 w-4" />{n.scheduledAt ? 'Schedule' : 'Publish'}</button></div>
            {editId && <button className="mt-2 w-full text-xs text-slate-500 underline" onClick={() => { setEditId(null); setN(blank); }}>Cancel editing</button>}
          </Card>
        </div>
      </div>
    </div>
  );
}
