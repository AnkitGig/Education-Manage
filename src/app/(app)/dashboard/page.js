'use client';
import Link from 'next/link';
import { Database, Users, IndianRupee, Clock, CalendarCheck, UserPlus, Send, MessageCircle, CheckCheck, Hourglass, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useApi, api, run, fmtDate } from '@/lib/client';
import { Stat, Card, Table, StatusBadge, Avatar, inr, cn, Spinner, Empty } from '@/components/ui';

const STATE = { ongoing: 'bg-emerald-100 text-emerald-700', completed: 'bg-slate-100 text-slate-500', upcoming: 'bg-brand-100 text-brand-700' };

export default function Dashboard() {
  const { data: d, mutate } = useApi('/api/dashboard');
  const { data: me } = useApi('/api/auth/me');
  if (!d) return <div className="py-24"><Spinner /></div>;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const total = d.feesCollected + d.feesPending;
  const pct = total ? Math.round((d.feesCollected / total) * 100) : 0;
  const ongoing = d.classes.filter((c) => c.state === 'ongoing').length, done = d.classes.filter((c) => c.state === 'completed').length;

  const loadDemo = async () => { const r = await run(() => api('/api/setup/demo', 'POST'), 'Sample data loaded'); if (r) mutate(); };
  const remind = (r) => run(() => api('/api/whatsapp/send', 'POST', { scope: 'student', student: r.student._id, template: 'fee_due' }), 'Reminder sent on WhatsApp');

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b1a6b] via-brand-700 to-brand-500 p-6 text-white shadow-pop sm:p-8">
        <span className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <span className="absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-sky-400/20 blur-2xl" />
        <span className="absolute right-24 top-6 h-24 w-24 rounded-full border border-white/20" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="text-sm font-medium text-white/70">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{greet}, {me?.name?.split(' ')[0] || 'there'} 👋</h1>
            <p className="mt-2 max-w-xl text-white/75">
              {d.classes.length} {d.classes.length === 1 ? 'class' : 'classes'} scheduled today · {d.pendingStudents} {d.pendingStudents === 1 ? 'student has' : 'students have'} pending fees ({inr(d.feesPending)}).
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/students/new" className="btn bg-white text-brand-800 shadow-lg hover:bg-brand-50"><UserPlus className="h-4 w-4" />Add student</Link>
            <Link href="/fees" className="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25"><IndianRupee className="h-4 w-4" />Collect fee</Link>
          </div>
        </div>
      </div>
      {d.totalStudents === 0 && (
        <Card className="border-dashed border-brand-300 bg-brand-50/40">
          <Empty icon={Database} title="Your institute is empty" hint="Start with sample data to explore every screen, or add your first course and student yourself."
            action={<div className="flex flex-wrap justify-center gap-2.5"><button className="btn-primary" onClick={loadDemo}><Database className="h-4 w-4" />Load sample data</button><Link href="/courses" className="btn-outline">Add a course</Link></div>} />
        </Card>
      )}
      <div className="grid gap-5 2xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} tone="blue" label="Total Students" value={d.totalStudents} sub={`+${d.studentsThisMonth} this month`} subTone="text-emerald-600" />
            <Stat icon={IndianRupee} tone="green" label="Fees Collected (month)" value={inr(d.feesCollected)} />
            <Stat icon={Clock} tone="red" label="Pending Fees" value={inr(d.feesPending)} sub={`${d.pendingStudents} students pending`} subTone="text-red-500" />
            <Stat icon={CalendarCheck} tone="purple" label="Today’s Classes" value={d.classes.length} sub={`${ongoing} ongoing, ${done} completed`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card title="Student Overview">
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={d.growth}><CartesianGrid vertical={false} stroke="#eef" /><XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Students" fill="#8257f5" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Fees Collection">
              <div className="flex items-center gap-4">
                <div className="relative h-40 w-40 shrink-0">
                  <ResponsiveContainer>
                    <PieChart><Pie data={[{ v: d.feesCollected }, { v: d.feesPending }]} dataKey="v" innerRadius={52} outerRadius={72} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}><Cell fill="#22c55e" /><Cell fill="#e5e7eb" /></Pie></PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><b>{inr(d.feesCollected)}</b><span className="text-xs text-slate-500">Collected</span></div>
                </div>
                <div className="space-y-3 text-sm">
                  <div><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Collected<div className="font-semibold">{inr(d.feesCollected)} ({pct}%)</div></div>
                  <div><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />Pending<div className="font-semibold">{inr(d.feesPending)} ({total ? 100 - pct : 0}%)</div></div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-1">
            <Card title="Recent Students" action={<Link href="/students" className="text-sm font-semibold text-brand-600">View All</Link>}>
              <Table loading={false} empty="No students yet" rows={d.recentStudents} cols={[
                { h: 'Name', render: (s) => <div className="flex items-center gap-2"><Avatar src={s.photo?.url} name={s.name} size={28} />{s.name}</div> },
                { h: 'Course', render: (s) => s.course?.name },
                { h: 'Status', render: (s) => <StatusBadge s={s.status} /> },
              ]} />
            </Card>
            <Card title="Fee Due Reminders" action={<Link href="/fees" className="text-sm font-semibold text-brand-600">View All</Link>}>
              <Table empty="No pending dues 🎉" rows={d.dueReminders} cols={[
                { h: 'Student', render: (r) => r.student.name },
                { h: 'Amount', render: (r) => inr(r.amount - r.paid) },
                { h: 'Due Date', render: (r) => <span className="text-red-500">{fmtDate(r.dueDate, { day: '2-digit', month: 'short' })}</span> },
                { h: 'Action', render: (r) => <button onClick={() => remind(r)} className="rounded-md border border-brand-300 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">Send</button> },
              ]} />
            </Card>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Card title="WhatsApp Notifications" action={<Link href="/whatsapp" className="btn-outline py-1.5">Send Message</Link>}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[[MessageCircle, 'text-emerald-500 bg-emerald-100', d.whatsapp.sent, 'Sent This Month'], [CheckCheck, 'text-blue-500 bg-blue-100', d.whatsapp.delivered, 'Delivered'], [Hourglass, 'text-amber-500 bg-amber-100', d.whatsapp.pending, 'Pending'], [XCircle, 'text-red-500 bg-red-100', d.whatsapp.failed, 'Failed']].map(([I, c, v, l]) => (
                  <div key={l} className="flex items-center gap-3"><span className={cn('flex h-10 w-10 items-center justify-center rounded-full', c)}><I className="h-5 w-5" /></span><div><div className="text-xl font-bold leading-none">{v}</div><div className="text-xs text-slate-500">{l}</div></div></div>
                ))}
              </div>
            </Card>
            <Card title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                {[['/students/new', UserPlus, 'Add Student', 'bg-gradient-to-br from-sky-500 to-blue-600'], ['/attendance', CalendarCheck, 'Mark Attendance', 'bg-gradient-to-br from-emerald-400 to-teal-600'], ['/fees', IndianRupee, 'Collect Fee', 'bg-gradient-to-br from-brand-500 to-brand-700'], ['/whatsapp', Send, 'Send WhatsApp', 'bg-gradient-to-br from-amber-400 to-orange-500']].map(([h, I, l, c]) => (
                  <Link key={l} href={h} className={cn('flex flex-col items-center gap-1 rounded-xl py-3.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5', c)}><I className="h-5 w-5" />{l}</Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid content-start gap-5 lg:grid-cols-2 2xl:grid-cols-1">
          <Card title="Today’s Classes">
            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {d.classes.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No classes scheduled today</p>}
              {d.classes.map((c) => (
                <div key={c._id} className="flex items-center gap-3">
                  <span className={cn('w-20 shrink-0 rounded-lg py-2 text-center text-xs font-bold', STATE[c.state])}>{c.time}</span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{c.name}</div><div className="text-xs text-slate-500">{c.room || '—'}</div></div>
                  <span className="flex items-center gap-1 text-xs text-slate-500"><Users className="h-3.5 w-3.5" />{c.students}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Recent Attendance" action={<Link href="/attendance" className="text-sm font-semibold text-brand-600">View All</Link>}>
            <div className="space-y-3">
              {d.recentAttendance.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No attendance marked yet</p>}
              {d.recentAttendance.map((r) => (
                <div key={r.student._id} className="flex items-center gap-3"><Avatar src={r.student.photo?.url} name={r.student.name} size={32} /><span className="flex-1 text-sm">{r.student.name}</span><StatusBadge s={r.status} /></div>
              ))}
              {d.attendanceDate && <div className="text-xs text-slate-400">Latest: {fmtDate(d.attendanceDate)}</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
