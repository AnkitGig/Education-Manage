'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Phone, Mail, MessageCircle, FileText, ExternalLink, Upload } from 'lucide-react';
import { useApi, api, run, fmtDate } from '@/lib/client';
import { StatusBadge, Badge, Avatar, Card, Spinner, Modal, Field, Tabs, Table, inr } from '@/components/ui';

const MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque'];

function Rows({ rows }) {
  return (
    <dl className="divide-y divide-ink/[.06] text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 py-2.5">
          <dt className="shrink-0 text-ink-400">{k}</dt>
          <dd className="text-right font-medium text-ink">{v || '–'}</dd>
        </div>
      ))}
    </dl>
  );
}

function Metric({ label, value, tone = 'text-ink', sub }) {
  return (
    <div className="rounded-xl border border-ink/[.08] bg-white p-4">
      <div className="text-xs text-ink-400">{label}</div>
      <div className={`mt-1 text-xl font-bold ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tab, setTab] = useState('profile');
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');

  const { data: s } = useApi(`/api/students/${id}`);
  const { data: summary, mutate: mutateSummary } = useApi(`/api/students/${id}/summary`);

  if (!s) return <div className="flex h-[60vh] items-center justify-center"><Spinner /></div>;

  const fees = summary?.fees || { total: 0, paid: 0, due: 0, records: [] };
  const att = summary?.attendance || { present: 0, absent: 0, late: 0, total: 0, percent: 0 };
  const docs = s.documents || [];

  const openPay = () => { setAmount(String(fees.due || '')); setPayOpen(true); };

  const remove = async () => {
    if (!confirm(`Delete ${s.name}? This can’t be undone.`)) return;
    const ok = await run(() => api(`/api/students/${id}`, 'DELETE'), 'Student deleted');
    if (ok) router.push('/students');
  };

  const collect = async (e) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) return;
    const r = await run(
      () => api('/api/fees/collect', 'POST', { student: id, amount: Number(amount), mode }),
      'Payment recorded'
    );
    if (r) { setPayOpen(false); setAmount(''); mutateSummary(); }
  };

  const remind = () =>
    run(
      () => api('/api/whatsapp/send', 'POST', { scope: 'student', student: id, template: 'fee_due' }),
      'Reminder sent on WhatsApp'
    );

  const tabs = [
    ['profile', 'Profile'],
    ['fees', `Fees${fees.records?.length ? ` (${fees.records.length})` : ''}`],
    ['attendance', 'Attendance'],
    ['documents', `Documents${docs.length ? ` (${docs.length})` : ''}`],
  ];

  return (
    <div className="space-y-6">
      <Link href="/students" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Students
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-ink/[.08] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={s.photo?.url} name={s.name} size={72} />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-ink">{s.name}</h1>
                <StatusBadge s={s.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                {s.course?.name && <Badge tone="purple">{s.course.name}</Badge>}
                {s.batch?.name && <Badge tone="blue">{s.batch.name}</Badge>}
                {s.studentId && <span>ID {s.studentId}</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
                {(s.mobile || s.parentMobile) && (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{s.mobile || s.parentMobile}</span>
                )}
                {s.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{s.email}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fees.due > 0 && (
              <>
                <button onClick={remind} className="btn-outline"><MessageCircle className="h-4 w-4" />Remind</button>
                <button onClick={openPay} className="btn-primary">Collect fee</button>
              </>
            )}
            <Link href={`/students/${id}/edit`} className="btn-outline"><Pencil className="h-4 w-4" />Edit</Link>
            <button onClick={remove} title="Delete student" className="btn-outline text-rose-600 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Fees due" value={inr(fees.due)} tone={fees.due > 0 ? 'text-rose-600' : 'text-emerald-600'} sub={`${inr(fees.paid)} paid`} />
          <Metric label="Attendance" value={`${att.percent}%`} sub={`${att.present} of ${att.total} days`} />
          <Metric label="Admitted" value={fmtDate(s.admissionDate)} />
        </div>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {/* Profile */}
      {tab === 'profile' && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Personal">
            <Rows rows={[
              ['Date of birth', s.dob && fmtDate(s.dob)],
              ['Gender', s.gender],
              ['Blood group', s.bloodGroup],
              ['Mobile', s.mobile],
              ['Email', s.email],
              ['Address', s.address],
            ]} />
          </Card>
          <div className="space-y-5">
            <Card title="Enrollment">
              <Rows rows={[
                ['Class', s.course?.name],
                ['Section', s.batch?.name],
                ['Timing', s.batch?.startTime && s.batch?.endTime && `${s.batch.startTime} – ${s.batch.endTime}`],
                ['Fee plan', `${(s.feePlan || 'monthly').replace('_', ' ')} · ${inr(s.feeAmount)}`],
              ]} />
            </Card>
            <Card title="Parent or guardian">
              <Rows rows={[
                ['Name', s.parentName],
                ['Relation', s.parentRelation || 'Guardian'],
                ['WhatsApp', s.parentMobile],
              ]} />
            </Card>
          </div>
        </div>
      )}

      {/* Fees */}
      {tab === 'fees' && (
        <Card title="Fee records">
          <Table
            empty="No fee records yet."
            rows={fees.records}
            cols={[
              { h: 'Month', render: (r) => <span className="font-semibold text-ink">{r.month || '–'}</span> },
              { h: 'Due date', render: (r) => fmtDate(r.dueDate) },
              { h: 'Amount', render: (r) => inr(r.amount) },
              { h: 'Paid', render: (r) => <span className="font-semibold text-emerald-600">{inr(r.paid)}</span> },
              { h: 'Balance', render: (r) => { const b = r.amount - r.paid; return <span className={b > 0 ? 'font-semibold text-rose-600' : 'text-ink-400'}>{inr(b)}</span>; } },
              { h: 'Status', render: (r) => <StatusBadge s={r.status} /> },
              {
                h: 'Payments',
                render: (r) =>
                  r.payments?.length ? (
                    <div className="space-y-0.5 text-xs text-ink-500">
                      {r.payments.map((p, i) => (
                        <div key={i}>{inr(p.amount)} · {p.mode}{p.receiptNo ? ` · #${p.receiptNo}` : ''}</div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-ink-400">–</span>
                  ),
              },
            ]}
          />
        </Card>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <Card title="Attendance this month" action={<Link href="/attendance" className="text-sm font-semibold text-brand-600 hover:underline">Open attendance</Link>}>
          {att.total === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No attendance marked yet.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-ink">{att.percent}%</span>
                  <span className="text-sm text-ink-400">{att.total} days tracked</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${att.percent}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Present" value={att.present} tone="text-emerald-600" />
                <Metric label="Late" value={att.late} tone="text-amber-600" />
                <Metric label="Absent" value={att.absent} tone="text-rose-600" />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <Card title="Documents" action={<Link href={`/students/${id}/edit`} className="btn-outline text-xs"><Upload className="h-3.5 w-3.5" />Manage</Link>}>
          {docs.length ? (
            <ul className="divide-y divide-ink/[.06]">
              {docs.map((d, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-ink-400" />
                  <span className="flex-1 truncate text-sm font-medium text-ink">{d.name || 'Document'}</span>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" title="Open" className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-50 hover:text-brand-600">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-ink-400">No documents uploaded.</p>
          )}
        </Card>
      )}

      {/* Collect fee */}
      {payOpen && (
        <Modal open onClose={() => setPayOpen(false)} title="Collect fee" width="max-w-md">
          <form onSubmit={collect} className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-ink-50/60 px-4 py-3 text-sm">
              <span className="text-ink-500">Amount due</span>
              <b className="text-rose-600">{inr(fees.due)}</b>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)" required>
                <input type="number" min="1" max={fees.due || undefined} required className="inp" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Mode">
                <select className="inp" value={mode} onChange={(e) => setMode(e.target.value)}>
                  {MODES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setPayOpen(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">Record payment</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}