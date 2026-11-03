'use client';
import { useState } from 'react';
import Link from 'next/link';
import { IndianRupee, CheckCircle2, Hourglass, Users, Search, Download, Settings2, Plus, FileText, MessageCircle, RefreshCw } from 'lucide-react';
import { useApi, api, run, qs, fmtDate, thisMonth, downloadCSV } from '@/lib/client';
import { Stat, Card, Table, Pager, Tabs, StatusBadge, Avatar, PageHeader, Field, inr } from '@/components/ui';

export default function Fees() {
  const [f, setF] = useState({ status: 'all', q: '', course: '', batch: '', month: thisMonth(), page: 1 });
  const [sid, setSid] = useState('');
  const [pay, setPay] = useState({ amount: '', mode: 'UPI' });
  const limit = 8;
  const set = (o) => setF((x) => ({ ...x, page: 1, ...o }));

  const { data, isLoading, mutate } = useApi(`/api/fees?${qs({ ...f, limit })}`);
  const { data: courses } = useApi('/api/courses');
  const { data: students } = useApi('/api/students?limit=200&status=active');
  const { data: sum, mutate: ms } = useApi(sid ? `/api/students/${sid}/summary` : null);
  const { data: recent, mutate: mr } = useApi('/api/fees/recent');
  const stu = students?.data.find((s) => s._id === sid);
  const st = data?.stats || {};
  const pct = st.total ? Math.round((st.collected / st.total) * 100) : 0;

  const collect = async () => {
    const r = await run(() => api('/api/fees/collect', 'POST', { student: sid, ...pay }), 'Payment collected');
    if (r) { setPay({ ...pay, amount: '' }); mutate(); ms(); mr(); }
  };
  const generate = async () => {
    const r = await run(() => api('/api/fees/generate', 'POST', { month: f.month }), null);
    if (r) { mutate(); run(async () => r, `${r.created} fee record(s) generated for ${f.month}`); }
  };
  const exportCsv = () => downloadCSV(`fees-${f.month}.csv`, [['ID', 'Student', 'Plan', 'Amount', 'Paid', 'Due', 'Status'], ...(data?.data || []).map((r) => [r.student.studentId, r.student.name, r.plan, r.amount, r.paid, r.due, r.status])]);
  const remind = (r) => run(() => api('/api/whatsapp/send', 'POST', { scope: 'student', student: r.student._id, template: 'fee_due' }), 'Reminder sent');

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <PageHeader title="Fees & Payments" sub="Manage fee collection, due reminders, receipts and reports.">
          <button className="btn-outline" onClick={generate}><RefreshCw className="h-4 w-4" />Generate Month Fees</button>
          <button className="btn-outline" onClick={exportCsv}><Download className="h-4 w-4" />Export</button>
        </PageHeader>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Stat icon={IndianRupee} tone="green" label="Total Fees" value={inr(st.total)} />
          <Stat icon={CheckCircle2} tone="purple" label={`Collected (${pct}%)`} value={inr(st.collected)} />
          <Stat icon={Hourglass} tone="red" label={`Pending (${st.total ? 100 - pct : 0}%)`} value={inr(st.pending)} />
          <Stat icon={Users} tone="blue" label="Students Paid" value={`${st.paidStudents ?? 0} / ${st.students ?? 0}`} />
        </div>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={f.status} onChange={(v) => set({ status: v })} tabs={[['all', 'All Fees'], ['paid', 'Paid'], ['due', 'Pending'], ['overdue', 'Overdue'], ['partial', 'Partial']]} />
            <input type="month" className="inp w-auto" value={f.month} onChange={(e) => set({ month: e.target.value })} />
          </div>
          <div className="my-4 flex flex-wrap gap-3">
            <div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="inp pl-9" placeholder="Search by student name, ID or phone…" value={f.q} onChange={(e) => set({ q: e.target.value })} /></div>
            <select className="inp w-auto" value={f.course} onChange={(e) => set({ course: e.target.value })}><option value="">All Courses</option>{courses?.data.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
          </div>
          <Table loading={isLoading} rows={data?.data} onRowClick={(r) => setSid(r.student._id)} activeId={null} empty="No fee records for this month. Click “Generate Month Fees”." cols={[
            { h: 'Student', render: (r) => <div className="flex items-center gap-2.5"><Avatar src={r.student.photo?.url} name={r.student.name} size={34} /><div><div className="font-semibold">{r.student.name}</div><div className="text-xs text-ink-500">{r.student.studentId} · {r.student.course?.name} · {r.student.batch?.name?.split(' ').slice(0, 2).join(' ')}</div></div></div> },
            { h: 'Amount', render: (r) => <div>{inr(r.amount)}<div className="text-[11px] capitalize text-ink-400">{r.plan?.replace('_', ' ')}</div></div> },
            { h: 'Paid', render: (r) => <span className="font-semibold text-emerald-600">{inr(r.paid)}</span> },
            { h: 'Due', render: (r) => <span className={r.due ? 'font-semibold text-red-600' : ''}>{inr(r.due)}</span> },
            { h: 'Status', render: (r) => <StatusBadge s={r.status} /> },
            { h: '', render: (r) => r.due > 0 && <button title="Send WhatsApp reminder" onClick={(e) => { e.stopPropagation(); remind(r); }}><MessageCircle className="h-4 w-4 text-emerald-600" /></button> },
          ]} />
          <Pager page={f.page} pages={data?.pages || 1} total={data?.total || 0} limit={limit} onPage={(p) => setF({ ...f, page: p })} />
        </Card>
      </div>

      <aside className="space-y-5">
        <Card title="Collect Fee" icon={IndianRupee}>
          <div className="space-y-3">
            <Field label="Select Student" required><select className="inp" value={sid} onChange={(e) => setSid(e.target.value)}><option value="">Choose student…</option>{students?.data.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)" required><input type="number" min="1" className="inp" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder={sum ? String(sum.fees.due) : ''} /></Field>
              <Field label="Payment Mode"><select className="inp" value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}>{['UPI', 'Cash', 'Card', 'Bank Transfer', 'Cheque'].map((m) => <option key={m}>{m}</option>)}</select></Field>
            </div>
            <button className="btn-primary w-full" disabled={!sid || !pay.amount} onClick={collect}><IndianRupee className="h-4 w-4" />Collect Payment</button>
          </div>
        </Card>
        {stu && sum && (
          <Card title="Student Fee Detail">
            <div className="mb-3 flex items-center gap-3"><Avatar src={stu.photo?.url} name={stu.name} size={44} /><div className="flex-1"><div className="font-bold">{stu.name} ({stu.studentId})</div><div className="text-xs text-slate-500">{stu.course?.name} – {stu.batch?.name}</div></div><Link href="/students" className="btn-outline py-1 text-xs">Profile</Link></div>
            <dl className="space-y-2 text-sm">
              {[['Fee Plan', `${stu.feePlan?.replace('_', ' ')} (${inr(stu.feeAmount)})`], ['Total Fees', inr(sum.fees.total)], ['Paid Till', sum.fees.paidTill || '–'], ['Next Due Date', fmtDate(sum.fees.nextDue)], ['Outstanding', inr(sum.fees.due)]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-semibold capitalize">{v}</dd></div>)}
            </dl>
          </Card>
        )}
        <Card title="Recent Payments">
          <div className="space-y-3">
            {!recent?.data.length && <p className="text-sm text-slate-400">No payments yet</p>}
            {recent?.data.map((p, i) => (
              <div key={i} className="flex items-center gap-3"><Avatar src={p.photo?.url} name={p.name} size={36} /><div className="flex-1"><div className="text-sm font-semibold">{p.name}</div><span className="rounded bg-brand-50 px-1.5 text-xs text-brand-700">{p.mode}</span></div><div className="text-right"><div className="font-bold text-emerald-600">{inr(p.amount)}</div><div className="text-xs text-slate-400">{fmtDate(p.date, { day: '2-digit', month: 'short' })}</div></div></div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
