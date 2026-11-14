'use client';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wallet, AlertTriangle, CheckCircle2, Download, Plus, Search,
  MessageCircle, Printer, Pencil, Copy, Trash2, X, ChevronRight, Loader2,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useApi, api, run, qs, thisMonth, downloadCSV } from '@/lib/client';
import {
  Stat, Card, Table, Pager, Tabs, StatusBadge, Badge, Avatar, PageHeader, Modal, Field, inr,
} from '@/components/ui';

const TABS = [
  ['overview', 'Overview'],
  ['structure', 'Fee structures'],
  ['collections', 'Collections'],
  ['receipts', 'Receipts'],
  ['reports', 'Reports'],
];

const STATUS = [
  ['all', 'All'],
  ['due', 'Pending'],
  ['paid', 'Paid'],
];

const MODES = ['UPI', 'Cash', 'Online', 'Card', 'Bank Transfer', 'Cheque'];
const modeTone = (m) => (m === 'Online' ? 'green' : m === 'UPI' ? 'purple' : 'orange');
const LIMIT = 8;

const blankStructure = (course) => ({
  id: '',
  name: course ? `${course.name} - Regular` : '',
  academicSession: '2026 - 2027',
  courseId: course?._id || '',
  section: 'All',
  feeTypes: [{ type: 'Tuition Fee', amount: '', frequency: 'Annual' }],
  enableInstallments: false,
  installments: [],
  applyLateFee: false,
  lateFeeAmount: 100,
  lateFeePeriod: 'Per Day',
  isActive: true,
});

const sum = (rows) => (rows || []).reduce((a, r) => a + (Number(r.amount) || 0), 0);

/* ---------- small shared pieces ---------- */

