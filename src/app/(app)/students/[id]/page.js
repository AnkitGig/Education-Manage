'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Phone, Mail, MessageCircle, FileText, ExternalLink, Upload, Printer, Receipt, CheckCircle2, Loader2 } from 'lucide-react';
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
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const { data: s } = useApi(`/api/students/${id}`);
  const { data: summary, mutate: mutateSummary } = useApi(`/api/students/${id}/summary`);

  if (!s) return <div className="flex h-[60vh] items-center justify-center"><Spinner /></div>;

  const fees = summary?.fees || { total: 0, paid: 0, due: 0, records: [] };
  const paymentLogs = summary?.paymentLogs || [];
  const att = summary?.attendance || { present: 0, absent: 0, late: 0, total: 0, percent: 0 };
  const docs = s.documents || [];

  const openPay = () => {
    setAmount(String(fees.due || ''));
    setPaymentSuccess(null);
    setPaying(false);
    setPayOpen(true);
  };

  const closePayModal = () => {
    setPayOpen(false);
    setPaymentSuccess(null);
    setAmount('');
    setPaying(false);
  };

  const remove = async () => {
    if (!confirm(`Delete ${s.name}? This can’t be undone.`)) return;
    const ok = await run(() => api(`/api/students/${id}`, 'DELETE'), 'Student deleted');
    if (ok) router.push('/students');
  };

  const collect = async (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!(payAmt > 0) || paying) return;
    setPaying(true);
    const r = await run(
      () => api('/api/fees/collect', 'POST', { student: id, amount: payAmt, mode }),
      'Payment recorded'
    );
    setPaying(false);
    if (r) {
      mutateSummary();
      setPaymentSuccess({
        amount: payAmt,
        mode,
        receiptNo: r.receiptNo || 'RCP' + String(Date.now()).slice(-5),
        studentName: s?.name,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      });
    }
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
    ['payments', `Payment Logs${paymentLogs.length ? ` (${paymentLogs.length})` : ''}`],
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
              {
                h: 'Month / Installment',
                render: (r) => (
                  <div>
                    <span className="font-semibold text-ink">{r.plan || r.month || '–'}</span>
                    {r.plan && r.month && <span className="block text-[11px] text-ink-400">{r.month}</span>}
                  </div>
                ),
              },
              { h: 'Due date', render: (r) => fmtDate(r.dueDate) },
              { h: 'Amount', render: (r) => inr(r.amount) },
              { h: 'Paid', render: (r) => <span className="font-semibold text-emerald-600">{inr(r.paid)}</span> },
              { h: 'Balance', render: (r) => { const b = r.amount - r.paid; return <span className={b > 0 ? 'font-semibold text-rose-600' : 'text-ink-400'}>{inr(b)}</span>; } },
              { h: 'Status', render: (r) => <StatusBadge s={r.status} /> },
              {
                h: 'Payments',
                render: (r) => {
                  if (r.payments?.length) {
                    return (
                      <div className="space-y-1 text-xs">
                        {r.payments.map((p, i) => (
                          <div key={i} className="flex flex-wrap items-center gap-1.5 text-slate-700">
                            <span className="font-bold text-emerald-600">{inr(p.amount)}</span>
                            <span>•</span>
                            <span className="font-medium">{p.mode || 'Cash'}</span>
                            {p.date && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-slate-600">
                                  {fmtDate(p.date)}
                                </span>
                              </>
                            )}
                            {p.receiptNo && (
                              <span className="font-mono text-[11px] text-slate-400">
                                #{p.receiptNo}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (r.paid > 0) {
                    return (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                        <span className="font-bold text-emerald-600">{inr(r.paid)}</span>
                        {r.updatedAt && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-slate-600">
                              {fmtDate(r.updatedAt)}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }
                  return <span className="text-xs text-ink-400">–</span>;
                },
              },
            ]}
          />
        </Card>
      )}

      {/* Payment Logs */}
      {tab === 'payments' && (
        <Card
          title="Payment Logs"
          action={
            fees.due > 0 ? (
              <button onClick={openPay} className="btn-primary text-xs">
                Collect fee
              </button>
            ) : null
          }
        >
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-xs text-slate-500">Total Collected</span>
              <div className="mt-1 text-lg font-bold text-emerald-600">{inr(fees.paid)}</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-xs text-slate-500">Total Transactions</span>
              <div className="mt-1 text-lg font-bold text-slate-800">{paymentLogs.length}</div>
            </div>
            <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:col-span-1">
              <span className="text-xs text-slate-500">Latest Payment</span>
              <div className="mt-1 text-sm font-bold text-slate-800">
                {paymentLogs.length && paymentLogs[0].date ? fmtDate(paymentLogs[0].date) : '–'}
              </div>
            </div>
          </div>

          <Table
            empty="No payment transactions recorded yet."
            rows={paymentLogs}
            cols={[
              {
                h: 'Receipt #',
                render: (p) => (
                  <span className="font-mono font-bold text-brand-700">
                    {p.receiptNo}
                  </span>
                ),
              },
              {
                h: 'Payment Date',
                render: (p) => (
                  <div>
                    <span className="font-medium text-slate-800">{fmtDate(p.date)}</span>
                    {p.date && (
                      <span className="block text-[11px] text-slate-400">
                        {new Date(p.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                h: 'Towards',
                render: (p) => (
                  <div>
                    <span className="font-semibold text-slate-800">{p.plan || 'Installment'}</span>
                    {p.month && <span className="block text-[11px] text-slate-400">{p.month}</span>}
                    {p.installmentsCount > 1 && (
                      <span className="mt-0.5 inline-block rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                        {p.installmentsCount} installments combined
                      </span>
                    )}
                  </div>
                ),
              },
              {
                h: 'Amount',
                render: (p) => (
                  <span className="font-extrabold text-emerald-600">{inr(p.amount)}</span>
                ),
              },
              {
                h: 'Mode',
                render: (p) => (
                  <Badge tone={p.mode === 'UPI' ? 'purple' : p.mode === 'Online' ? 'green' : 'orange'}>
                    {p.mode || 'Cash'}
                  </Badge>
                ),
              },
              {
                h: '',
                render: (p) => (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReceipt({
                        receiptNo: p.receiptNo,
                        amount: p.amount,
                        name: s.name,
                        class: s.course?.name ? `${s.course.name}${s.batch?.name ? ` · ${s.batch.name}` : ''}` : 'Class',
                        date: fmtDate(p.date),
                        mode: p.mode,
                        plan: p.plan,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    Receipt
                  </button>
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
        <Modal open onClose={closePayModal} title={paymentSuccess ? 'Payment Successful' : 'Collect fee'} width="max-w-md">
          {paymentSuccess ? (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in-75 duration-200">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Payment Done!</h3>
                <p className="text-xs text-ink-500">Fee payment has been recorded successfully.</p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Amount Received</span>
                  <span className="text-base font-bold text-emerald-700">{inr(paymentSuccess.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Receipt No.</span>
                  <span className="font-mono font-semibold text-ink">{paymentSuccess.receiptNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Payment Mode</span>
                  <span className="font-medium text-ink">{paymentSuccess.mode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Student</span>
                  <span className="font-medium text-ink">{paymentSuccess.studentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Date</span>
                  <span className="text-ink-600">{paymentSuccess.date}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const rc = {
                      receiptNo: paymentSuccess.receiptNo,
                      amount: paymentSuccess.amount,
                      mode: paymentSuccess.mode,
                      name: paymentSuccess.studentName,
                      class: s.course?.name || 'Class',
                      date: paymentSuccess.date,
                    };
                    closePayModal();
                    setSelectedReceipt(rc);
                  }}
                  className="btn-outline text-xs"
                >
                  <Receipt className="h-3.5 w-3.5" /> View receipt
                </button>
                <button
                  type="button"
                  onClick={closePayModal}
                  className="btn-primary min-w-[100px] text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={collect} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-ink-50/60 px-4 py-3 text-sm">
                <span className="text-ink-500">Amount due</span>
                <b className="text-rose-600">{inr(fees.due)}</b>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (₹)" required>
                  <input
                    type="number"
                    min="1"
                    max={fees.due || undefined}
                    required
                    disabled={paying}
                    className="inp font-semibold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Mode">
                  <select
                    className="inp"
                    disabled={paying}
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    {MODES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={paying}
                  onClick={closePayModal}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying || !(Number(amount) > 0)}
                  className="btn-primary min-w-[140px] inline-flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record payment</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Modal open onClose={() => setSelectedReceipt(null)} title="Fee receipt" width="max-w-sm">
          <div className="space-y-4 text-ink">
            <div className="rounded-xl bg-brand-50/60 py-5 text-center">
              <div className="text-xs text-ink-500">Amount received</div>
              <div className="mt-1 text-3xl font-black text-brand-700">{inr(selectedReceipt.amount)}</div>
            </div>
            <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
              <dt className="text-ink-400">Receipt no.</dt>
              <dd className="text-right font-mono font-semibold">{selectedReceipt.receiptNo}</dd>
              <dt className="text-ink-400">Student</dt>
              <dd className="text-right font-semibold">{selectedReceipt.name}</dd>
              <dt className="text-ink-400">Class</dt>
              <dd className="text-right font-semibold">{selectedReceipt.class}</dd>
              {selectedReceipt.plan && (
                <>
                  <dt className="text-ink-400">Towards</dt>
                  <dd className="text-right font-medium">{selectedReceipt.plan}</dd>
                </>
              )}
              <dt className="text-ink-400">Date</dt>
              <dd className="text-right font-semibold">{selectedReceipt.date}</dd>
              <dt className="text-ink-400">Payment mode</dt>
              <dd className="text-right">
                <Badge tone={selectedReceipt.mode === 'UPI' ? 'purple' : 'green'}>{selectedReceipt.mode}</Badge>
              </dd>
            </dl>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setSelectedReceipt(null)} className="btn border border-ink/10">Close</button>
              <button type="button" onClick={() => window.print()} className="btn-primary">
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}