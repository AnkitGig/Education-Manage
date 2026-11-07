'use client';
import { useState } from 'react';
import { BookOpen, Layers, Users, UserCog, Plus, Pencil, Trash2, Search, Calendar, GraduationCap, IndianRupee, Clock } from 'lucide-react';
import { useApi, api, run, fmtTime } from '@/lib/client';
import { Stat, Card, Table, Modal, Field, Badge, StatusBadge, Avatar, PageHeader, Tabs, inr, cn } from '@/components/ui';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PLANS = [
  ['monthly', 'Monthly', 1],
  ['quarterly', 'Quarterly', 3],
  ['half_yearly', 'Half Yearly', 6],
  ['yearly', 'Yearly', 12],
];

function CourseModal({ open, onClose, initial, onSaved }) {
  const blank = {
    name: '',
    board: 'CBSE',
    durationMonths: 12,
    status: 'active',
    fees: PLANS.map(([plan, , months]) => ({ plan, months, amount: 0 })),
  };
  const [f, setF] = useState(null);
  const v = f || initial || blank;

  const save = async () => {
    const body = {
      ...v,
      fees: PLANS.map(([plan, , months]) => ({
        plan,
        months,
        amount: +(v.fees.find((x) => x.plan === plan)?.amount || 0),
      })),
    };
    const r = await run(
      () => (initial ? api(`/api/courses/${initial._id}`, 'PUT', body) : api('/api/courses', 'POST', body)),
      'Class details saved successfully'
    );
    if (r) {
      setF(null);
      onSaved(r);
      onClose();
    }
  };

  const setFee = (plan, amount) =>
    setF({
      ...v,
      fees: PLANS.map(([p, , m]) => ({
        plan: p,
        months: m,
        amount: p === plan ? amount : v.fees.find((x) => x.plan === p)?.amount || 0,
      })),
    });

  return (
    <Modal open={open} onClose={() => { setF(null); onClose(); }} title={initial ? 'Edit Class' : 'Add New Class'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Class Name (e.g. Class 8, Class 9, Class 10)" required className="sm:col-span-2">
          <input
            className="inp"
            placeholder="e.g. Class 10 (Secondary)"
            value={v.name}
            onChange={(e) => setF({ ...v, name: e.target.value })}
          />
        </Field>
        <Field label="Board / Curriculum">
          <input
            className="inp"
            placeholder="CBSE / ICSE / State Board"
            value={v.board || ''}
            onChange={(e) => setF({ ...v, board: e.target.value })}
          />
        </Field>
        <Field label="Academic Session Duration (months)">
          <input
            type="number"
            className="inp"
            value={v.durationMonths}
            onChange={(e) => setF({ ...v, durationMonths: +e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <span className="lbl">Standard Fee Structure (₹)</span>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(([p, l]) => (
              <label key={p} className="text-xs text-slate-500">
                {l}
                <input
                  type="number"
                  min="0"
                  className="inp mt-1"
                  value={v.fees.find((x) => x.plan === p)?.amount || 0}
                  onChange={(e) => setFee(p, +e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn border" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={save}>
          Save Class
        </button>
      </div>
    </Modal>
  );
}

function BatchModal({ open, onClose, initial, courseId, onSaved }) {
  // Directly query teaching staff for Class Teacher assignment
  const { data: staffData } = useApi(open ? '/api/staff?type=Teaching&limit=100' : null);
  const teachers = staffData?.data || [];

  const [f, setF] = useState(null);
  const v =
    f ||
    initial || {
      name: '',
      teacher: '',
      startTime: '08:00',
      endTime: '14:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      room: '',
      timetable: [],
    };

  const toggle = (d) =>
    setF({
      ...v,
      days: v.days.includes(d) ? v.days.filter((x) => x !== d) : [...v.days, d],
    });

  const subj = (d) => v.timetable?.find((t) => t.day === d)?.subject || '';

  const save = async () => {
    const body = {
      ...v,
      course: initial?.course?._id || initial?.course || courseId,
      teacher: v.teacher?._id || v.teacher || undefined,
      timetable: v.days.map((d) => ({ day: d, subject: subj(d) })),
    };
    delete body.students;
    const r = await run(
      () => (initial ? api(`/api/batches/${initial._id}`, 'PUT', body) : api('/api/batches', 'POST', body)),
      'Section saved & Teacher assigned'
    );
    if (r) {
      setF(null);
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={() => { setF(null); onClose(); }} title={initial ? 'Edit Section' : 'Add Section'} width="max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Section Name" required>
          <input
            className="inp"
            placeholder="e.g. Section A, Section B"
            value={v.name}
            onChange={(e) => setF({ ...v, name: e.target.value })}
          />
        </Field>
        <Field label="Class Teacher (Assigned from Staff)">
          <select
            className="inp"
            value={v.teacher?._id || v.teacher || ''}
            onChange={(e) => setF({ ...v, teacher: e.target.value })}
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.staffId || 'Teacher'}) {t.subjects?.length ? `• ${t.subjects.join(', ')}` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="School Start Time">
          <input
            type="time"
            className="inp"
            value={v.startTime}
            onChange={(e) => setF({ ...v, startTime: e.target.value })}
          />
        </Field>
        <Field label="School End Time">
          <input
            type="time"
            className="inp"
            value={v.endTime}
            onChange={(e) => setF({ ...v, endTime: e.target.value })}
          />
        </Field>
        <Field label="Classroom / Room No.">
          <input
            className="inp"
            placeholder="Room 102, Building A"
            value={v.room || ''}
            onChange={(e) => setF({ ...v, room: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <span className="lbl">Active School Days</span>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggle(d)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                  v.days.includes(d) ? 'border-brand-600 bg-brand-600 text-white' : 'bg-white hover:bg-slate-50'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        {v.days.length > 0 && (
          <div className="sm:col-span-2">
            <span className="lbl">Weekly Timetable (Major Subject per day)</span>
            <div className="grid grid-cols-2 gap-2">
              {v.days.map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <span className="w-10 text-xs font-bold text-slate-500">{d}</span>
                  <input
                    className="inp text-xs"
                    placeholder="e.g. Mathematics / Physics"
                    value={subj(d)}
                    onChange={(e) =>
                      setF({
                        ...v,
                        timetable: [
                          ...(v.timetable || []).filter((t) => t.day !== d),
                          { day: d, subject: e.target.value },
                        ],
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn border" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={save}>
          Save Section
        </button>
      </div>
    </Modal>
  );
}

export default function Courses() {
  const { data: courses, mutate: mc } = useApi('/api/courses');
  const [selId, setSelId] = useState(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('batches');
  const [cm, setCm] = useState(null);
  const [bm, setBm] = useState(null);
  const [tt, setTt] = useState(null);

  const list = (courses?.data || []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const sel = courses?.data.find((c) => c._id === selId) || courses?.data[0];
  const { data: batches, mutate: mb } = useApi(sel ? `/api/batches?course=${sel._id}` : null);
  const ttBatch = batches?.data.find((b) => b._id === tt) || batches?.data[0];
  const totals = (courses?.data || []).reduce((a, c) => ({ s: a.s + c.students, b: a.b + c.batches }), { s: 0, b: 0 });

  // Direct Teacher Count from Staff DB
  const { data: staffStats } = useApi('/api/staff?type=Teaching&limit=1');

  const delBatch = async (b) => {
    if (confirm(`Delete ${b.name}?`)) {
      await run(() => api(`/api/batches/${b._id}`, 'DELETE'), 'Section deleted');
      mb();
      mc();
    }
  };

  const delCourse = async () => {
    if (confirm(`Delete class ${sel.name}? Sections and students linked to it will remain.`)) {
      await run(() => api(`/api/courses/${sel._id}`, 'DELETE'), 'Class deleted');
      setSelId(null);
      mc();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={GraduationCap}
        title="Classes &amp; Sections"
        sub="Organize school classes, allocate sections, assign class teachers from staff, and maintain weekly timetables."
      >
        <button className="btn-outline" onClick={() => setCm({})}>
          <Plus className="h-4 w-4" />
          Add Class
        </button>
        <button className="btn-primary" disabled={!sel} onClick={() => setBm({})}>
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={BookOpen} tone="green" label="Total Classes" value={courses?.data.length ?? '–'} />
        <Stat icon={Layers} tone="purple" label="Total Sections" value={totals.b} />
        <Stat icon={Users} tone="blue" label="Total Enrolled Students" value={totals.s} />
        <Stat icon={UserCog} tone="orange" label="Teaching Staff" value={staffStats?.stats?.teaching ?? 0} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card
          title={`Classes (${courses?.data.length || 0})`}
          action={
            <button className="btn-outline py-1 text-xs" onClick={() => setCm({})}>
              <Plus className="h-3.5 w-3.5" />
              Add Class
            </button>
          }
        >
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="inp pl-9"
              placeholder="Search class…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            {list.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelId(c._id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-3 text-left transition',
                  sel?._id === c._id ? 'bg-brand-50 border border-brand-200 shadow-sm' : 'hover:bg-slate-50'
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-slate-500">
                    {c.students} Students · {c.batches} Sections
                  </span>
                </span>
              </button>
            ))}
            {!list.length && (
              <p className="py-6 text-center text-sm text-slate-400">No classes found — add your first class.</p>
            )}
          </div>
        </Card>

        {sel ? (
          <div className="space-y-5">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-9 w-9 text-brand-600" />
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                      {sel.name} <StatusBadge s={sel.status} />
                    </h2>
                    <div className="text-sm text-slate-500">
                      Board: {sel.board || '–'} &nbsp;|&nbsp; Duration: {sel.durationMonths} Months &nbsp;|&nbsp; Enrolled Students: {sel.students}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline" onClick={() => setCm({ initial: sel })}>
                    <Pencil className="h-4 w-4" />
                    Edit Class
                  </button>
                  <button className="btn border border-red-200 text-red-600 hover:bg-red-50" onClick={delCourse}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <Tabs
                  value={tab}
                  onChange={setTab}
                  tabs={[
                    ['batches', `Sections (${batches?.data.length || 0})`],
                    ['fees', 'Class Fee Structure'],
                  ]}
                />
              </div>

              {tab === 'batches' ? (
                <div className="mt-4">
                  <Table
                    rows={batches?.data}
                    empty="No sections created yet — click Add Section above"
                    cols={[
                      { h: '#', render: (_, i) => i + 1 },
                      {
                        h: 'Section',
                        render: (b) => (
                          <button className="font-semibold text-brand-600 hover:underline" onClick={() => setTt(b._id)}>
                            {b.name}
                          </button>
                        ),
                      },
                      {
                        h: 'Class Teacher',
                        render: (b) =>
                          b.teacher ? (
                            <div className="flex items-center gap-2">
                              <Avatar src={b.teacher.photo?.url} name={b.teacher.name} size={28} />
                              <div>
                                <div className="font-semibold text-ink">{b.teacher.name}</div>
                                <div className="text-[11px] text-ink-400">{b.teacher.staffId || 'Teacher'}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          ),
                      },
                      { h: 'Students', render: (b) => <span className="font-bold">{b.students}</span> },
                      {
                        h: 'Timing & Days',
                        render: (b) => (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>
                              {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                              <span className="block text-xs text-slate-400">{b.days?.join(', ')}</span>
                            </span>
                          </div>
                        ),
                      },
                      { h: 'Status', render: (b) => <StatusBadge s={b.status} /> },
                      {
                        h: 'Actions',
                        render: (b) => (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setBm({ initial: b })}
                              title="Edit Section"
                              className="rounded-lg p-1 text-brand-600 hover:bg-brand-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => delBatch(b)}
                              title="Delete Section"
                              className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <Table
                    rows={PLANS.map(([p, l, m]) => ({
                      _id: p,
                      l,
                      m,
                      a: sel.fees?.find((x) => x.plan === p)?.amount || 0,
                    }))}
                    cols={[
                      { h: 'Plan', render: (r) => <b>{r.l}</b> },
                      { h: 'Fee Amount', render: (r) => inr(r.a) },
                      { h: 'Billing Period', render: (r) => `${r.m} ${r.m === 1 ? 'Month' : 'Months'}` },
                      {
                        h: 'Status',
                        render: (r) =>
                          r.a ? <Badge tone="green">Active</Badge> : <span className="text-slate-400">—</span>,
                      },
                    ]}
                  />
                </div>
              )}
            </Card>

            {tab === 'batches' && ttBatch && (
              <Card title={`Weekly Schedule & Timetable (${sel.name} - ${ttBatch.name})`}>
                <Table
                  rows={(ttBatch.timetable?.length
                    ? ttBatch.timetable
                    : ttBatch.days?.map((d) => ({ day: d, subject: sel.name }))
                  ).map((t) => ({ _id: t.day, ...t }))}
                  empty="No timetable configured"
                  cols={[
                    { h: 'Day', render: (t) => <span className="font-bold">{t.day}</span> },
                    { h: 'Subject', render: (t) => <span className="font-semibold text-brand-700">{t.subject || '–'}</span> },
                    { h: 'Class Teacher', render: () => ttBatch.teacher?.name || '–' },
                    {
                      h: 'Timing',
                      render: () => `${fmtTime(ttBatch.startTime)} – ${fmtTime(ttBatch.endTime)}`,
                    },
                  ]}
                />
              </Card>
            )}
          </div>
        ) : (
          <Card className="flex items-center justify-center py-20 text-slate-400">
            Add a class to get started
          </Card>
        )}
      </div>

      <CourseModal
        open={!!cm}
        onClose={() => setCm(null)}
        initial={cm?.initial}
        key={'c' + (cm?.initial?._id || 'new') + !!cm}
        onSaved={(r) => {
          mc();
          if (!cm?.initial) setSelId(r._id);
        }}
      />
      <BatchModal
        open={!!bm}
        onClose={() => setBm(null)}
        initial={bm?.initial}
        courseId={sel?._id}
        key={'b' + (bm?.initial?._id || 'new') + !!bm}
        onSaved={() => {
          mb();
          mc();
        }}
      />
    </div>
  );
}
