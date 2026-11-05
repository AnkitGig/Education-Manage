'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Users, GraduationCap, PauseCircle, UserX, IndianRupee, Plus, Search, Download, Pencil, Trash2, Phone, Mail, X, Upload, BookOpen, CalendarDays, Wallet, Eye } from 'lucide-react';
import { useApi, api, run, qs, fmtDate, upload, downloadCSV, thisMonth } from '@/lib/client';
import { Stat, Card, Table, Pager, Tabs, StatusBadge, Badge, Avatar, PageHeader, Modal, Field, inr } from '@/components/ui';

const SUBJ_TONE = ['purple', 'blue', 'orange', 'green'];

function TeacherModal({ open, onClose, initial, onSaved }) {
  const [f, setF] = useState(null);
  const v = f || (initial ? { ...initial, subjectsText: initial.subjects?.join(', '), joiningDate: initial.joiningDate?.slice(0, 10) } : { name: '', email: '', phone: '', subjectsText: '', salary: '', role: 'Teacher', paymentType: 'Fixed Monthly', joiningDate: '', status: 'active', photo: null });
  const set = (k) => (e) => setF({ ...v, [k]: e.target.value });
  const save = async () => {
    const body = { ...v, subjects: v.subjectsText.split(',').map((s) => s.trim()).filter(Boolean), salary: +v.salary || 0 };
    delete body.subjectsText; if (!body.joiningDate) delete body.joiningDate;
    const r = await run(() => (initial ? api(`/api/teachers/${initial._id}`, 'PUT', body) : api('/api/teachers', 'POST', body)), 'Teacher saved');
    if (r) { setF(null); onSaved(); onClose(); }
  };
  const photo = async (e) => { const file = e.target.files[0]; if (!file) return; const r = await run(() => upload(file, 'teachers')); if (r) setF({ ...v, photo: { url: r.url, publicId: r.publicId } }); };
  return (
    <Modal open={open} onClose={() => { setF(null); onClose(); }} title={initial ? 'Edit Teacher' : 'Add Teacher'} width="max-w-xl">
      <div className="mb-4 flex items-center gap-4"><Avatar src={v.photo?.url} name={v.name || 'T'} size={64} /><label className="btn-outline cursor-pointer"><Upload className="h-4 w-4" />Photo<input hidden type="file" accept="image/*" onChange={photo} /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required><input className="inp" value={v.name} onChange={set('name')} /></Field>
        <Field label="Phone"><input className="inp" value={v.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Email"><input type="email" className="inp" value={v.email || ''} onChange={set('email')} /></Field>
        <Field label="Subjects (comma separated)"><input className="inp" value={v.subjectsText} onChange={set('subjectsText')} placeholder="Maths, Physics" /></Field>
        <Field label="Monthly salary (₹)"><input type="number" className="inp" value={v.salary} onChange={set('salary')} /></Field>
        <Field label="Role"><select className="inp" value={v.role} onChange={set('role')}><option>Teacher</option><option>Senior Teacher</option></select></Field>
        <Field label="Joining date"><input type="date" className="inp" value={v.joiningDate || ''} onChange={set('joiningDate')} /></Field>
        <Field label="Status"><select className="inp" value={v.status} onChange={set('status')}><option value="active">Active</option><option value="onleave">On Leave</option><option value="inactive">Inactive</option></select></Field>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn border" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Save teacher</button></div>
    </Modal>
  );
}

export default function Teachers() {
  const [f, setF] = useState({ status: 'all', q: '', subject: '', page: 1 });
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const limit = 8;
  const set = (o) => setF((x) => ({ ...x, page: 1, ...o }));
  const { data, isLoading, mutate } = useApi(`/api/teachers?${qs({ ...f, limit })}`);
  const { data: sal, mutate: msal } = useApi(sel ? `/api/salary?teacher=${sel._id}` : null);
  const { data: bat } = useApi(sel && tab === 'batches' ? `/api/batches?teacher=${sel._id}` : null);
  const st = data?.stats || {};
  const year = String(new Date().getFullYear());
  const ytd = (sal?.data || []).filter((s) => s.month.startsWith(year));
  const paid = ytd.filter((s) => s.status === 'paid').reduce((a, s) => a + s.amount, 0), pending = ytd.filter((s) => s.status !== 'paid').reduce((a, s) => a + s.amount, 0);

  const del = async (t) => { if (confirm(`Delete ${t.name}?`)) { await run(() => api(`/api/teachers/${t._id}`, 'DELETE'), 'Teacher deleted'); if (sel?._id === t._id) setSel(null); mutate(); } };
  const markSalary = async () => { const r = await run(() => api('/api/salary/process', 'POST', { month: thisMonth(), payTeacher: sel._id }), `Salary for ${thisMonth()} marked paid`); if (r) msal(); };

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-5">
        <PageHeader title="Teachers Management" sub="Manage teacher profiles, subject assignments, classes and salary.">
          <button className="btn-outline" onClick={() => downloadCSV('teachers.csv', [['ID', 'Name', 'Subjects', 'Batches', 'Salary', 'Status'], ...(data?.data || []).map((t) => [t.teacherId, t.name, t.subjects.join('/'), t.batches, t.salary, t.status])])}><Download className="h-4 w-4" />Export</button>
          <button className="btn-primary" onClick={() => setModal({})}><Plus className="h-4 w-4" />Add Teacher</button>
        </PageHeader>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Stat icon={Users} tone="purple" label="Total Teachers" value={st.total ?? '–'} />
          <Stat icon={GraduationCap} tone="green" label="Active" value={st.active ?? 0} />
          <Stat icon={PauseCircle} tone="orange" label="On Leave" value={st.onleave ?? 0} />
          <Stat icon={UserX} tone="red" label="Inactive" value={st.inactive ?? 0} />
          <Stat icon={IndianRupee} tone="blue" label="Monthly Salary" value={inr(st.monthlySalary)} />
        </div>
        <Card>
          <Tabs value={f.status} onChange={(v) => set({ status: v })} tabs={[['all', `All Teachers (${st.total ?? 0})`], ['active', `Active (${st.active ?? 0})`], ['onleave', `On Leave (${st.onleave ?? 0})`], ['inactive', `Inactive (${st.inactive ?? 0})`]]} />
          <div className="my-4 flex flex-wrap gap-3">
            <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="inp pl-9" placeholder="Search by name, phone or subject…" value={f.q} onChange={(e) => set({ q: e.target.value })} /></div>
            <select className="inp w-auto" value={f.subject} onChange={(e) => set({ subject: e.target.value })}><option value="">All Subjects</option>{data?.subjects.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <Table loading={isLoading} rows={data?.data} activeId={sel?._id} onRowClick={(t) => { setSel(t); setTab('overview'); }} empty="No teachers found" cols={[
            { h: '#', render: (_, i) => (f.page - 1) * limit + i + 1 },
            { h: 'Teacher Name', render: (t) => (
              <Link href={`/teachers/${t._id}`} className="flex items-center gap-2 group hover:opacity-90" onClick={(e) => e.stopPropagation()}>
                <Avatar src={t.photo?.url} name={t.name} />
                <div>
                  <div className="font-semibold text-ink group-hover:text-brand-600 transition-colors">{t.name}</div>
                  <div className="text-xs text-slate-500">ID: {t.teacherId}</div>
                </div>
              </Link>
            )},
            { h: 'Subjects', render: (t) => <div className="flex flex-wrap gap-1">{t.subjects.map((s, i) => <Badge key={s} tone={SUBJ_TONE[i % 4]}>{s}</Badge>)}</div> },
            { h: 'Batches', render: (t) => `${t.batches} Batches` },
            { h: 'Salary (Monthly)', render: (t) => <b>{inr(t.salary)}</b> },
            { h: 'Status', render: (t) => <StatusBadge s={t.status} /> },
            { h: 'Actions', render: (t) => (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Link href={`/teachers/${t._id}`} title="View Full Profile"><Eye className="h-4 w-4 text-brand-600" /></Link>
                <button onClick={() => setModal({ initial: t })} title="Edit"><Pencil className="h-4 w-4 text-brand-600" /></button>
                <button onClick={() => del(t)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></button>
              </div>
            )},
          ]} />
          <Pager page={f.page} pages={data?.pages || 1} total={data?.total || 0} limit={limit} onPage={(p) => setF({ ...f, page: p })} label="teachers" />
        </Card>
      </div>

      {sel && (
        <><div className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] 2xl:hidden" onClick={() => setSel(null)} />
        <aside className="fixed inset-y-0 right-0 z-40 w-[400px] max-w-full space-y-4 overflow-y-auto bg-surface p-4 shadow-pop 2xl:sticky 2xl:inset-auto 2xl:top-24 2xl:z-auto 2xl:w-auto 2xl:self-start 2xl:overflow-visible 2xl:bg-transparent 2xl:p-0 2xl:shadow-none">
          <Card title="Teacher Profile" action={<button onClick={() => setSel(null)}><X className="h-5 w-5 text-slate-400" /></button>}>
            <div className="flex gap-4"><Avatar src={sel.photo?.url} name={sel.name} size={80} /><div className="space-y-1 text-sm"><div className="flex items-center gap-2"><h3 className="text-lg font-bold">{sel.name}</h3><StatusBadge s={sel.status} /></div><div className="text-slate-500">ID: {sel.teacherId}</div>{sel.phone && <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-brand-600" />{sel.phone}</div>}{sel.email && <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-brand-600" />{sel.email}</div>}</div></div>
            <div className="mt-4"><Tabs value={tab} onChange={setTab} tabs={[['overview', 'Overview'], ['batches', 'Batches'], ['salary', 'Salary']]} /></div>
            {tab === 'overview' && <dl className="mt-4 grid grid-cols-[130px_1fr] gap-y-2 text-sm">{[['Subjects', sel.subjects.join(', ')], ['Assigned Batches', `${sel.batches} Batches`], ['Joining Date', fmtDate(sel.joiningDate)], ['Salary (Monthly)', inr(sel.salary)], ['Payment Type', sel.paymentType]].map(([k, v]) => (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>))}</dl>}
            {tab === 'batches' && <ul className="mt-4 space-y-2 text-sm">{bat?.data.map((b) => <li key={b._id} className="rounded-lg bg-slate-50 p-2"><b>{b.course?.name}</b> – {b.name}</li>)}{bat && !bat.data.length && <li className="text-slate-400">No batches assigned</li>}</ul>}
            {tab === 'salary' && <ul className="mt-4 space-y-2 text-sm">{sal?.data.slice(0, 6).map((s) => <li key={s._id} className="flex items-center justify-between"><span>{s.month}</span><span>{inr(s.amount)}</span><StatusBadge s={s.status} /></li>)}{sal && !sal.data.length && <li className="text-slate-400">No salary records yet</li>}</ul>}
          </Card>
          <Card title="Salary & Payments">
            <div className="grid grid-cols-3 gap-2 text-sm"><div><div className="text-xs text-slate-500">Total (YTD)</div><b>{inr(paid + pending)}</b></div><div><div className="text-xs text-slate-500">Paid</div><b className="text-emerald-600">{inr(paid)}</b></div><div><div className="text-xs text-slate-500">Pending</div><b className="text-red-500">{inr(pending)}</b></div></div>
          </Card>
          <div className="flex gap-2">
            <Link href={`/teachers/${sel._id}`} className="btn-primary flex-1"><Eye className="h-4 w-4" />View Full Profile</Link>
            <button className="btn-outline flex-1" onClick={() => setModal({ initial: sel })}><Pencil className="h-4 w-4" />Edit</button>
          </div>
          <div>
            <button className="btn-outline w-full" onClick={markSalary}><IndianRupee className="h-4 w-4" />Mark Salary Paid</button>
          </div>
        </aside></>
      )}
      <TeacherModal key={(modal?.initial?._id || 'new') + !!modal} open={!!modal} initial={modal?.initial} onClose={() => setModal(null)} onSaved={mutate} />
    </div>
  );
}
