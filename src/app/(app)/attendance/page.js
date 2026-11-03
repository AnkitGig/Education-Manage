'use client';
import { useEffect, useState } from 'react';
import { CalendarCheck, Check, X, Clock, RotateCcw, Save, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from 'recharts';
import { useApi, api, run, todayKey } from '@/lib/client';
import { Card, Avatar, Badge, PageHeader, Toggle, cn } from '@/components/ui';

const OPT = [['present', Check, 'text-emerald-600 bg-emerald-50 accent-emerald-500'], ['absent', X, 'text-red-600 bg-red-50 accent-red-500'], ['late', Clock, 'text-orange-600 bg-orange-50 accent-orange-500']];

export default function Attendance() {
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [date, setDate] = useState(todayKey());
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const { data: courses } = useApi('/api/courses');
  const { data: batches } = useApi(course ? `/api/batches?course=${course}` : null);
  const { data: roll, mutate: mr } = useApi(batch ? `/api/attendance?batch=${batch}&date=${date}` : null);
  const { data: sum, mutate: ms } = useApi(`/api/attendance/summary?date=${date}`);
  const { data: inst, mutate: mi } = useApi('/api/settings');

  useEffect(() => { if (roll) setRows(roll.students); }, [roll]);
  useEffect(() => { if (courses?.data.length && !course) setCourse(courses.data[0]._id); }, [courses, course]);
  useEffect(() => { if (batches?.data.length && !batches.data.find((b) => b._id === batch)) setBatch(batches.data[0]._id); }, [batches, batch]);

  const mark = (id, status) => setRows((r) => r.map((x) => (x._id === id ? { ...x, status } : x)));
  const save = async () => {
    setBusy(true);
    const r = await run(() => api('/api/attendance', 'POST', { batch, date, records: rows.map((x) => ({ student: x._id, status: x.status })) }), null);
    setBusy(false);
    if (r) { run(async () => r, `Attendance saved${r.alerted ? ` · ${r.alerted} parent alert(s) sent` : ''}`); mr(); ms(); }
  };
  const toggleAuto = (v) => run(() => api('/api/settings', 'PUT', { automation: { ...inst.automation, attendanceAlert: v } }), null).then(() => mi());
  const alertParent = (s) => run(() => api('/api/whatsapp/send', 'POST', { scope: 'student', student: s._id, template: 'attendance' }), 'WhatsApp sent');

  const t = sum?.totals || { present: 0, absent: 0, late: 0, total: 0, percent: 0 };
  const batchName = batches?.data.find((b) => b._id === batch)?.name;

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance Management" sub="Mark and track student attendance, and send alerts to parents." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              <label><span className="lbl">Course</span><select className="inp" value={course} onChange={(e) => { setCourse(e.target.value); setBatch(''); }}>{courses?.data.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
              <label><span className="lbl">Batch</span><select className="inp" value={batch} onChange={(e) => setBatch(e.target.value)}>{batches?.data.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></label>
              <label><span className="lbl">Date</span><input type="date" className="inp" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} /></label>
            </div>
          </Card>
          <Card title="Mark Attendance" icon={CalendarCheck} action={<div className="flex items-center gap-3 text-sm">{batchName && <Badge tone="purple">{batchName}</Badge>}<span>Total: {rows.length} Students</span>{roll?.saved && <Badge tone="green">Saved</Badge>}</div>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs font-semibold text-slate-500"><th className="px-3 py-3">#</th><th className="px-3">Student Name</th>{OPT.map(([k, I, c]) => <th key={k} className="px-3 text-center"><span className={cn('inline-flex items-center gap-1 rounded-md px-3 py-1 capitalize', c.split(' ').slice(0, 2).join(' '))}><I className="h-3.5 w-3.5" />{k}</span></th>)}</tr></thead>
                <tbody>
                  {rows.map((s, i) => (
                    <tr key={s._id} className="border-b last:border-0">
                      <td className="px-3 py-3">{i + 1}</td>
                      <td className="px-3"><div className="flex items-center gap-2"><Avatar src={s.photo?.url} name={s.name} size={34} /><div><div className="font-semibold">{s.name}</div><div className="text-xs text-slate-500">ID: {s.studentId}</div></div></div></td>
                      {OPT.map(([k, , c]) => <td key={k} className="px-3 text-center"><input type="radio" name={s._id} checked={s.status === k} onChange={() => mark(s._id, k)} className={cn('h-5 w-5', c.split(' ')[2])} /></td>)}
                    </tr>
                  ))}
                  {!rows.length && <tr><td colSpan={5} className="py-10 text-center text-slate-400">{batch ? 'No active students in this batch' : 'Select a course and batch'}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={(e) => e.target.checked && setRows((r) => r.map((x) => ({ ...x, status: 'present' })))} />Select All Present</label>
              <div className="flex gap-2"><button className="btn-outline" onClick={() => roll && setRows(roll.students)}><RotateCcw className="h-4 w-4" />Reset</button><button className="btn-primary" disabled={!rows.length || busy} onClick={save}><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save Attendance'}</button></div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Today’s Attendance" icon={CalendarCheck}>
            <div className="flex items-center gap-5">
              <div className="relative h-36 w-36 shrink-0">
                <ResponsiveContainer><PieChart><Pie data={t.total ? [{ v: t.present + t.late }, { v: t.absent }] : [{ v: 1 }]} dataKey="v" innerRadius={48} outerRadius={64} stroke="none" isAnimationActive={false}><Cell fill={t.total ? '#22c55e' : '#e5e7eb'} /><Cell fill="#ef4444" /></Pie></PieChart></ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><b className="text-2xl">{t.percent}%</b><span className="text-xs text-slate-500">Present</span></div>
              </div>
              <dl className="flex-1 space-y-2 text-sm">{[['bg-emerald-500', 'Present', t.present], ['bg-red-500', 'Absent', t.absent], ['bg-orange-400', 'Late', t.late], ['bg-slate-300', 'Total Students', t.total]].map(([c, l, v]) => <div key={l} className="flex items-center justify-between border-b pb-1 last:border-0"><dt className="flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-full', c)} />{l}</dt><dd className="font-bold">{v}</dd></div>)}</dl>
            </div>
          </Card>
          <Card title="Attendance Trend (Last 7 Days)">
            <div className="h-44"><ResponsiveContainer><BarChart data={sum?.trend || []} margin={{ top: 18 }}><XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} /><YAxis hide domain={[0, 100]} /><Tooltip formatter={(v) => v + '%'} /><Bar dataKey="percent" fill="#a78bfa" radius={[4, 4, 0, 0]}><LabelList dataKey="percent" position="top" fontSize={11} formatter={(v) => (v ? v + '%' : '')} /></Bar></BarChart></ResponsiveContainer></div>
          </Card>
          <Card title="Absent Students (Today)" action={<Badge tone="red">{sum?.absent.length || 0} Students</Badge>}>
            <div className="space-y-3">
              {!sum?.absent.length && <p className="text-sm text-slate-400">Nobody is absent 🎉</p>}
              {sum?.absent.map((s) => (
                <div key={s._id} className="flex items-center gap-3"><Avatar src={s.photo?.url} name={s.name} size={38} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{s.name} ({s.studentId})</div><div className="truncate text-xs text-slate-500">{s.batch?.name} – {s.course?.name}</div></div><button className="btn-green px-3 py-1.5 text-xs" onClick={() => alertParent(s)}><MessageCircle className="h-3.5 w-3.5" />Send</button></div>
              ))}
            </div>
          </Card>
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
            <MessageCircle className="h-9 w-9 text-emerald-600" /><div className="flex-1"><div className="font-bold">Auto WhatsApp Alert to Parents</div><div className="text-xs text-slate-600">Send absent notification automatically when you save attendance.</div></div>
            <Toggle checked={inst?.automation?.attendanceAlert !== false} onChange={toggleAuto} />
          </div>
        </div>
      </div>
    </div>
  );
}
