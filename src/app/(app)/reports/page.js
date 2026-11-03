'use client';
import { useState } from 'react';
import { BarChart3, Users, Layers, IndianRupee, CalendarCheck, UserCog, TrendingUp, Download, FileText, Table2 } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LabelList } from 'recharts';
import { useApi, thisMonth, downloadCSV } from '@/lib/client';
import { Stat, Card, PageHeader, Spinner, inr } from '@/components/ui';

const COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#f472b6', '#14b8a6', '#f97316'];
const short = (v) => { const a = Math.abs(v), s = v < 0 ? '-' : ''; return s + (a >= 1e5 ? (a / 1e5).toFixed(1) + 'L' : a >= 1e3 ? Math.round(a / 1e3) + 'K' : a); };

export default function Reports() {
  const [month, setMonth] = useState(thisMonth());
  const { data: d } = useApi(`/api/reports?month=${month}`);
  if (!d) return <div className="py-24"><Spinner /></div>;
  const c = d.current;
  const total = d.byCourse.reduce((a, x) => a + x.n, 0);

  const exportCsv = () => downloadCSV(`report-${month}.csv`, [
    ['Metric', 'Value'], ['Month', month], ['Total students', d.students], ['Batches', d.batches], ['Teachers', d.teachers], ['Avg attendance %', d.avgAttendance],
    ['Fee income', c.income], ['Salary', c.salary], ['Other expenses', c.expenses], ['Net profit', c.profit], ['Profit margin %', c.margin], [],
    ['Month', 'Income', 'Salary', 'Expenses', 'Profit'], ...d.trend.map((t) => [t.label, t.income, t.salary, t.expenses, t.profit]),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader icon={BarChart3} title="Reports & Analytics" sub="Insights on fees, students, attendance, teachers and profit.">
        <input type="month" className="inp w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
        <button className="btn-primary" onClick={exportCsv}><Download className="h-4 w-4" />Export Report</button>
      </PageHeader>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Users} tone="green" label="Total Students" value={d.students} />
        <Stat icon={Layers} tone="purple" label="Total Batches" value={d.batches} />
        <Stat icon={IndianRupee} tone="blue" label="Fee Collected" value={inr(c.income)} />
        <Stat icon={CalendarCheck} tone="red" label="Avg. Attendance (7d)" value={`${d.avgAttendance}%`} />
        <Stat icon={UserCog} tone="orange" label="Total Teachers" value={d.teachers} />
        <Stat icon={TrendingUp} tone="purple" label="Net Profit" value={inr(c.profit)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Fee Collection Trend (Last 6 Months)">
          <div className="h-60"><ResponsiveContainer><BarChart data={d.trend} margin={{ top: 20 }}><CartesianGrid vertical={false} stroke="#eef" /><XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} /><YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={short} /><Tooltip formatter={(v) => inr(v)} /><Bar dataKey="income" name="Fees" fill="#a78bfa" radius={[4, 4, 0, 0]}><LabelList dataKey="income" position="top" fontSize={11} formatter={short} /></Bar></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="Student Distribution (By Course)">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="relative h-36 w-36 shrink-0"><ResponsiveContainer><PieChart><Pie data={d.byCourse} dataKey="n" innerRadius={42} outerRadius={64} stroke="none" isAnimationActive={false}>{d.byCourse.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><b className="text-2xl">{total}</b><span className="text-xs text-slate-500">Students</span></div></div>
            <ul className="min-w-0 flex-1 space-y-1.5 text-[13px]">{d.byCourse.map((x, i) => <li key={x._id} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="flex-1 truncate">{x.name}</span><span className="text-slate-500">{total ? Math.round((x.n / total) * 100) : 0}%</span><b className="w-8 text-right">{x.n}</b></li>)}</ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Attendance Trend (Last 7 Days)">
          <div className="h-48"><ResponsiveContainer><AreaChart data={d.attendanceTrend}><XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => v + '%'} /><Area dataKey="percent" stroke="#7c3aed" fill="#ddd6fe" /></AreaChart></ResponsiveContainer></div>
        </Card>
        <Card title="Student Growth">
          <div className="h-48"><ResponsiveContainer><BarChart data={d.growth}><XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Students" fill="#a78bfa" radius={[4, 4, 0, 0]}><LabelList dataKey="count" position="top" fontSize={11} /></Bar></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title={`Profit & Loss (${month})`}>
          <dl className="space-y-3 text-sm">{[['Total Income (Fees)', c.income], ['Total Salary', c.salary], ['Other Expenses', c.expenses]].map(([k, v]) => <div key={k} className="flex justify-between border-b pb-2"><dt>{k}</dt><dd className="font-semibold">{inr(v)}</dd></div>)}</dl>
          <div className="mt-3 flex justify-between rounded-xl bg-emerald-50 p-3"><b>Net Profit</b><b className={c.profit < 0 ? 'text-red-600' : 'text-emerald-600'}>{inr(c.profit)}</b></div>
          <div className="mt-3 flex justify-between text-sm text-slate-500"><span>Profit Margin</span><b className="text-slate-900">{c.margin}%</b></div>
        </Card>
      </div>
      <Card title="Download">
        <div className="flex flex-wrap gap-3"><button className="btn-outline" onClick={() => window.print()}><FileText className="h-4 w-4 text-red-500" />Download PDF (print)</button><button className="btn-outline" onClick={exportCsv}><Table2 className="h-4 w-4 text-emerald-600" />Download Excel (CSV)</button></div>
      </Card>
    </div>
  );
}
