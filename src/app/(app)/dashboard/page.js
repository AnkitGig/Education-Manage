'use client';
import Link from 'next/link';
import {
  Database, Users, IndianRupee, Clock, CalendarCheck, UserPlus, MessageCircle,
  CheckCheck, Hourglass, XCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { useApi, api, run, fmtDate } from '@/lib/client';
import { Stat, Card, Table, StatusBadge, Avatar, inr, cn, Spinner, Empty } from '@/components/ui';

const CLASS_STATE = {
  ongoing: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-500',
  upcoming: 'bg-brand-100 text-brand-700',
};

const viewAll = (href) => (
  <Link href={href} className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
);

export default function Dashboard() {
  const { data: d, mutate } = useApi('/api/dashboard');
  const { data: me } = useApi('/api/auth/me');
  if (!d) return <div className="py-24"><Spinner /></div>;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const total = d.feesCollected + d.feesPending;
  const pct = total ? Math.round((d.feesCollected / total) * 100) : 0;
  const ongoing = d.classes.filter((c) => c.state === 'ongoing').length;
  const done = d.classes.filter((c) => c.state === 'completed').length;

  const loadDemo = async () => {
    const r = await run(() => api('/api/setup/demo', 'POST'), 'Sample data loaded');
    if (r) mutate();
  };
  const remind = (r) =>
    run(
      () => api('/api/whatsapp/send', 'POST', { scope: 'student', student: r.student._id, template: 'fee_due' }),
      'Reminder sent on WhatsApp'
    );

  const wa = [
    [MessageCircle, 'text-emerald-600 bg-emerald-50', d.whatsapp.sent, 'Sent'],
    [CheckCheck, 'text-blue-600 bg-blue-50', d.whatsapp.delivered, 'Delivered'],
    [Hourglass, 'text-amber-600 bg-amber-50', d.whatsapp.pending, 'Pending'],
    [XCircle, 'text-red-600 bg-red-50', d.whatsapp.failed, 'Failed'],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-ink">
            {greet}, {me?.name?.split(' ')[0] || 'there'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/attendance" className="btn-outline"><CalendarCheck className="h-4 w-4" />Mark attendance</Link>
          <Link href="/fees" className="btn-outline"><IndianRupee className="h-4 w-4" />Collect fee</Link>
          <Link href="/students/new" className="btn-primary"><UserPlus className="h-4 w-4" />Add student</Link>
        </div>
      </div>

      {d.totalStudents === 0 && (
        <Card className="border-dashed border-brand-300 bg-brand-50/40">
          <Empty
            icon={Database}
            title="No data yet"
            hint="Load sample data or add your first course."
            action={
              <div className="flex flex-wrap justify-center gap-2.5">
                <button className="btn-primary" onClick={loadDemo}><Database className="h-4 w-4" />Load sample data</button>
                <Link href="/courses" className="btn-outline">Add course</Link>
              </div>
            }
          />
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Users} tone="blue" label="Students" value={d.totalStudents} sub={`+${d.studentsThisMonth} this month`} subTone="text-emerald-600" />
        <Stat icon={IndianRupee} tone="green" label="Collected this month" value={inr(d.feesCollected)} sub={`${pct}% of total`} />
        <Stat icon={Clock} tone="red" label="Pending fees" value={inr(d.feesPending)} sub={`${d.pendingStudents} students`} subTone="text-red-500" />
        <Stat icon={CalendarCheck} tone="purple" label="Classes today" value={d.classes.length} sub={`${ongoing} ongoing · ${done} done`} />
      </div>

      {/* Charts + schedule */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Student growth" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={d.growth} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" name="Students" fill="#8257f5" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Fee collection">
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[{ v: d.feesCollected }, { v: d.feesPending || (total ? 0 : 1) }]}
                  dataKey="v" innerRadius={58} outerRadius={80} startAngle={90} endAngle={-270}
                  stroke="none" isAnimationActive={false}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-ink">{pct}%</span>
              <span className="text-xs text-ink-400">collected</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-ink-500"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Collected</span>
              <b className="text-ink">{inr(d.feesCollected)}</b>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-ink-500"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" />Pending</span>
              <b className="text-ink">{inr(d.feesPending)}</b>
            </div>
          </div>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Fee reminders" action={viewAll('/fees?tab=collections')} className="xl:col-span-2">
          <Table
            empty="No pending dues"
            rows={d.dueReminders}
            cols={[
              { h: 'Student', render: (r) => <span className="font-semibold text-ink">{r.student.name}</span> },
              { h: 'Due', render: (r) => <span className="font-semibold">{inr(r.amount - r.paid)}</span> },
              { h: 'Due date', render: (r) => <span className="text-red-500">{fmtDate(r.dueDate, { day: '2-digit', month: 'short' })}</span> },
              {
                h: '',
                render: (r) => (
                  <button onClick={() => remind(r)} className="rounded-lg border border-brand-300 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                    Remind
                  </button>
                ),
              },
            ]}
          />
        </Card>

        <Card title="Today’s classes">
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {d.classes.length === 0 && <p className="py-6 text-center text-sm text-ink-400">No classes today</p>}
            {d.classes.map((c) => (
              <div key={c._id} className="flex items-center gap-3">
                <span className={cn('w-20 shrink-0 rounded-lg py-2 text-center text-xs font-bold', CLASS_STATE[c.state])}>{c.time}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
                  {c.room && <div className="text-xs text-ink-400">{c.room}</div>}
                </div>
                <span className="flex items-center gap-1 text-xs text-ink-500"><Users className="h-3.5 w-3.5" />{c.students}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent students" action={viewAll('/students')} className="xl:col-span-2">
          <Table
            empty="No students yet"
            rows={d.recentStudents}
            cols={[
              { h: 'Name', render: (s) => <div className="flex items-center gap-2.5"><Avatar src={s.photo?.url} name={s.name} size={28} /><span className="font-semibold text-ink">{s.name}</span></div> },
              { h: 'Course', render: (s) => s.course?.name },
              { h: 'Status', render: (s) => <StatusBadge s={s.status} /> },
            ]}
          />
        </Card>

        <Card title="Recent attendance" action={viewAll('/attendance')}>
          <div className="space-y-3">
            {d.recentAttendance.length === 0 && <p className="py-6 text-center text-sm text-ink-400">Nothing marked yet</p>}
            {d.recentAttendance.map((r) => (
              <div key={r.student._id} className="flex items-center gap-3">
                <Avatar src={r.student.photo?.url} name={r.student.name} size={32} />
                <span className="flex-1 truncate text-sm text-ink">{r.student.name}</span>
                <StatusBadge s={r.status} />
              </div>
            ))}
            {d.attendanceDate && <p className="pt-1 text-xs text-ink-400">As of {fmtDate(d.attendanceDate)}</p>}
          </div>
        </Card>
      </div>

      {/* WhatsApp */}
      <Card title="WhatsApp this month" action={<Link href="/whatsapp" className="btn-outline py-1.5">Send message</Link>}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {wa.map(([Icon, color, value, label]) => (
            <div key={label} className="flex items-center gap-3">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', color)}><Icon className="h-5 w-5" /></span>
              <div>
                <div className="text-xl font-bold leading-none text-ink">{value}</div>
                <div className="mt-1 text-xs text-ink-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}