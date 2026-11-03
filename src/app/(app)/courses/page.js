'use client';
import { useState } from 'react';
import { BookOpen, Layers, Users, UserCog, Plus, Pencil, Trash2, Search, Calendar, GraduationCap, IndianRupee } from 'lucide-react';
import { useApi, api, run, fmtTime } from '@/lib/client';
import { Stat, Card, Table, Modal, Field, Badge, StatusBadge, Avatar, PageHeader, Tabs, inr, cn } from '@/components/ui';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLANS = [['monthly', 'Monthly', 1], ['quarterly', 'Quarterly', 3], ['half_yearly', 'Half Yearly', 6], ['yearly', 'Yearly', 12]];

function CourseModal({ open, onClose, initial, onSaved }) {
  const blank = { name: '', board: 'CBSE', durationMonths: 12, status: 'active', fees: PLANS.map(([plan, , months]) => ({ plan, months, amount: 0 })) };
  const [f, setF] = useState(null);
  const v = f || initial || blank;
  const save = async () => {
    const body = { ...v, fees: PLANS.map(([plan, , months]) => ({ plan, months, amount: +(v.fees.find((x) => x.plan === plan)?.amount || 0) })) };
    const r = await run(() => (initial ? api(`/api/courses/${initial._id}`, 'PUT', body) : api('/api/courses', 'POST', body)), 'Course saved');
    if (r) { setF(null); onSaved(r); onClose(); }
  };
  const setFee = (plan, amount) => setF({ ...v, fees: PLANS.map(([p, , m]) => ({ plan: p, months: m, amount: p === plan ? amount : v.fees.find((x) => x.plan === p)?.amount || 0 })) });
  return (
    <Modal open={open} onClose={() => { setF(null); onClose(); }} title={initial ? 'Edit Course' : 'Add Course'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course name" required className="sm:col-span-2"><input className="inp" value={v.name} onChange={(e) => setF({ ...v, name: e.target.value })} /></Field>
        <Field label="Board"><input className="inp" value={v.board || ''} onChange={(e) => setF({ ...v, board: e.target.value })} /></Field>
        <Field label="Duration (months)"><input type="number" className="inp" value={v.durationMonths} onChange={(e) => setF({ ...v, durationMonths: +e.target.value })} /></Field>
        <div className="sm:col-span-2"><span className="lbl">Fee structure (₹)</span>
          <div className="grid grid-cols-2 gap-3">{PLANS.map(([p, l]) => (<label key={p} className="text-xs text-slate-500">{l}<input type="number" min="0" className="inp mt-1" value={v.fees.find((x) => x.plan === p)?.amount || 0} onChange={(e) => setFee(p, +e.target.value)} /></label>))}</div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn border" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Save course</button></div>
    </Modal>
  );
}

function BatchModal({ open, onClose, initial, courseId, onSaved }) {
  const { data: teachers } = useApi(open ? '/api/teachers?all=1' : null);
  const [f, setF] = useState(null);
  const v = f || initial || { name: '', teacher: '', startTime: '08:00', endTime: '10:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], room: '', timetable: [] };
  const toggle = (d) => setF({ ...v, days: v.days.includes(d) ? v.days.filter((x) => x !== d) : [...v.days, d] });
  const subj = (d) => v.timetable?.find((t) => t.day === d)?.subject || '';
  const save = async () => {
    const body = { ...v, course: initial?.course?._id || initial?.course || courseId, teacher: v.teacher?._id || v.teacher || undefined,
      timetable: v.days.map((d) => ({ day: d, subject: subj(d) })) };
    delete body.students;
    const r = await run(() => (initial ? api(`/api/batches/${initial._id}`, 'PUT', body) : api('/api/batches', 'POST', body)), 'Batch saved');
    if (r) { setF(null); onSaved(); onClose(); }
  };
  return (
    <Modal open={open} onClose={() => { setF(null); onClose(); }} title={initial ? 'Edit Batch' : 'Add Batch'} width="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Batch name" required><input className="inp" placeholder="Batch A (Morning)" value={v.name} onChange={(e) => setF({ ...v, name: e.target.value })} /></Field>
        <Field label="Teacher"><select className="inp" value={v.teacher?._id || v.teacher || ''} onChange={(e) => setF({ ...v, teacher: e.target.value })}><option value="">Unassigned</option>{teachers?.data.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Field>
        <Field label="Start time"><input type="time" className="inp" value={v.startTime} onChange={(e) => setF({ ...v, startTime: e.target.value })} /></Field>
        <Field label="End time"><input type="time" className="inp" value={v.endTime} onChange={(e) => setF({ ...v, endTime: e.target.value })} /></Field>
        <Field label="Classroom"><input className="inp" value={v.room || ''} onChange={(e) => setF({ ...v, room: e.target.value })} /></Field>
        <div className="sm:col-span-2"><span className="lbl">Days</span><div className="flex flex-wrap gap-2">{DAYS.map((d) => <button key={d} type="button" onClick={() => toggle(d)} className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', v.days.includes(d) ? 'border-brand-600 bg-brand-600 text-white' : 'bg-white')}>{d}</button>)}</div></div>
        {v.days.length > 0 && <div className="sm:col-span-2"><span className="lbl">Timetable – subject per day</span><div className="grid grid-cols-2 gap-2">{v.days.map((d) => <div key={d} className="flex items-center gap-2"><span className="w-10 text-sm text-slate-500">{d}</span><input className="inp" placeholder="Subject" value={subj(d)} onChange={(e) => setF({ ...v, timetable: [...(v.timetable || []).filter((t) => t.day !== d), { day: d, subject: e.target.value }] })} /></div>)}</div></div>}
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn border" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Save batch</button></div>
    </Modal>
  );
}

export default function Courses() {
  const { data: courses, mutate: mc } = useApi('/api/courses');
  const [selId, setSelId] = useState(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('batches');
  const [cm, setCm] = useState(null); // {initial}
  const [bm, setBm] = useState(null);
  const [tt, setTt] = useState(null);

  const list = (courses?.data || []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const sel = courses?.data.find((c) => c._id === selId) || courses?.data[0];
  const { data: batches, mutate: mb } = useApi(sel ? `/api/batches?course=${sel._id}` : null);
  const ttBatch = batches?.data.find((b) => b._id === tt) || batches?.data[0];
  const totals = (courses?.data || []).reduce((a, c) => ({ s: a.s + c.students, b: a.b + c.batches }), { s: 0, b: 0 });
  const { data: tc } = useApi('/api/teachers?limit=1');

  const delBatch = async (b) => { if (confirm(`Delete ${b.name}?`)) { await run(() => api(`/api/batches/${b._id}`, 'DELETE'), 'Batch deleted'); mb(); mc(); } };
  const delCourse = async () => { if (confirm(`Delete course ${sel.name}? Batches and students linked to it will remain but lose their course.`)) { await run(() => api(`/api/courses/${sel._id}`, 'DELETE'), 'Course deleted'); setSelId(null); mc(); } };

  return (
    <div className="space-y-5">
      <PageHeader icon={BookOpen} title="Courses & Batches" sub="Create courses, manage batches, assign teachers, set timetable and fee structure.">
        <button className="btn-outline" onClick={() => setCm({})}><Plus className="h-4 w-4" />Add Course</button>
        <button className="btn-primary" disabled={!sel} onClick={() => setBm({})}><Plus className="h-4 w-4" />Add Batch</button>
      </PageHeader>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={BookOpen} tone="green" label="Total Courses" value={courses?.data.length ?? '–'} />
        <Stat icon={Layers} tone="purple" label="Total Batches" value={totals.b} />
        <Stat icon={Users} tone="blue" label="Total Students" value={totals.s} />
        <Stat icon={UserCog} tone="orange" label="Teachers" value={tc?.stats?.total ?? 0} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card title={`Courses (${courses?.data.length || 0})`} action={<button className="btn-outline py-1" onClick={() => setCm({})}><Plus className="h-3.5 w-3.5" />Add</button>}>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="inp pl-9" placeholder="Search course…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="space-y-1">
            {list.map((c) => (
              <button key={c._id} onClick={() => setSelId(c._id)} className={cn('flex w-full items-center gap-3 rounded-xl p-3 text-left transition', sel?._id === c._id ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><GraduationCap className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block truncate font-semibold">{c.name}</span><span className="text-xs text-slate-500">{c.students} Students · {c.batches} Batches</span></span>
              </button>
            ))}
            {!list.length && <p className="py-6 text-center text-sm text-slate-400">No courses yet — add your first one.</p>}
          </div>
        </Card>

        {sel ? (
          <div className="space-y-5">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3"><GraduationCap className="h-9 w-9 text-brand-600" /><div><h2 className="flex items-center gap-2 text-xl font-bold">{sel.name} <StatusBadge s={sel.status} /></h2><div className="text-sm text-slate-500">Board: {sel.board || '–'} &nbsp;|&nbsp; Duration: {sel.durationMonths} Months &nbsp;|&nbsp; Students: {sel.students}</div></div></div>
                <div className="flex gap-2"><button className="btn-outline" onClick={() => setCm({ initial: sel })}><Pencil className="h-4 w-4" />Edit Course</button><button className="btn border border-red-200 text-red-600" onClick={delCourse}><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <div className="mt-4"><Tabs value={tab} onChange={setTab} tabs={[['batches', `Batches (${batches?.data.length || 0})`], ['fees', 'Fee Structure']]} /></div>
              {tab === 'batches' ? (
                <div className="mt-4">
                  <Table rows={batches?.data} empty="No batches yet — click Add Batch" cols={[
                    { h: '#', render: (_, i) => i + 1 },
                    { h: 'Batch Name', render: (b) => <button className="font-semibold hover:text-brand-600" onClick={() => setTt(b._id)}>{b.name}</button> },
                    { h: 'Teacher', render: (b) => b.teacher ? <div className="flex items-center gap-2"><Avatar src={b.teacher.photo?.url} name={b.teacher.name} size={28} />{b.teacher.name}</div> : <span className="text-slate-400">Unassigned</span> },
                    { h: 'Students', render: (b) => b.students },
                    { h: 'Schedule', render: (b) => <div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-slate-400" /><span>{fmtTime(b.startTime)} – {fmtTime(b.endTime)}<span className="block text-xs text-slate-400">{b.days?.join(', ')}</span></span></div> },
                    { h: 'Status', render: (b) => <StatusBadge s={b.status} /> },
                    { h: 'Actions', render: (b) => <div className="flex gap-2"><button onClick={() => setBm({ initial: b })}><Pencil className="h-4 w-4 text-brand-600" /></button><button onClick={() => delBatch(b)}><Trash2 className="h-4 w-4 text-red-500" /></button></div> },
                  ]} />
                </div>
              ) : (
                <div className="mt-4"><Table rows={PLANS.map(([p, l, m]) => ({ _id: p, l, m, a: sel.fees?.find((x) => x.plan === p)?.amount || 0 }))} cols={[
                  { h: 'Plan', render: (r) => <b>{r.l}</b> }, { h: 'Fee Amount', render: (r) => inr(r.a) }, { h: 'Duration', render: (r) => `${r.m} ${r.m === 1 ? 'Month' : 'Months'}` }, { h: 'Status', render: (r) => (r.a ? <Badge tone="green">Active</Badge> : <span className="text-slate-400">—</span>) },
                ]} /></div>
              )}
            </Card>
            {tab === 'batches' && ttBatch && (
              <Card title={`Timetable (${ttBatch.name})`}>
                <Table rows={(ttBatch.timetable?.length ? ttBatch.timetable : ttBatch.days?.map((d) => ({ day: d, subject: sel.name }))).map((t) => ({ _id: t.day, ...t }))} empty="No timetable" cols={[
                  { h: 'Day', render: (t) => t.day }, { h: 'Subject', render: (t) => t.subject || '–' }, { h: 'Teacher', render: () => ttBatch.teacher?.name || '–' }, { h: 'Time', render: () => `${fmtTime(ttBatch.startTime)} – ${fmtTime(ttBatch.endTime)}` },
                ]} />
              </Card>
            )}
          </div>
        ) : (
          <Card className="flex items-center justify-center py-20 text-slate-400">Add a course to get started</Card>
        )}
      </div>

      <CourseModal open={!!cm} onClose={() => setCm(null)} initial={cm?.initial} key={'c' + (cm?.initial?._id || 'new') + !!cm} onSaved={(r) => { mc(); if (!cm?.initial) setSelId(r._id); }} />
      <BatchModal open={!!bm} onClose={() => setBm(null)} initial={bm?.initial} courseId={sel?._id} key={'b' + (bm?.initial?._id || 'new') + !!bm} onSaved={() => { mb(); mc(); }} />
    </div>
  );
}
