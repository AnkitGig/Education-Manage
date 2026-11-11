'use client';
import { useState } from 'react';
import { BookOpen, Layers, Users, UserCog, Plus, Pencil, Trash2, Search, GraduationCap } from 'lucide-react';
import { useApi, api, run, fmtTime } from '@/lib/client';
import { Stat, Card, Table, Modal, Field, Badge, StatusBadge, Avatar, PageHeader, Tabs, inr, cn } from '@/components/ui';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLANS = [
  ['monthly', 'Monthly', 1],
  ['quarterly', 'Quarterly', 3],
  ['half_yearly', 'Half-yearly', 6],
  ['yearly', 'Yearly', 12],
];

/* ---------- Class modal ---------- */

function CourseModal({ initial, onClose, onSaved }) {
  const [v, setV] = useState(
    initial || { name: '', board: 'CBSE', durationMonths: 12, status: 'active', fees: [] }
  );
  const [busy, setBusy] = useState(false);
  const fee = (plan) => v.fees?.find((x) => x.plan === plan)?.amount || '';

  const save = async () => {
    if (!v.name.trim()) return;
    setBusy(true);
    const body = {
      ...v,
      fees: PLANS.map(([plan, , months]) => ({ plan, months, amount: Number(fee(plan)) || 0 })),
    };
    const r = await run(
      () => (initial ? api(`/api/courses/${initial._id}`, 'PUT', body) : api('/api/courses', 'POST', body)),
      'Class saved'
    );
    setBusy(false);
    if (r) { onSaved(r); onClose(); }
  };

  const setFee = (plan, amount) =>
    setV({
      ...v,
      fees: PLANS.map(([p, , m]) => ({ plan: p, months: m, amount: p === plan ? amount : fee(p) })),
    });

  return (
    <Modal open onClose={onClose} title={initial ? 'Edit class' : 'New class'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Class name" required className="sm:col-span-2">
          <input className="inp" placeholder="e.g. Class 10" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Board">
          <input className="inp" placeholder="CBSE, ICSE, State" value={v.board || ''} onChange={(e) => setV({ ...v, board: e.target.value })} />
        </Field>
        <Field label="Duration (months)">
          <input type="number" min="1" className="inp" value={v.durationMonths} onChange={(e) => setV({ ...v, durationMonths: Number(e.target.value) })} />
        </Field>
        <div className="sm:col-span-2">
          <div className="mb-2 text-sm font-semibold text-ink">Fees (₹)</div>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(([p, label]) => (
              <Field key={p} label={label}>
                <input type="number" min="0" className="inp" value={fee(p)} onChange={(e) => setFee(p, e.target.value)} />
              </Field>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn border border-ink/10" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy || !v.name.trim()} onClick={save}>Save class</button>
      </div>
    </Modal>
  );
}

/* ---------- Section modal ---------- */

function BatchModal({ initial, courseId, onClose, onSaved }) {
  const { data: staff } = useApi('/api/staff?type=Teaching&limit=100');
  const teachers = staff?.data || [];
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({
    name: initial?.name || '',
    teacher: initial?.teacher?._id || (typeof initial?.teacher === 'string' ? initial.teacher : ''),
    startTime: initial?.startTime || '08:00',
    endTime: initial?.endTime || '14:00',
    days: initial?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    room: initial?.room || '',
    timetable: initial?.timetable || [],
  });

  const subject = (d) => v.timetable.find((t) => t.day === d)?.subject || '';
  const setSubject = (d, s) =>
    setV({ ...v, timetable: [...v.timetable.filter((t) => t.day !== d), { day: d, subject: s }] });
  const toggle = (d) =>
    setV({ ...v, days: v.days.includes(d) ? v.days.filter((x) => x !== d) : [...v.days, d] });

  const save = async () => {
    if (!v.name.trim()) return;
    setBusy(true);
    const body = {
      name: v.name,
      course: initial?.course?._id || initial?.course || courseId,
      teacher: v.teacher || null,
      startTime: v.startTime,
      endTime: v.endTime,
      room: v.room,
      days: v.days,
      timetable: v.days.map((d) => ({ day: d, subject: subject(d) })),
    };
    const r = await run(
      () => (initial ? api(`/api/batches/${initial._id}`, 'PUT', body) : api('/api/batches', 'POST', body)),
      'Section saved'
    );
    setBusy(false);
    if (r) { onSaved(); onClose(); }
  };

  return (
    <Modal open onClose={onClose} title={initial ? 'Edit section' : 'New section'} width="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Section name" required>
          <input className="inp" placeholder="e.g. A" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Class teacher">
          <select className="inp" value={v.teacher || ''} onChange={(e) => setV({ ...v, teacher: e.target.value })}>
            <option value="">Not assigned</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Starts"><input type="time" className="inp" value={v.startTime} onChange={(e) => setV({ ...v, startTime: e.target.value })} /></Field>
        <Field label="Ends"><input type="time" className="inp" value={v.endTime} onChange={(e) => setV({ ...v, endTime: e.target.value })} /></Field>
        <Field label="Room" className="sm:col-span-2">
          <input className="inp" placeholder="e.g. Room 102" value={v.room} onChange={(e) => setV({ ...v, room: e.target.value })} />
        </Field>

        <div className="sm:col-span-2">
          <div className="mb-2 text-sm font-semibold text-ink">School days</div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggle(d)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                  v.days.includes(d) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/10 bg-white hover:bg-ink-50'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {v.days.length > 0 && (
          <div className="sm:col-span-2">
            <div className="mb-2 text-sm font-semibold text-ink">Subject per day</div>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.filter((d) => v.days.includes(d)).map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <span className="w-9 text-xs font-bold text-ink-400">{d}</span>
                  <input className="inp text-sm" placeholder="Subject" value={subject(d)} onChange={(e) => setSubject(d, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn border border-ink/10" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy || !v.name.trim()} onClick={save}>Save section</button>
      </div>
    </Modal>
  );
}

/* ---------- Page ---------- */

export default function Courses() {
  const { data: courses, mutate: mc } = useApi('/api/courses');
  const { data: staffStats } = useApi('/api/staff?type=Teaching&limit=1');
  const [selId, setSelId] = useState(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('sections');
  const [ttId, setTtId] = useState(null);
  const [cm, setCm] = useState(null); // { initial? }
  const [bm, setBm] = useState(null);

  const all = courses?.data || [];
  const list = all.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const sel = all.find((c) => c._id === selId) || all[0];
  const { data: batches, mutate: mb } = useApi(sel ? `/api/batches?course=${sel._id}` : null);
  const sections = batches?.data || [];
  const ttBatch = sections.find((b) => b._id === ttId) || sections[0];
  const totals = all.reduce((a, c) => ({ s: a.s + c.students, b: a.b + c.batches }), { s: 0, b: 0 });

  const delBatch = async (b) => {
    if (!confirm(`Delete section ${b.name}?`)) return;
    await run(() => api(`/api/batches/${b._id}`, 'DELETE'), 'Section deleted');
    mb(); mc();
  };

  const delCourse = async () => {
    if (!confirm(`Delete ${sel.name}? Its sections and students will remain.`)) return;
    await run(() => api(`/api/courses/${sel._id}`, 'DELETE'), 'Class deleted');
    setSelId(null); mc();
  };

  const timetableRows = ttBatch
    ? (ttBatch.timetable?.length ? ttBatch.timetable : (ttBatch.days || []).map((d) => ({ day: d, subject: '' }))).map((t) => ({ _id: t.day, ...t }))
    : [];

  return (
    <div className="space-y-5">
      <PageHeader icon={GraduationCap} title="Classes & sections">
        <button className="btn-primary" onClick={() => setCm({})}><Plus className="h-4 w-4" />Add class</button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={BookOpen} tone="green" label="Classes" value={courses ? all.length : '–'} />
        <Stat icon={Layers} tone="purple" label="Sections" value={totals.b} />
        <Stat icon={Users} tone="blue" label="Students" value={totals.s} />
        <Stat icon={UserCog} tone="orange" label="Teachers" value={staffStats?.stats?.teachersCount ?? 0} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Class list */}
        <Card>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input className="inp pl-9" placeholder="Search classes" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="space-y-1">
            {list.map((c) => (
              <button
                key={c._id}
                onClick={() => { setSelId(c._id); setTtId(null); }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition',
                  sel?._id === c._id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-ink-50'
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-ink-400">{c.batches} sections · {c.students} students</span>
                </span>
              </button>
            ))}
            {!list.length && (
              <p className="py-8 text-center text-sm text-ink-400">{all.length ? 'No match.' : 'No classes yet.'}</p>
            )}
          </div>
        </Card>

        {/* Class detail */}
        {sel ? (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-ink">{sel.name}</h2>
                  <StatusBadge s={sel.status} />
                </div>
                <p className="mt-1 text-sm text-ink-400">
                  {[sel.board, sel.durationMonths && `${sel.durationMonths} months`, `${sel.students} students`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => setCm({ initial: sel })}><Pencil className="h-4 w-4" />Edit</button>
                <button className="btn-outline text-rose-600 hover:bg-rose-50" title="Delete class" onClick={delCourse}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-4">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  ['sections', `Sections (${sections.length})`],
                  ['timetable', 'Timetable'],
                  ['fees', 'Fees'],
                ]}
              />
            </div>

            {tab === 'sections' && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-end">
                  <button className="btn-outline text-xs h-9" onClick={() => setBm({})}><Plus className="h-3.5 w-3.5" />Add section</button>
                </div>
                <Table
                  rows={sections}
                  empty="No sections yet."
                  cols={[
                    { h: 'Section', render: (b) => <span className="font-semibold text-ink">{b.name}</span> },
                    {
                      h: 'Class teacher',
                      render: (b) =>
                        b.teacher ? (
                          <div className="flex items-center gap-2">
                            <Avatar src={b.teacher.photo?.url} name={b.teacher.name} size={28} />
                            <span className="font-medium text-ink">{b.teacher.name}</span>
                          </div>
                        ) : (
                          <span className="text-ink-400">Not assigned</span>
                        ),
                    },
                    { h: 'Students', render: (b) => b.students },
                    {
                      h: 'Timing',
                      render: (b) => (
                        <div>
                          <div>{fmtTime(b.startTime)} – {fmtTime(b.endTime)}</div>
                          <div className="text-xs text-ink-400">{b.days?.join(', ')}</div>
                        </div>
                      ),
                    },
                    {
                      h: '',
                      render: (b) => (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setBm({ initial: b })} title="Edit" className="rounded-lg p-1.5 text-ink-400 hover:bg-brand-50 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => delBatch(b)} title="Delete" className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {tab === 'timetable' && (
              <div className="mt-4 space-y-3">
                {sections.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-400">Add a section to set up its timetable.</p>
                ) : (
                  <>
                    <select className="inp w-auto" value={ttBatch?._id || ''} onChange={(e) => setTtId(e.target.value)}>
                      {sections.map((b) => <option key={b._id} value={b._id}>Section {b.name}</option>)}
                    </select>
                    <Table
                      rows={timetableRows}
                      empty="No timetable set. Edit the section to add one."
                      cols={[
                        { h: 'Day', render: (t) => <span className="font-semibold text-ink">{t.day}</span> },
                        { h: 'Subject', render: (t) => t.subject || '–' },
                        { h: 'Time', render: () => `${fmtTime(ttBatch.startTime)} – ${fmtTime(ttBatch.endTime)}` },
                        { h: 'Teacher', render: () => ttBatch.teacher?.name || '–' },
                      ]}
                    />
                  </>
                )}
              </div>
            )}

            {tab === 'fees' && (
              <div className="mt-4">
                <Table
                  rows={PLANS.map(([p, l, m]) => ({ _id: p, l, m, a: sel.fees?.find((x) => x.plan === p)?.amount || 0 }))}
                  cols={[
                    { h: 'Plan', render: (r) => <span className="font-semibold text-ink">{r.l}</span> },
                    { h: 'Amount', render: (r) => (r.a ? inr(r.a) : <span className="text-ink-400">Not set</span>) },
                    { h: 'Billed every', render: (r) => `${r.m} ${r.m === 1 ? 'month' : 'months'}` },
                    { h: '', render: (r) => (r.a ? <Badge tone="green">Active</Badge> : null) },
                  ]}
                />
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className="py-16 text-center">
              <p className="text-sm text-ink-500">Add your first class to get started.</p>
              <button className="btn-primary mt-3" onClick={() => setCm({})}><Plus className="h-4 w-4" />Add class</button>
            </div>
          </Card>
        )}
      </div>

      {cm && (
        <CourseModal
          key={cm.initial?._id || 'new'}
          initial={cm.initial}
          onClose={() => setCm(null)}
          onSaved={(r) => { mc(); if (!cm.initial && r?._id) setSelId(r._id); }}
        />
      )}
      {bm && sel && (
        <BatchModal
          key={bm.initial?._id || 'new'}
          initial={bm.initial}
          courseId={sel._id}
          onClose={() => setBm(null)}
          onSaved={() => { mb(); mc(); }}
        />
      )}
    </div>
  );
}