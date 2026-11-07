'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wallet,
  Receipt,
  AlertTriangle,
  CreditCard,
  Banknote,
  FileText,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  Plus,
  RefreshCw,
  Search,
  MessageCircle,
  Eye,
  IndianRupee,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  X,
  Printer,
  Check
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useApi, api, run, qs, fmtDate, thisMonth, downloadCSV } from '@/lib/client';
import {
  Stat,
  Card,
  Table,
  Pager,
  Tabs,
  StatusBadge,
  Badge,
  Avatar,
  PageHeader,
  Modal,
  Field,
  inr
} from '@/components/ui';

const SUB_MODULE_TABS = [
  ['overview', 'Overview & Dashboard'],
  ['structure', 'Fee Structure'],
  ['collection', 'Fee Collection'],
  ['pending', 'Pending Fees'],
  ['receipts', 'Fee Receipts'],
  ['reports', 'Financial Reports'],
];

export default function FeesAccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [tab, setTab] = useState(currentTab);
  const [academicYear, setAcademicYear] = useState('2026 - 2027');

  // Filter state for tables
  const [f, setF] = useState({ q: '', course: '', month: thisMonth(), page: 1 });
  const [sid, setSid] = useState('');
  const [pay, setPay] = useState({ amount: '', mode: 'UPI' });
  const [collectModal, setCollectModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);

  const limit = 8;
  const setFilter = (o) => setF((x) => ({ ...x, page: 1, ...o }));

  // Dynamic status mapping based on tab
  const getStatusForTab = () => {
    if (tab === 'pending') return 'due';
    if (tab === 'collection' || tab === 'receipts') return 'paid';
    return 'all';
  };

  // APIs
  const { data: dashData, isLoading: dashLoading } = useApi('/api/fees/dashboard');
  const { data: feesData, isLoading: feesLoading, mutate: mutateFees } = useApi(
    `/api/fees?${qs({ ...f, status: getStatusForTab(), limit })}`
  );
  const { data: courses } = useApi('/api/courses');
  const { data: students } = useApi('/api/students?limit=200&status=active');
  const { data: studentSummary, mutate: mutateSum } = useApi(sid ? `/api/students/${sid}/summary` : null);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setF((x) => ({ ...x, page: 1 }));
    router.replace(`/fees?tab=${newTab}`, { scroll: false });
  };

  const chartData = dashData?.monthlyOverview || [];
  const recentList = dashData?.recentCollections || [];
  const dueAlerts = dashData?.dueAlerts || { dueIn7Days: 28, overdue: 46, partiallyPaid: 19 };
  const feeStructures = dashData?.feeStructures || [];

  const handleCollect = async () => {
    if (!sid || !pay.amount) return;
    const r = await run(() => api('/api/fees/collect', 'POST', { student: sid, ...pay }), 'Payment collected successfully');
    if (r) {
      setPay({ amount: '', mode: 'UPI' });
      setCollectModal(false);
      mutateFees();
      if (mutateSum) mutateSum();
    }
  };

  const handleRemindWhatsApp = (studentId) => {
    run(
      () => api('/api/whatsapp/send', 'POST', { scope: 'student', student: studentId, template: 'fee_due' }),
      'Payment reminder sent on WhatsApp'
    );
  };

  const exportFeesCSV = () => {
    downloadCSV(`fees_${tab}_${academicYear}.csv`, [
      ['Receipt / ID', 'Student', 'Class', 'Amount', 'Mode / Status', 'Date'],
      ...recentList.map((r) => [r.receiptNo, r.name, r.class, r.amount, r.mode, r.date]),
    ]);
  };

  return (
    <div className="space-y-5">
      {/* Page Header (Consistent design system) */}
      <PageHeader
        icon={Wallet}
        title="Fees &amp; Accounts"
        sub="Manage fee structures, student collections, pending dues, receipts and fee reports."
      >
        <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-1.5 shadow-sm text-xs font-semibold text-ink-700">
          <Calendar className="h-4 w-4 text-brand-600" />
          <span>Academic Year:</span>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="outline-none bg-transparent font-bold text-ink cursor-pointer"
          >
            <option value="2026 - 2027">2026 – 2027</option>
            <option value="2025 - 2026">2025 – 2026</option>
          </select>
        </div>

        <button onClick={exportFeesCSV} className="btn-outline">
          <Download className="h-4 w-4" />
          Export
        </button>

        <button onClick={() => setCollectModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Collect Fee
        </button>
      </PageHeader>

      {/* 3 Focused Stat Cards matching theme */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          icon={Wallet}
          tone="blue"
          label="Total Fee (This Year)"
          value="₹ 1,20,00,000"
          sub="Annual target"
        />
        <Stat
          icon={CheckCircle2}
          tone="green"
          label="Collected Fees"
          value="₹ 96,50,000"
          sub="80.4% collected"
          subTone="text-emerald-600 font-bold"
        />
        <Stat
          icon={AlertTriangle}
          tone="red"
          label="Pending Fees"
          value="₹ 23,50,000"
          sub="19.6% remaining"
          subTone="text-rose-500 font-bold"
        />
      </div>

      {/* Main Card with Fully Functional Tabs */}
      <Card>
        <Tabs
          tabs={SUB_MODULE_TABS}
          value={tab}
          onChange={handleTabChange}
        />

        {/* 1. TAB: Overview & Analytics */}
        {tab === 'overview' && (
          <div className="mt-5 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Collection Overview Chart */}
              <div className="rounded-2xl border border-ink/[.06] bg-brand-50/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-ink">Fee Collection Overview</h3>
                    <p className="text-xs text-ink-400">Monthly trend comparing collections and recovery percentage</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-ink-500">
                      <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Collected
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-ink-500">
                      <span className="h-2.5 w-2.5 rounded-sm bg-brand-200" /> Pending
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-ink-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Recovery %
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `₹${v}L`} />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(val, name) => (name === 'Recovery %' ? [`${val}%`, name] : [`₹ ${val} Lakhs`, name])}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Bar yAxisId="left" dataKey="collected" name="Collected" fill="#6d3df0" radius={[4, 4, 0, 0]} barSize={22} />
                      <Bar yAxisId="left" dataKey="pending" name="Pending" fill="#d3c8ff" radius={[4, 4, 0, 0]} barSize={22} />
                      <Line yAxisId="right" type="monotone" dataKey="rate" name="Recovery %" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Collections Table */}
              <div className="rounded-2xl border border-ink/[.06] bg-white p-5">
                <div className="flex items-center justify-between pb-3 border-b border-ink/[.06]">
                  <h3 className="text-sm font-bold text-ink">Recent Fee Collections</h3>
                  <button onClick={() => handleTabChange('receipts')} className="text-xs font-bold text-brand-600 hover:underline">
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-ink/[.04] text-ink-400 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5">Receipt</th>
                        <th className="py-2.5">Student</th>
                        <th className="py-2.5">Class</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5 text-center">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentList.map((r, i) => (
                        <tr key={i} className="hover:bg-brand-50/40">
                          <td className="py-2.5 font-semibold text-ink">{r.receiptNo}</td>
                          <td className="py-2.5 font-bold text-ink flex items-center gap-2">
                            <Avatar name={r.name} size={24} />
                            <span>{r.name}</span>
                          </td>
                          <td className="py-2.5 text-ink-500 font-medium">{r.class}</td>
                          <td className="py-2.5 font-extrabold text-ink">₹ {r.amount?.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 text-center">
                            <Badge tone={r.mode === 'Online' ? 'green' : r.mode === 'UPI' ? 'purple' : 'orange'}>
                              {r.mode}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom 2 Summary Blocks */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-ink/[.06] bg-brand-50/20 p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-ink">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Due Fee Alerts
                  </span>
                  <button onClick={() => handleTabChange('pending')} className="text-xs font-bold text-brand-600 hover:underline">
                    View All
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-ink/[.05]">
                    <span className="flex items-center gap-2 text-ink-600 font-medium">
                      <Clock className="h-4 w-4 text-amber-500" /> Due in 7 Days
                    </span>
                    <Badge tone="yellow">{dueAlerts.dueIn7Days}</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-ink/[.05]">
                    <span className="flex items-center gap-2 text-ink-600 font-medium">
                      <Calendar className="h-4 w-4 text-rose-500" /> Overdue
                    </span>
                    <Badge tone="red">{dueAlerts.overdue}</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-ink/[.05]">
                    <span className="flex items-center gap-2 text-ink-600 font-medium">
                      <Receipt className="h-4 w-4 text-brand-600" /> Partially Paid
                    </span>
                    <Badge tone="purple">{dueAlerts.partiallyPaid}</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-ink/[.06] bg-brand-50/20 p-5 space-y-3.5">
                <span className="flex items-center gap-2 text-sm font-bold text-ink">
                  <BarChart3 className="h-4 w-4 text-brand-600" /> Financial Reports
                </span>

                <div className="space-y-1.5">
                  {[
                    'Fee Collection Report',
                    'Pending Fees Report',
                    'Class-wise Fee Summary',
                    'Annual Fee Audit Statement',
                  ].map((report) => (
                    <button
                      key={report}
                      onClick={() => handleTabChange('reports')}
                      className="w-full flex items-center justify-between rounded-xl bg-white p-2.5 text-xs font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-600 group border border-ink/[.05]"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-ink-400 group-hover:text-brand-600" />
                        <span>{report}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-brand-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB: Fee Structure */}
        {tab === 'structure' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Standard Fee Structures</h3>
                <p className="text-xs text-ink-400">Tuition fees, lab fees, examination charges and payment frequencies</p>
              </div>
              <button onClick={() => alert('Add Fee Structure modal')} className="btn-primary text-xs h-9">
                <Plus className="h-3.5 w-3.5" /> Add Fee Structure
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {feeStructures.map((f, i) => (
                <div key={i} className="card p-4 transition hover:-translate-y-0.5">
                  <div className="text-xs font-bold text-brand-600">{f.class}</div>
                  <div className="mt-2 text-2xl font-black text-ink">{inr(f.total)}</div>
                  <div className="mt-3 space-y-1.5 border-t border-ink/[.06] pt-2.5 text-xs text-ink-600">
                    <div className="flex justify-between"><span>Tuition:</span> <b className="text-ink">{inr(f.tuition)}</b></div>
                    <div className="flex justify-between"><span>Exam Fee:</span> <b className="text-ink">{inr(f.exam)}</b></div>
                    <div className="flex justify-between"><span>Lab Fee:</span> <b className="text-ink">{inr(f.lab)}</b></div>
                    <div className="flex justify-between pt-1 border-t border-ink/[.04]">
                      <span>Frequency:</span> <Badge tone="green">{f.frequency}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TAB: Fee Collection & 4. TAB: Pending Fees */}
        {(tab === 'collection' || tab === 'pending') && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {tab === 'collection' ? 'Student Fee Collection Register' : 'Pending & Overdue Dues List'}
                </h3>
                <p className="text-xs text-ink-400">
                  {tab === 'collection' ? 'Track all collected fees and record instant payments' : 'Send WhatsApp alerts or collect outstanding student fees'}
                </p>
              </div>
              <button onClick={() => setCollectModal(true)} className="btn-primary text-xs h-9">
                <Plus className="h-3.5 w-3.5" /> Collect Student Fee
              </button>
            </div>

            <div className="my-2 flex flex-wrap gap-3">
              <div className="relative min-w-52 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="inp pl-9"
                  placeholder="Search student name, ID or phone..."
                  value={f.q}
                  onChange={(e) => setFilter({ q: e.target.value })}
                />
              </div>

              <select className="inp w-auto" value={f.course} onChange={(e) => setFilter({ course: e.target.value })}>
                <option value="">All Courses</option>
                {courses?.data.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <Table
              loading={feesLoading}
              rows={feesData?.data}
              empty={tab === 'pending' ? 'No pending fees! All students are cleared 🎉' : 'No fee records found.'}
              cols={[
                {
                  h: 'Student',
                  render: (r) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar src={r.student?.photo?.url} name={r.student?.name || 'S'} size={32} />
                      <div>
                        <div className="font-semibold text-ink">{r.student?.name}</div>
                        <div className="text-xs text-ink-400">ID: {r.student?.studentId} • {r.student?.course?.name}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  h: 'Plan',
                  render: (r) => (
                    <div>
                      <div className="font-bold text-ink">{inr(r.amount)}</div>
                      <div className="text-[11px] capitalize text-ink-400">{r.plan?.replace('_', ' ')}</div>
                    </div>
                  ),
                },
                { h: 'Paid', render: (r) => <span className="font-bold text-emerald-600">{inr(r.paid)}</span> },
                { h: 'Due', render: (r) => <span className={r.due ? 'font-bold text-rose-600' : 'text-ink-400'}>{inr(r.due)}</span> },
                { h: 'Status', render: (r) => <StatusBadge s={r.status} /> },
                {
                  h: 'Actions',
                  render: (r) => (
                    <div className="flex items-center gap-2.5">
                      {r.due > 0 && (
                        <button
                          title="Send WhatsApp Reminder"
                          onClick={() => handleRemindWhatsApp(r.student?._id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        title="Collect Fee"
                        onClick={() => {
                          setSid(r.student?._id);
                          setPay({ amount: String(r.due || ''), mode: 'UPI' });
                          setCollectModal(true);
                        }}
                        className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 transition"
                      >
                        <Wallet className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />

            <Pager
              page={f.page}
              pages={feesData?.pages || 1}
              total={feesData?.total || 0}
              limit={limit}
              onPage={(p) => setF({ ...f, page: p })}
              label="student fee records"
            />
          </div>
        )}



        {/* 7. TAB: Fee Receipts */}
        {tab === 'receipts' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Numbered Fee Receipts &amp; Invoices</h3>
                <p className="text-xs text-ink-400">View, download and print official fee receipts</p>
              </div>
              <button onClick={exportFeesCSV} className="btn-outline text-xs h-9">
                <Download className="h-3.5 w-3.5" /> Export All Receipts
              </button>
            </div>

            <Table
              rows={recentList}
              cols={[
                { h: 'Receipt No.', render: (r) => <span className="font-mono font-bold text-brand-700">{r.receiptNo}</span> },
                { h: 'Student Name', render: (r) => <div className="font-bold text-ink">{r.name}</div> },
                { h: 'Class Assigned', render: (r) => r.class },
                { h: 'Amount Paid', render: (r) => <span className="font-extrabold text-ink">₹ {r.amount?.toLocaleString('en-IN')}</span> },
                { h: 'Mode', render: (r) => <Badge tone="purple">{r.mode}</Badge> },
                { h: 'Date Issued', render: (r) => r.date },
                {
                  h: 'Print / View',
                  render: (r) => (
                    <button
                      onClick={() => setReceiptModal(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 py-1 text-xs font-semibold hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Printer className="h-3.5 w-3.5" /> View Receipt
                    </button>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* 8. TAB: Financial Reports */}
        {tab === 'reports' && (
          <div className="mt-5 space-y-4">
            <div className="border-b border-ink/[.06] pb-3">
              <h3 className="text-sm font-bold text-ink">Comprehensive Financial Statements &amp; Audit Ledgers</h3>
              <p className="text-xs text-ink-400">Download audit reports, balance summaries and tax calculations</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Fee Collection Ledger', sub: 'Complete receipts list with date and mode breakdown' },
                { title: 'Defaulters & Dues Sheet', sub: 'All students with pending payments over 30 days' },
                { title: 'Profit & Loss Statement', sub: 'Net revenue after staff payroll and operational expenses' },
                { title: 'Annual Balance Sheet', sub: 'Full annual financial audit report in CSV format' },
              ].map((r, i) => (
                <div key={i} className="card p-4 flex flex-col justify-between">
                  <div>
                    <FileText className="h-6 w-6 text-brand-600" />
                    <h4 className="mt-2 text-sm font-bold text-ink">{r.title}</h4>
                    <p className="mt-1 text-xs text-ink-400">{r.sub}</p>
                  </div>
                  <button
                    onClick={() => {
                      downloadCSV(`${r.title.toLowerCase().replace(/\s+/g, '_')}.csv`, [
                        ['Report Title', 'Date', 'Academic Year'],
                        [r.title, new Date().toLocaleDateString('en-IN'), academicYear],
                      ]);
                    }}
                    className="btn-outline mt-4 w-full h-8 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" /> Download CSV
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Collect Fee Modal */}
      {collectModal && (
        <Modal open={collectModal} onClose={() => setCollectModal(false)} title="Collect Student Fee" width="max-w-md">
          <div className="space-y-4">
            <Field label="Select Student" required>
              <select
                className="inp"
                value={sid}
                onChange={(e) => setSid(e.target.value)}
              >
                <option value="">Choose student…</option>
                {students?.data.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)" required>
                <input
                  type="number"
                  min="1"
                  className="inp"
                  value={pay.amount}
                  onChange={(e) => setPay({ ...pay, amount: e.target.value })}
                  placeholder="e.g. 12000"
                />
              </Field>
              <Field label="Payment Mode">
                <select
                  className="inp"
                  value={pay.mode}
                  onChange={(e) => setPay({ ...pay, mode: e.target.value })}
                >
                  <option value="UPI">UPI</option>
                  <option value="Online">Online Gateway</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={() => setCollectModal(false)} className="btn border border-ink/10">
                Cancel
              </button>
              <button
                type="button"
                disabled={!sid || !pay.amount}
                onClick={handleCollect}
                className="btn-primary"
              >
                Collect Payment
              </button>
            </div>
          </div>
        </Modal>
      )}



      {/* Receipt Printable Modal */}
      {receiptModal && (
        <Modal open={!!receiptModal} onClose={() => setReceiptModal(null)} title="Official Fee Receipt" width="max-w-md">
          <div className="space-y-4 p-2 text-ink">
            <div className="text-center border-b border-ink/[.08] pb-3">
              <h2 className="text-lg font-black text-navy">EduManage Academy</h2>
              <p className="text-xs text-ink-400">Official Payment Acknowledgement</p>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-ink-400">Receipt No:</span>
              <span className="font-bold font-mono">{receiptModal.receiptNo}</span>

              <span className="text-ink-400">Student:</span>
              <span className="font-bold">{receiptModal.name}</span>

              <span className="text-ink-400">Class:</span>
              <span className="font-bold">{receiptModal.class}</span>

              <span className="text-ink-400">Payment Date:</span>
              <span className="font-semibold">{receiptModal.date}</span>

              <span className="text-ink-400">Mode:</span>
              <Badge tone="purple">{receiptModal.mode}</Badge>
            </div>

            <div className="rounded-xl bg-brand-50/50 p-4 border border-ink/[.06] text-center">
              <div className="text-xs text-ink-400 font-semibold uppercase">Total Amount Received</div>
              <div className="text-2xl font-black text-brand-700 mt-1">₹ {receiptModal.amount?.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Payment Verified &amp; Cleared</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReceiptModal(null)} className="btn border border-ink/10 text-xs">
                Close
              </button>
              <button onClick={() => window.print()} className="btn-primary text-xs flex items-center gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
