'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, GraduationCap, PauseCircle, UserX, Search, Plus, Download, Eye, Pencil, Trash2, Phone, MessageCircle, Mail, X } from 'lucide-react';
import { useApi, api, run, qs, fmtDate, downloadCSV } from '@/lib/client';
import { Stat, Table, Pager, Tabs, StatusBadge, Badge, Avatar, PageHeader, Card, inr } from '@/components/ui';

function Students() {
  const sp = useSearchParams();
  const [f, setF] = useState({ q: sp.get('q') || '', course: '', batch: '', status: 'all', page: 1 });
  const [sel, setSel] = useState(null);
  const limit = 8;
  const set = (o) => setF((x) => ({ ...x, page: 1, ...o }));

  const { data, isLoading, mutate } = useApi(`/api/students?${qs({ ...f, limit })}`);
  const { data: courses } = useApi('/api/courses');
  const { data: batches } = useApi(`/api/batches${f.course ? '?course=' + f.course : ''}`);
  const { data: sum } = useApi(sel ? `/api/students/${sel._id}/summary` : null);
  const st = data?.stats || {};

  const del = async (s) => {
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    await run(() => api(`/api/students/${s._id}`, 'DELETE'), 'Student deleted');
    if (sel?._id === s._id) setSel(null);
    mutate();
  };
  const exportCsv = () => downloadCSV('students.csv', [['ID', 'Name', 'Course', 'Batch', 'Phone', 'Parent', 'Parent Phone', 'Status'], ...(data?.data || []).map((s) => [s.studentId, s.name, s.course?.name, s.batch?.name, s.mobile, s.parentName, s.parentMobile, s.status])]);

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-5">
        <PageHeader icon={Users} title="Students" sub="Manage all student records, admissions and profiles.">
          <button onClick={exportCsv} className="btn-outline"><Download className="h-4 w-4" />Export</button>
          <Link href="/students/new" className="btn-primary"><Plus className="h-4 w-4" />Add Student</Link>
        </PageHeader>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} tone="purple" label="Total Students" value={st.total ?? '–'} />
          <Stat icon={GraduationCap} tone="green" label="Active Students" value={st.active ?? 0} />
          <Stat icon={PauseCircle} tone="orange" label="On Hold" value={st.onhold ?? 0} />
          <Stat icon={UserX} tone="red" label="Inactive" value={st.inactive ?? 0} />
        </div>
        <Card>
          <Tabs value={f.status} onChange={(v) => set({ status: v })} tabs={[['all', `All Students (${st.total ?? 0})`], ['active', `Active (${st.active ?? 0})`], ['onhold', `On Hold (${st.onhold ?? 0})`], ['inactive', `Inactive (${st.inactive ?? 0})`]]} />
          <div className="my-4 flex flex-wrap gap-3">
            <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="inp pl-9" placeholder="Search by name, phone or ID…" value={f.q} onChange={(e) => set({ q: e.target.value })} /></div>
            <select className="inp w-auto" value={f.course} onChange={(e) => set({ course: e.target.value, batch: '' })}><option value="">All Classes</option>{courses?.data.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
            <select className="inp w-auto" value={f.batch} onChange={(e) => set({ batch: e.target.value })}><option value="">All Sections</option>{batches?.data.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select>
          </div>
          <Table loading={isLoading} rows={data?.data} activeId={sel?._id} onRowClick={(s) => setSel(s)} cols={[
            { h: '#', render: (_, i) => (f.page - 1) * limit + i + 1 },
            { h: 'Student Name', render: (s) => (
              <Link href={`/students/${s._id}`} className="flex items-center gap-2 group hover:opacity-90" onClick={(e) => e.stopPropagation()}>
                <Avatar src={s.photo?.url} name={s.name} />
                <div>
                  <div className="font-semibold text-ink group-hover:text-brand-600 transition-colors">{s.name}</div>
                  <div className="text-xs text-slate-500">ID: {s.studentId}</div>
                </div>
              </Link>
            )},
            { h: 'Course', render: (s) => s.course?.name },
            { h: 'Batch', render: (s) => s.batch?.name },
            { h: 'Phone', render: (s) => s.mobile || s.parentMobile },
            { h: 'Fees', render: (s) => (s.due > 0 ? <Badge tone="red">Due {inr(s.due)}</Badge> : <Badge tone="green">Paid</Badge>) },
            { h: 'Status', render: (s) => <StatusBadge s={s.status} /> },
            { h: 'Actions', render: (s) => (
              <div className="flex items-center gap-2 text-slate-500" onClick={(e) => e.stopPropagation()}>
                <Link href={`/students/${s._id}`} title="View Full Profile"><Eye className="h-4 w-4 text-brand-600" /></Link>
                <Link href={`/students/${s._id}/edit`} title="Edit"><Pencil className="h-4 w-4 text-brand-600" /></Link>
                <button onClick={() => del(s)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></button>
              </div>) },
          ]} />
          <Pager page={f.page} pages={data?.pages || 1} total={data?.total || 0} limit={limit} onPage={(p) => setF({ ...f, page: p })} label="students" />
        </Card>
      </div>

      {sel && (
        <><div className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] 2xl:hidden" onClick={() => setSel(null)} />
        <aside className="fixed inset-y-0 right-0 z-40 w-[400px] max-w-full space-y-4 overflow-y-auto bg-surface p-4 shadow-pop 2xl:sticky 2xl:inset-auto 2xl:top-24 2xl:z-auto 2xl:w-auto 2xl:self-start 2xl:overflow-visible 2xl:bg-transparent 2xl:p-0 2xl:shadow-none">
          <Card title="Student Profile" action={<button onClick={() => setSel(null)}><X className="h-5 w-5 text-slate-400" /></button>}>
            <div className="flex gap-4">
              <Avatar src={sel.photo?.url} name={sel.name} size={84} />
              <div className="min-w-0 space-y-1 text-sm">
                <div className="flex items-center gap-2"><h3 className="truncate text-lg font-bold">{sel.name}</h3><StatusBadge s={sel.status} /></div>
                <div className="text-slate-500">ID: {sel.studentId}</div>
                <div className="flex items-center gap-1 text-slate-600"><Phone className="h-3.5 w-3.5 text-brand-600" />{sel.mobile || sel.parentMobile}</div>
                {sel.email && <div className="flex items-center gap-1 truncate text-slate-600"><Mail className="h-3.5 w-3.5 text-brand-600" />{sel.email}</div>}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-[130px_1fr] gap-y-2 text-sm">
              {[['Course', sel.course?.name], ['Batch', sel.batch?.name], ['Admission Date', fmtDate(sel.admissionDate)], ['Parent Name', sel.parentName], ['Parent Phone', sel.parentMobile], ['Address', sel.address || '–']].map(([k, v]) => (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>))}
            </dl>
          </Card>
          <Card title="Fees Summary">
            <div className="grid grid-cols-3 gap-2 text-sm"><div><div className="text-xs text-slate-500">Total Fees</div><b className="text-lg">{inr(sum?.fees.total)}</b></div><div><div className="text-xs text-slate-500">Paid</div><b className="text-lg text-emerald-600">{inr(sum?.fees.paid)}</b></div><div><div className="text-xs text-slate-500">Due</div><b className="text-lg text-red-500">{inr(sum?.fees.due)}</b></div></div>
          </Card>
          <Card title="Attendance (This Month)">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#10b981 ${(sum?.attendance.percent ?? 0) * 3.6}deg, #e5e7eb 0)` }}><div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white text-xl font-bold">{sum?.attendance.percent ?? 0}%</div></div>
              <div className="space-y-1 text-sm"><div>Present: <b>{sum?.attendance.present ?? 0} days</b></div><div>Absent: <b>{sum?.attendance.absent ?? 0} days</b></div><div>Late: <b>{sum?.attendance.late ?? 0} days</b></div></div>
            </div>
          </Card>
          <div className="flex gap-2">
            <Link href={`/students/${sel._id}`} className="btn-primary flex-1"><Eye className="h-4 w-4" />View Full Profile</Link>
            <Link href={`/students/${sel._id}/edit`} className="btn-outline flex-1"><Pencil className="h-4 w-4" />Edit</Link>
          </div>
          <div>
            <button className="btn-green w-full" onClick={() => run(() => api('/api/whatsapp/send', 'POST', { scope: 'student', student: sel._id, template: 'fee_due' }), 'WhatsApp sent')}><MessageCircle className="h-4 w-4" />Send WhatsApp</button>
          </div>
        </aside></>
      )}
    </div>
  );
}

export default function Page() { return <Suspense><Students /></Suspense>; }