function SectionHead({ title, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative min-w-56 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input className="inp pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-ink/10 bg-ink-50/60 p-1">
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${value === k ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------- page ---------- */

function FeesContent() {
  const router = useRouter();
  const params = useSearchParams();
  const rawTab = params.get('tab') || 'overview';
  const legacyPending = rawTab === 'pending';

  const [tab, setTab] = useState(legacyPending || rawTab === 'collection' ? 'collections' : rawTab);
  const [status, setStatus] = useState(legacyPending ? 'due' : 'all');
  const [year, setYear] = useState('2026 - 2027');
  const [f, setF] = useState({ q: '', course: '', month: thisMonth(), page: 1 });
  const [classFilter, setClassFilter] = useState('all');
  const [receiptQ, setReceiptQ] = useState('');
  const [receiptMode, setReceiptMode] = useState('');

  const [collectOpen, setCollectOpen] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [sid, setSid] = useState('');
  const [pay, setPay] = useState({ amount: '', mode: 'UPI' });
  const [receipt, setReceipt] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [structOpen, setStructOpen] = useState(false);
  const [form, setForm] = useState(blankStructure());

  const setFilter = (o) => setF((x) => ({ ...x, page: 1, ...o }));

  const { data: dash, mutate: mutateDash } = useApi('/api/fees/dashboard');
  const { data: fees, isLoading: feesLoading, mutate: mutateFees } = useApi(
    tab === 'collections' ? `/api/fees?${qs({ ...f, status: status === 'all' ? '' : status, limit: LIMIT })}` : null
  );
  const { data: courses } = useApi('/api/courses');
  const { data: students } = useApi(collectOpen ? '/api/students?limit=200&status=active' : null);

  const courseList = courses?.data || [];
  const kpis = dash?.kpis || {};
  const chartData = dash?.monthlyOverview || [];
  const recent = dash?.recentCollections || [];
  const alerts = dash?.dueAlerts || { dueIn7Days: 0, overdue: 0, partiallyPaid: 0 };
  const structures = dash?.feeStructures || [];
  const pct = (n) => (kpis.totalFee ? Math.round(((n || 0) / kpis.totalFee) * 100) : 0);

  const changeTab = (t) => {
    setTab(t);
    router.replace(`/fees?tab=${t}`, { scroll: false });
  };

  const receipts = useMemo(() => {
    const q = receiptQ.toLowerCase().trim();
    return recent.filter(
      (r) =>
        (!q || [r.receiptNo, r.name, r.class].some((v) => v?.toLowerCase().includes(q))) &&
        (!receiptMode || r.mode === receiptMode)
    );
  }, [recent, receiptQ, receiptMode]);

  /* ----- actions ----- */

  const openCollect = (student = '', amount = '') => {
    setSid(student);
    setPay({ amount: String(amount || ''), mode: 'UPI' });
    setCollecting(false);
    setCollectOpen(true);
  };

  const collect = async () => {
    if (!sid || !pay.amount || collecting) return;
    setCollecting(true);
    const r = await run(() => api('/api/fees/collect', 'POST', { student: sid, ...pay }), 'Payment collected');
    setCollecting(false);
    if (r) {
      setCollectOpen(false);
      mutateFees?.();
      mutateDash();
      const st = (fees?.data || []).find((x) => String(x.student?._id) === String(sid))?.student;
      if (r.receiptNo) {
        setReceipt({
          receiptNo: r.receiptNo,
          amount: Number(pay.amount),
          name: st?.name || 'Student',
          class: st?.course?.name || 'Class',
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          mode: pay.mode,
        });
      }
    }
  };

  const remind = (id) =>
    run(
      () => api('/api/whatsapp/send', 'POST', { scope: 'student', student: id, template: 'fee_due' }),
      'Reminder sent on WhatsApp'
    );

  const exportReceipts = () =>
    downloadCSV(`receipts_${year}.csv`, [
      ['Receipt', 'Student', 'Class', 'Amount', 'Mode', 'Date'],
      ...receipts.map((r) => [r.receiptNo, r.name, r.class, r.amount, r.mode, r.date]),
    ]);

  const openStructure = (s) => {
    if (!s) return setForm(blankStructure(courseList[0])), setStructOpen(true);
    const feeTypes = s.feeTypes?.length
      ? s.feeTypes.map((t) => ({ ...t }))
      : [{ type: 'Tuition Fee', amount: s.tuition || s.total || 0, frequency: 'Annual' }];
    setForm({
      ...blankStructure(),
      id: s._id || '',
      name: s.name || `${s.class} - Regular`,
      academicSession: s.academicSession || year,
      courseId: s.courseId || '',
      section: s.section || 'All',
      feeTypes,
      enableInstallments: !!s.installments?.length,
      installments: (s.installments || []).map((i) => ({ ...i })),
      applyLateFee: s.applyLateFee ?? false,
      lateFeeAmount: s.lateFeeAmount ?? 100,
      lateFeePeriod: s.lateFeePeriod || 'Per Day',
      isActive: s.isActive ?? true,
    });
    setStructOpen(true);
  };

  const duplicateStructure = (s) => {
    openStructure(s);
    setForm((p) => ({ ...p, id: '', name: `${p.name} (copy)` }));
  };

  const deleteStructure = async (s) => {
    if (!s._id || !confirm(`Delete the fee structure for ${s.class}?`)) return;
    const r = await run(() => api(`/api/fees/structures?id=${s._id}`, 'DELETE'), 'Fee structure deleted');
    if (r) mutateDash();
  };

  const saveStructure = async (e) => {
    e.preventDefault();
    if (!form.courseId) return;
    const r = await run(() => api('/api/fees/structures', 'POST', form), 'Fee structure saved');
    if (r) {
      setStructOpen(false);
      mutateDash();
    }
  };

  const patchForm = (o) => setForm((p) => ({ ...p, ...o }));
  const patchRow = (key, i, o) =>
    setForm((p) => ({ ...p, [key]: p[key].map((r, idx) => (idx === i ? { ...r, ...o } : r)) }));

  const setInstallmentCount = (n) => {
    const total = sum(form.feeTypes);
    const each = Math.floor(total / n);
    const months = [4, 7, 10, 1, 5, 6, 8, 9, 11, 12, 2, 3];
    const list = Array.from({ length: n }, (_, i) => ({
      name: `Installment ${i + 1}`,
      amount: i === n - 1 ? total - each * (n - 1) : each,
      dueDate: `${months[i] >= 4 ? 2026 : 2027}-${String(months[i]).padStart(2, '0')}-10`,
    }));
    patchForm({ installments: list });
  };

  const feeTotal = sum(form.feeTypes);
  const instTotal = sum(form.installments);

  /* ---------- render ---------- */

  return (
    <div className="space-y-5">
      <PageHeader icon={Wallet} title="Fees & accounts" sub="Manage fee structures, student dues, collections and receipts.">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="inp w-auto text-xs font-semibold"
          aria-label="Academic year"
        >
          <option value="2026 - 2027">2026 – 2027</option>
          <option value="2025 - 2026">2025 – 2026</option>
        </select>
        <button onClick={() => openCollect()} className="btn-primary">
          <Plus className="h-4 w-4" /> Collect fee
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={Wallet} tone="blue" label="Total fee" value={inr(kpis.totalFee || 0)} />
        <Stat
          icon={CheckCircle2}
          tone="green"
          label="Collected"
          value={inr(kpis.collectedFees || 0)}
          sub={`${pct(kpis.collectedFees)}% of total`}
        />
        <Stat
          icon={AlertTriangle}
          tone="red"
          label="Pending"
          value={inr(kpis.pendingFees || 0)}
          sub={`${pct(kpis.pendingFees)}% of total`}
        />
      </div>

      <Card>
        <Tabs tabs={TABS} value={tab} onChange={changeTab} />

        {/* ---------------- OVERVIEW ---------------- */}
        {tab === 'overview' && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-ink/[.06] p-5">
              <h3 className="mb-4 text-sm font-bold text-ink">Monthly collection</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                    <YAxis yAxisId="l" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `₹${v}L`} />
                    <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(v, n) => (n === 'Recovery' ? [`${v}%`, n] : [`₹${v} L`, n])}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                    />
                    <Bar yAxisId="l" dataKey="collected" name="Collected" fill="#6d3df0" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar yAxisId="l" dataKey="pending" name="Pending" fill="#d3c8ff" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="r" type="monotone" dataKey="rate" name="Recovery" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Collected</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand-200" /> Pending</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Recovery</span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-ink/[.06] p-5">
                <h3 className="mb-3 text-sm font-bold text-ink">Needs attention</h3>
                <div className="divide-y divide-ink/[.06] text-sm">
                  {[
                    ['Due in 7 days', alerts.dueIn7Days, 'yellow'],
                    ['Overdue', alerts.overdue, 'red'],
                    ['Partially paid', alerts.partiallyPaid, 'purple'],
                  ].map(([label, n, tone]) => (
                    <button
                      key={label}
                      onClick={() => { setStatus('due'); changeTab('collections'); }}
                      className="flex w-full items-center justify-between py-2.5 text-ink-700 hover:text-brand-700"
                    >
                      {label}
                      <Badge tone={tone}>{n}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-ink/[.06] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Recent payments</h3>
                  <button onClick={() => changeTab('receipts')} className="text-xs font-semibold text-brand-600 hover:underline">
                    See all
                  </button>
                </div>
                {recent.length ? (
                  <ul className="divide-y divide-ink/[.06]">
                    {recent.slice(0, 5).map((r, i) => (
                      <li key={i} className="flex items-center gap-3 py-2.5">
                        <Avatar name={r.name} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-ink">{r.name}</div>
                          <div className="text-xs text-ink-400">{r.class} · {r.date}</div>
                        </div>
                        <div className="text-sm font-bold text-ink">{inr(r.amount)}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-sm text-ink-400">No payments yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- STRUCTURES ---------------- */}
        {tab === 'structure' && (
          <div className="mt-5 space-y-4">
            <SectionHead title="Fee structures">
              <select className="inp w-auto text-xs" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="all">All classes</option>
                {courseList.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <button onClick={() => openStructure()} className="btn-primary text-xs h-9">
                <Plus className="h-3.5 w-3.5" /> New structure
              </button>
            </SectionHead>

            {structures.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/15 py-14 text-center">
                <p className="text-sm text-ink-500">No fee structures yet.</p>
                <button onClick={() => openStructure()} className="btn-primary mt-3 text-xs">Create the first one</button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {structures
                  .filter((s) => classFilter === 'all' || s.class === classFilter)
                  .map((s, i) => {
                    const items = s.feeTypes?.length
                      ? s.feeTypes
                      : [{ type: 'Tuition Fee', amount: s.tuition || 0 }];
                    const total = s.total || sum(items);
                    return (
                      <div key={s._id || i} className="flex flex-col rounded-2xl border border-ink/[.08] bg-white p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-ink">{s.name || `${s.class} - Regular`}</h4>
                            <p className="mt-0.5 text-xs text-ink-400">
                              {s.academicSession || year} · Section {s.section || 'All'}
                            </p>
                          </div>
                          <Badge tone={s.isActive === false ? 'orange' : 'green'}>
                            {s.isActive === false ? 'Inactive' : 'Active'}
                          </Badge>
                        </div>

                        <div className="mt-4 text-2xl font-black text-ink">{inr(total)}</div>
                        <div className="text-xs text-ink-400">per year</div>

                        <ul className="mt-4 flex-1 space-y-1.5 border-t border-ink/[.06] pt-3 text-xs">
                          {items.slice(0, 4).map((it, k) => (
                            <li key={k} className="flex justify-between text-ink-600">
                              <span>{it.type}</span>
                              <span className="font-semibold text-ink">{inr(it.amount)}</span>
                            </li>
                          ))}
                          {items.length > 4 && <li className="text-ink-400">+{items.length - 4} more</li>}
                        </ul>

                        <div className="mt-4 flex items-center justify-between border-t border-ink/[.06] pt-3">
                          <span className="text-xs text-ink-400">
                            {s.installments?.length ? `${s.installments.length} installments` : 'Single payment'}
                          </span>
                          <div className="flex gap-1">
                            <button title="Edit" onClick={() => openStructure(s)} className="rounded-lg p-1.5 text-ink-400 hover:bg-brand-50 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                            <button title="Duplicate" onClick={() => duplicateStructure(s)} className="rounded-lg p-1.5 text-ink-400 hover:bg-brand-50 hover:text-brand-600"><Copy className="h-4 w-4" /></button>
                            <button title="Delete" onClick={() => deleteStructure(s)} className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- COLLECTIONS ---------------- */}
        {tab === 'collections' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Segmented options={STATUS} value={status} onChange={(v) => { setStatus(v); setF((x) => ({ ...x, page: 1 })); }} />
              <SearchBox value={f.q} onChange={(q) => setFilter({ q })} placeholder="Search student name or ID" />
              <select className="inp w-auto" value={f.course} onChange={(e) => setFilter({ course: e.target.value })}>
                <option value="">All classes</option>
                {courseList.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <Table
              loading={feesLoading}
              rows={fees?.data}
              empty={status === 'due' ? 'No pending fees. Everyone is up to date.' : 'No fee records found.'}
              cols={[
                {
                  h: 'Student',
                  render: (r) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar src={r.student?.photo?.url} name={r.student?.name || 'S'} size={34} />
                      <div>
                        <div className="font-semibold text-slate-800">{r.student?.name}</div>
                        <div className="text-xs text-slate-400">
                          {r.student?.course?.name || '–'}{r.student?.batch?.name ? ` · ${r.student.batch.name}` : ''} · {r.student?.studentId}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  h: 'Annual Fee',
                  render: (r) => (
                    <div>
                      <span className="font-bold text-slate-800">{inr(r.amount)}</span>
                      <span className="block text-[11px] text-slate-400">Full Year</span>
                    </div>
                  ),
                },
                {
                  h: 'Paid',
                  render: (r) => (
                    <span className="font-bold text-emerald-600">{inr(r.paid)}</span>
                  ),
                },
                {
                  h: 'Pending Due',
                  render: (r) => (
                    <div>
                      <span className={r.due ? 'font-bold text-rose-600' : 'font-medium text-slate-400'}>
                        {inr(r.due)}
                      </span>
                      {r.due > 0 && r.nextPendingInstallment && (
                        <span className="block text-[10px] font-medium text-amber-600">
                          Next: {inr(r.nextPendingInstallment.due)}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  h: 'Installments',
                  render: (r) =>
                    r.totalInstallments > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingStudent(r);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <span>{r.paidInstallmentsCount} of {r.totalInstallments} Paid</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Single payment</span>
                    ),
                },
                {
                  h: 'Status',
                  render: (r) => <StatusBadge s={r.status} />,
                },
                {
                  h: '',
                  render: (r) => (
                    <div className="flex items-center justify-end gap-1.5">
                      {r.due > 0 && (
                        <button
                          title="Send WhatsApp reminder"
                          onClick={() => remind(r.student?._id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openCollect(r.student?._id, r.nextPendingInstallment?.due || r.due)}
                        disabled={!r.due}
                        className="rounded-lg bg-royal px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-royal/90 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Collect
                      </button>
                    </div>
                  ),
                },
              ]}
            />

            <Pager
              page={f.page}
              pages={fees?.pages || 1}
              total={fees?.total || 0}
              limit={LIMIT}
              onPage={(p) => setF({ ...f, page: p })}
              label="records"
            />
          </div>
        )}

        {/* ---------------- RECEIPTS ---------------- */}
        {tab === 'receipts' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchBox value={receiptQ} onChange={setReceiptQ} placeholder="Search receipt, student or class" />
              <select className="inp w-auto" value={receiptMode} onChange={(e) => setReceiptMode(e.target.value)}>
                <option value="">All modes</option>
                {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={exportReceipts} className="btn-outline text-xs h-9">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>

            <Table
              rows={receipts}
              empty="No receipts found."
              cols={[
                { h: 'Receipt', render: (r) => <span className="font-mono font-semibold text-brand-700">{r.receiptNo}</span> },
                { h: 'Student', render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
                { h: 'Class', render: (r) => r.class },
                { h: 'Amount', render: (r) => <span className="font-bold text-ink">{inr(r.amount)}</span> },
                { h: 'Mode', render: (r) => <Badge tone={modeTone(r.mode)}>{r.mode}</Badge> },
                { h: 'Date', render: (r) => r.date },
                {
                  h: '',
                  render: (r) => (
                    <button onClick={() => setReceipt(r)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 py-1 text-xs font-semibold hover:bg-brand-50 hover:text-brand-600">
                      <Printer className="h-3.5 w-3.5" /> View
                    </button>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ---------------- REPORTS ---------------- */}
        {tab === 'reports' && (
          <div className="mt-5 divide-y divide-ink/[.06] rounded-2xl border border-ink/[.06]">
            {[
              ['Fee collection', 'All receipts by date and payment mode'],
              ['Defaulters', 'Students with dues pending over 30 days'],
              ['Class-wise summary', 'Collected and pending fees per class'],
              ['Annual statement', 'Full-year income summary'],
            ].map(([title, sub]) => (
              <div key={title} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-ink">{title}</div>
                  <div className="text-xs text-ink-400">{sub}</div>
                </div>
                <button
                  onClick={() =>
                    downloadCSV(`${title.toLowerCase().replace(/\s+/g, '_')}_${year}.csv`, [
                      ['Report', 'Academic year', 'Generated on'],
                      [title, year, new Date().toLocaleDateString('en-IN')],
                    ])
                  }
                  className="btn-outline text-xs h-8 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---------------- COLLECT MODAL ---------------- */}
      {collectOpen && (
        <Modal open onClose={() => setCollectOpen(false)} title="Collect Fee" width="max-w-md">
          <div className="space-y-4">
            <Field label="Student" required>
              <select
                className="inp"
                value={sid}
                onChange={(e) => {
                  const newSid = e.target.value;
                  setSid(newSid);
                  const sRow = (fees?.data || []).find((x) => String(x.student?._id) === String(newSid));
                  if (sRow) {
                    setPay({ ...pay, amount: String(sRow.nextPendingInstallment?.due || sRow.due || '') });
                  }
                }}
              >
                <option value="">Select student</option>
                {(fees?.data || []).map((row) => (
                  <option key={row.student?._id} value={row.student?._id}>
                    {row.student?.name} ({row.student?.studentId}) – Due: {inr(row.due)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Quick summary of the selected student's fee dues */}
            {(() => {
              const sRow = (fees?.data || []).find((x) => String(x.student?._id) === String(sid));
              if (!sRow) return null;
              return (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-500">Annual Fee: {inr(sRow.amount)}</span>
                    <span className="text-emerald-600">Paid: {inr(sRow.paid)}</span>
                    <span className="font-bold text-rose-600">Pending Due: {inr(sRow.due)}</span>
                  </div>
                  {sRow.due > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 pt-2.5">
                      <span className="font-semibold text-slate-500 text-[11px]">Quick Pay:</span>
                      {sRow.nextPendingInstallment && sRow.nextPendingInstallment.due !== sRow.due && (
                        <button
                          type="button"
                          onClick={() => setPay({ ...pay, amount: String(sRow.nextPendingInstallment.due) })}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:border-royal hover:text-royal"
                        >
                          Next: {sRow.nextPendingInstallment.plan || 'Installment'} ({inr(sRow.nextPendingInstallment.due)})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPay({ ...pay, amount: String(sRow.due) })}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:border-royal hover:text-royal"
                      >
                        Full Due ({inr(sRow.due)})
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount to Collect (₹)" required>
                <input
                  type="number"
                  min="1"
                  className="inp font-bold text-slate-800"
                  value={pay.amount}
                  onChange={(e) => setPay({ ...pay, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </Field>
              <Field label="Payment Mode">
                <select className="inp" value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button disabled={collecting} onClick={() => setCollectOpen(false)} className="btn border border-ink/10">Cancel</button>
              <button disabled={collecting || !sid || !pay.amount || Number(pay.amount) <= 0} onClick={collect} className="btn-primary inline-flex items-center gap-2">
                {collecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{collecting ? 'Processing...' : 'Collect & Generate Receipt'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------------- VIEW INSTALLMENTS MODAL ---------------- */}
      {viewingStudent && (
        <Modal
          open
          onClose={() => setViewingStudent(null)}
          title={`${viewingStudent.student?.name} – Installments Breakdown`}
          width="max-w-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500">Annual Fee:</span>
                <span className="ml-1.5 font-bold text-slate-800">{inr(viewingStudent.amount)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500">Paid:</span>
                <span className="ml-1.5 font-bold text-emerald-600">{inr(viewingStudent.paid)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500">Pending:</span>
                <span className="ml-1.5 font-bold text-rose-600">{inr(viewingStudent.due)}</span>
              </div>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {viewingStudent.installments?.map((inst, idx) => (
                <div
                  key={inst._id || idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50/60"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{inst.plan || `Installment ${idx + 1}`}</span>
                      <StatusBadge s={inst.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                      {inst.dueDate && (
                        <span>
                          Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {inst.status === 'paid' && inst.paidAt && (
                        <span className="font-semibold text-emerald-600">
                          • Paid on: {new Date(inst.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {inst.paidMode ? ` (${inst.paidMode})` : ''}
                        </span>
                      )}
                      {inst.status !== 'paid' && inst.paid > 0 && inst.paidAt && (
                        <span className="font-medium text-amber-600">
                          • Partial paid: {new Date(inst.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {inst.receiptNo && (
                        <span className="font-mono text-[11px] text-slate-400">
                          • {inst.receiptNo}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{inr(inst.amount)}</div>
                      {inst.due > 0 && <div className="text-[11px] font-semibold text-rose-600">Due: {inr(inst.due)}</div>}
                    </div>
                    {inst.due > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingStudent(null);
                          openCollect(viewingStudent.student?._id, inst.due);
                        }}
                        className="rounded-lg bg-royal px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-royal/90"
                      >
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-2">
              <button type="button" onClick={() => setViewingStudent(null)} className="btn border border-slate-200">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------------- RECEIPT MODAL ---------------- */}
      {receipt && (
        <Modal open onClose={() => setReceipt(null)} title="Fee receipt" width="max-w-sm">
          <div className="space-y-4 text-ink">
            <div className="rounded-xl bg-brand-50/60 py-5 text-center">
              <div className="text-xs text-ink-500">Amount received</div>
              <div className="mt-1 text-3xl font-black text-brand-700">{inr(receipt.amount)}</div>
            </div>
            <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
              <dt className="text-ink-400">Receipt no.</dt><dd className="text-right font-mono font-semibold">{receipt.receiptNo}</dd>
              <dt className="text-ink-400">Student</dt><dd className="text-right font-semibold">{receipt.name}</dd>
              <dt className="text-ink-400">Class</dt><dd className="text-right font-semibold">{receipt.class}</dd>
              <dt className="text-ink-400">Date</dt><dd className="text-right font-semibold">{receipt.date}</dd>
              <dt className="text-ink-400">Mode</dt><dd className="text-right"><Badge tone={modeTone(receipt.mode)}>{receipt.mode}</Badge></dd>
            </dl>
            <div className="flex justify-end gap-2">
              <button onClick={() => setReceipt(null)} className="btn border border-ink/10">Close</button>
              <button onClick={() => window.print()} className="btn-primary"><Printer className="h-4 w-4" /> Print</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------------- STRUCTURE MODAL ---------------- */}
      {structOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm">
          <form onSubmit={saveStructure} className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[.08] px-6 py-4">
              <h2 className="text-lg font-bold text-ink">{form.id ? 'Edit fee structure' : 'New fee structure'}</h2>
              <button type="button" onClick={() => setStructOpen(false)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
              {/* Basics */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Class" required>
                  <select
                    required
                    className="inp"
                    value={form.courseId}
                    onChange={(e) => {
                      const c = courseList.find((x) => x._id === e.target.value);
                      patchForm({ courseId: e.target.value, name: c ? `${c.name} - Regular` : form.name });
                    }}
                  >
                    <option value="">Select class</option>
                    {courseList.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Section">
                  <select className="inp" value={form.section} onChange={(e) => patchForm({ section: e.target.value })}>
                    <option value="All">All sections</option>
                    {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Name" required>
                  <input required className="inp" value={form.name} onChange={(e) => patchForm({ name: e.target.value })} />
                </Field>
                <Field label="Academic year">
                  <select className="inp" value={form.academicSession} onChange={(e) => patchForm({ academicSession: e.target.value })}>
                    <option value="2026 - 2027">2026 – 2027</option>
                    <option value="2025 - 2026">2025 – 2026</option>
                    <option value="2024 - 2025">2024 – 2025</option>
                  </select>
                </Field>
              </div>

              {/* Fee types */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Fee types</h3>
                  <button
                    type="button"
                    onClick={() => patchForm({ feeTypes: [...form.feeTypes, { type: '', amount: '', frequency: 'Annual' }] })}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    + Add fee type
                  </button>
                </div>
                {form.feeTypes.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_7rem_7.5rem_2rem] items-center gap-2">
                    <input required className="inp text-sm" placeholder="Fee name" value={it.type} onChange={(e) => patchRow('feeTypes', i, { type: e.target.value })} />
                    <input required type="number" min="0" className="inp text-sm" placeholder="₹" value={it.amount} onChange={(e) => patchRow('feeTypes', i, { amount: e.target.value })} />
                    <select className="inp text-sm" value={it.frequency} onChange={(e) => patchRow('feeTypes', i, { frequency: e.target.value })}>
                      {['Annual', 'One Time', 'Monthly', 'Term'].map((x) => <option key={x}>{x}</option>)}
                    </select>
                    <button
                      type="button"
                      disabled={form.feeTypes.length <= 1}
                      onClick={() => patchForm({ feeTypes: form.feeTypes.filter((_, k) => k !== i) })}
                      className="p-1 text-ink-400 hover:text-rose-600 disabled:opacity-30"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-brand-50/60 px-4 py-3">
                  <span className="text-sm font-semibold text-ink-700">Total per year</span>
                  <span className="text-lg font-black text-brand-700">{inr(feeTotal)}</span>
                </div>
              </section>

              {/* Installments */}
              <section className="space-y-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-ink/20 text-brand-600"
                    checked={form.enableInstallments}
                    onChange={(e) => {
                      patchForm({ enableInstallments: e.target.checked, installments: e.target.checked ? form.installments : [] });
                      if (e.target.checked && !form.installments.length) setTimeout(() => setInstallmentCount(4), 0);
                    }}
                  />
                  Pay in installments
                </label>

                {form.enableInstallments && (
                  <>
                    <select
                      className="inp w-auto text-sm"
                      value={form.installments.length || 4}
                      onChange={(e) => setInstallmentCount(Number(e.target.value))}
                    >
                      {[2, 3, 4, 6, 10, 12].map((n) => <option key={n} value={n}>{n} installments</option>)}
                    </select>

                    {form.installments.map((it, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2">
                        <input className="inp text-sm" value={it.name} onChange={(e) => patchRow('installments', i, { name: e.target.value })} />
                        <input type="number" min="0" className="inp text-sm" value={it.amount} onChange={(e) => patchRow('installments', i, { amount: e.target.value })} />
                        <input type="date" className="inp text-sm" value={it.dueDate} onChange={(e) => patchRow('installments', i, { dueDate: e.target.value })} />
                      </div>
                    ))}

                    {instTotal !== feeTotal && form.installments.length > 0 && (
                      <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Installments add up to {inr(instTotal)}, but the total fee is {inr(feeTotal)}.
                      </p>
                    )}
                  </>
                )}
              </section>

              {/* Rules */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                    <input type="checkbox" className="h-4 w-4 rounded border-ink/20 text-brand-600" checked={form.applyLateFee} onChange={(e) => patchForm({ applyLateFee: e.target.checked })} />
                    Charge late fee
                  </label>
                  {form.applyLateFee && (
                    <>
                      <input type="number" min="0" className="inp w-24 text-sm" value={form.lateFeeAmount} onChange={(e) => patchForm({ lateFeeAmount: e.target.value })} />
                      <select className="inp w-auto text-sm" value={form.lateFeePeriod} onChange={(e) => patchForm({ lateFeePeriod: e.target.value })}>
                        {['Per Day', 'Per Week', 'One Time'].map((x) => <option key={x}>{x}</option>)}
                      </select>
                    </>
                  )}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input type="checkbox" className="h-4 w-4 rounded border-ink/20 text-brand-600" checked={form.isActive} onChange={(e) => patchForm({ isActive: e.target.checked })} />
                  Active
                </label>
              </section>
            </div>

            <div className="flex justify-end gap-2 border-t border-ink/[.08] bg-ink-50/30 px-6 py-4">
              <button type="button" onClick={() => setStructOpen(false)} className="btn border border-ink/15">Cancel</button>
              <button type="submit" className="btn-primary">Save structure</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function FeesAccountsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-ink-400">Loading…</div>}>
      <FeesContent />
    </Suspense>
  );
}