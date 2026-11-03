'use client';
import { useState } from 'react';
import { IndianRupee, Users, FileText, TrendingUp, Banknote, Plus, Pencil, Trash2, Check, Clock } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApi, api, run, fmtDate, thisMonth } from '@/lib/client';
import { Stat, Card, Table, Tabs, StatusBadge, Avatar, Badge, PageHeader, Modal, Field, inr } from '@/components/ui';

export default function Salary() {
  const [month, setMonth] = useState(thisMonth());
  const [tab, setTab] = useState('payroll');
  const [em, setEm] = useState(null);
  const { data: sum, mutate: ms } = useApi(`/api/salary/summary?month=${month}`);
  const { data: pay, mutate: mp } = useApi(`/api/salary?month=${month}`);
  const { data: exp, mutate: me } = useApi(`/api/expenses?month=${month}&all=1`);
  const c = sum?.current || { income: 0, salary: 0, expenses: 0, profit: 0, margin: 0 };
  const refresh = () => { ms(); mp(); me(); };

  const process = () => run(() => api('/api/salary/process', 'POST', { month }), 'Payroll generated').then(refresh);
  const setPaid = (s, status) => run(() => api(`/api/salary/${s._id}`, 'PUT', { status }), status === 'paid' ? 'Marked as paid' : 'Marked as pending').then(refresh);
  const delExp = async (e) => { if (confirm('Delete this expense?')) { await run(() => api(`/api/expenses/${e._id}`, 'DELETE'), 'Expense deleted'); refresh(); } };
  const saveExp = async () => {
    const body = { ...em, amount: +em.amount };
    const r = await run(() => (em._id ? api(`/api/expenses/${em._id}`, 'PUT', body) : api('/api/expenses', 'POST', body)), 'Expense saved');
    if (r) { setEm(null); refresh(); }
  };
  const cats = ['Rent', 'Electricity', 'Internet & Wi-Fi', 'Stationery', 'Marketing (Ads)', 'Miscellaneous'];

  return (
    <div className="space-y-5">
      <PageHeader title="Salary & Expenses" sub="Manage teacher salaries, institute expenses and view profit reports.">
        <input type="month" className="inp w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
        <button className="btn-outline" onClick={() => setEm({ category: 'Rent', amount: '', date: new Date().toISOString().slice(0, 10), note: '' })}><Plus className="h-4 w-4" />Add Expense</button>
        <button className="btn-primary" onClick={process}><IndianRupee className="h-4 w-4" />Process Salary</button>
      </PageHeader>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat icon={Banknote} tone="green" label="Total Fee Collection" value={inr(c.income)} />
        <Stat icon={Users} tone="purple" label="Staff Salary" value={inr(c.salary)} />
        <Stat icon={FileText} tone="orange" label="Other Expenses" value={inr(c.expenses)} />
        <Stat icon={TrendingUp} tone="blue" label="Net Profit" value={inr(c.profit)} />
        <Stat icon={TrendingUp} tone="green" label="vs. Previous Month" value={`${sum?.vsPrev ?? 0}%`} />
      </div>

      <div className="grid gap-5 2xl:grid-cols-2">
        <Card title="Salary Management" icon={Users}>
          <Tabs value={tab} onChange={setTab} tabs={[['payroll', 'Monthly Payroll']]} />
          <div className="mt-3"><Table rows={pay?.data.map((r) => ({ _id: r.teacher._id, ...r }))} empty="No active teachers. Add teachers first." cols={[
            { h: '#', render: (_, i) => i + 1 },
            { h: 'Teacher', render: (r) => <div className="flex items-center gap-2"><Avatar src={r.teacher.photo?.url} name={r.teacher.name} size={30} /><div><div className="font-semibold">{r.teacher.name}</div><div className="text-xs text-slate-500">{r.teacher.teacherId}</div></div></div> },
            { h: 'Role', render: (r) => <Badge tone={r.teacher.role === 'Senior Teacher' ? 'purple' : 'blue'}>{r.teacher.role}</Badge> },
            { h: 'Salary', render: (r) => inr(r.salary?.amount ?? r.teacher.salary) },
            { h: 'Status', render: (r) => (r.salary ? <StatusBadge s={r.salary.status} /> : <Badge>Not processed</Badge>) },
            { h: 'Action', render: (r) => r.salary && (r.salary.status === 'paid' ? <button className="text-xs text-slate-500 underline" onClick={() => setPaid(r.salary, 'pending')}>Undo</button> : <button className="btn-outline px-2 py-1 text-xs" onClick={() => setPaid(r.salary, 'paid')}><Check className="h-3 w-3" />Mark paid</button>) },
          ]} /></div>
          <div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-sm text-slate-500">Total Salary ({month})</span><b className="text-lg">{inr(c.salary)}</b></div>
        </Card>

        <Card title="Expenses Management" icon={FileText}>
          <Table rows={exp?.data} empty="No expenses this month" cols={[
            { h: '#', render: (_, i) => i + 1 }, { h: 'Category', render: (e) => e.category }, { h: 'Amount', render: (e) => inr(e.amount) }, { h: 'Date', render: (e) => fmtDate(e.date) },
            { h: 'Actions', render: (e) => <div className="flex gap-2"><button onClick={() => setEm({ ...e, date: e.date.slice(0, 10) })}><Pencil className="h-4 w-4 text-brand-600" /></button><button onClick={() => delExp(e)}><Trash2 className="h-4 w-4 text-red-500" /></button></div> },
          ]} />
          <div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-sm text-slate-500">Total Expenses ({month})</span><b className="text-lg">{inr(c.expenses)}</b></div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Income vs Expenses (Last 6 Months)">
          <div className="h-64"><ResponsiveContainer><ComposedChart data={(sum?.trend || []).map((t) => ({ ...t, out: t.salary + t.expenses }))}><CartesianGrid vertical={false} stroke="#eef" /><XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} /><YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => { const a = Math.abs(v), s = v < 0 ? '-' : ''; return s + (a >= 1e5 ? +(a / 1e5).toFixed(1) + 'L' : a >= 1e3 ? Math.round(a / 1e3) + 'K' : a); }} /><Tooltip formatter={(v) => inr(v)} /><Legend /><Bar dataKey="income" name="Income (Fees)" fill="#a78bfa" radius={[4, 4, 0, 0]} /><Bar dataKey="out" name="Expenses" fill="#f9a8d4" radius={[4, 4, 0, 0]} /><Line dataKey="profit" name="Net Profit" stroke="#16a34a" strokeWidth={2} /></ComposedChart></ResponsiveContainer></div>
        </Card>
        <Card title={`Monthly Summary – ${month}`}>
          <dl className="space-y-3 text-sm">{[['Total Income (Fees)', c.income, 'text-slate-900'], ['Total Salary', c.salary, 'text-red-600'], ['Other Expenses', c.expenses, 'text-red-600']].map(([k, v, cl]) => <div key={k} className="flex justify-between border-b pb-2"><dt>{k}</dt><dd className={`font-semibold ${cl}`}>{inr(v)}</dd></div>)}</dl>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 p-3"><b>Net Profit</b><b className={c.profit < 0 ? 'text-red-600' : 'text-emerald-600'}>{inr(c.profit)}</b></div>
          <div className="mt-3 text-center text-sm text-slate-500">Profit margin <b className="text-lg text-slate-900">{c.margin}%</b></div>
        </Card>
      </div>

      <Modal open={!!em} onClose={() => setEm(null)} title={em?._id ? 'Edit Expense' : 'Add Expense'}>
        {em && <><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required><input list="cats" className="inp" value={em.category} onChange={(e) => setEm({ ...em, category: e.target.value })} /><datalist id="cats">{cats.map((x) => <option key={x} value={x} />)}</datalist></Field>
          <Field label="Amount (₹)" required><input type="number" className="inp" value={em.amount} onChange={(e) => setEm({ ...em, amount: e.target.value })} /></Field>
          <Field label="Date"><input type="date" className="inp" value={em.date} onChange={(e) => setEm({ ...em, date: e.target.value })} /></Field>
          <Field label="Note"><input className="inp" value={em.note || ''} onChange={(e) => setEm({ ...em, note: e.target.value })} /></Field>
        </div><div className="mt-5 flex justify-end gap-2"><button className="btn border" onClick={() => setEm(null)}>Cancel</button><button className="btn-primary" disabled={!em.category || !em.amount} onClick={saveExp}>Save expense</button></div></>}
      </Modal>
    </div>
  );
}
