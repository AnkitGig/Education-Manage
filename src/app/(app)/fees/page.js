'use client';
import { useState, Suspense } from 'react';
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
  Check,
  Pencil,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Info
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

function FeesContent() {
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
  const [structureModal, setStructureModal] = useState(false);
  const [structureStep, setStructureStep] = useState(1);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [structureForm, setStructureForm] = useState({
    id: '',
    name: 'Class 5 - Regular',
    academicSession: '2026 - 2027',
    courseId: '',
    section: 'A',
    feeTypes: [
      { type: 'Tuition Fee', amount: '24000', frequency: 'Annual' },
      { type: 'Admission Fee', amount: '5000', frequency: 'One Time' },
      { type: 'Activity Fee', amount: '3000', frequency: 'Annual' },
      { type: 'Computer Fee', amount: '2000', frequency: 'Annual' },
    ],
    enableInstallments: true,
    numberOfInstallments: 4,
    installments: [
      { name: '1st Installment', amount: '8500', dueDate: '2026-04-10' },
      { name: '2nd Installment', amount: '8500', dueDate: '2026-07-10' },
      { name: '3rd Installment', amount: '8500', dueDate: '2026-10-10' },
      { name: '4th Installment', amount: '8500', dueDate: '2027-01-10' },
    ],
    applyLateFee: true,
    lateFeeAmount: 100,
    lateFeePeriod: 'Per Day',
    allowPartialPayment: false,
    isActive: true,
  });
  // Receipts tab search and filter
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptMode, setReceiptMode] = useState('');

  const limit = 8;
  const setFilter = (o) => setF((x) => ({ ...x, page: 1, ...o }));

  // Dynamic status mapping based on tab
  const getStatusForTab = () => {
    if (tab === 'pending') return 'due';
    if (tab === 'collection' || tab === 'receipts') return 'paid';
    return 'all';
  };

  // APIs
  const { data: dashData, isLoading: dashLoading, mutate: mutateDash } = useApi('/api/fees/dashboard');
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

  // Filtered receipts list for the receipts tab
  const filteredReceipts = recentList.filter((r) => {
    const q = receiptSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.receiptNo?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.class?.toLowerCase().includes(q);
    const matchMode = !receiptMode || r.mode === receiptMode;
    return matchSearch && matchMode;
  });

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

  const calculateFeeTotal = (types) => {
    return (types || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };

  const calculateInstallmentsTotal = (insts) => {
    return (insts || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };

  const handleNumberOfInstallmentsChange = (count) => {
    const num = Number(count) || 1;
    const total = calculateFeeTotal(structureForm.feeTypes);
    const perInst = Math.round(total / num);

    const instNames = ['1st Installment', '2nd Installment', '3rd Installment', '4th Installment', '5th Installment', '6th Installment', '7th Installment', '8th Installment', '9th Installment', '10th Installment', '11th Installment', '12th Installment'];
    const defaultDates = [
      '2026-04-10', '2026-07-10', '2026-10-10', '2027-01-10',
      '2026-05-10', '2026-06-10', '2026-08-10', '2026-09-10',
      '2026-11-10', '2026-12-10', '2027-02-10', '2027-03-10'
    ];

    const newInsts = Array.from({ length: num }, (_, idx) => {
      const existing = structureForm.installments[idx];
      return {
        name: instNames[idx] || `${idx + 1}th Installment`,
        amount: existing?.amount || (idx === num - 1 ? total - perInst * (num - 1) : perInst),
        dueDate: existing?.dueDate || defaultDates[idx] || '2026-04-10',
      };
    });

    setStructureForm((prev) => ({
      ...prev,
      numberOfInstallments: num,
      installments: newInsts,
    }));
  };

  const handleAddFeeType = () => {
    const updated = [...structureForm.feeTypes, { type: '', amount: '', frequency: 'Annual' }];
    setStructureForm((prev) => ({ ...prev, feeTypes: updated }));
  };

  const handleRemoveFeeType = (index) => {
    const updated = structureForm.feeTypes.filter((_, i) => i !== index);
    setStructureForm((prev) => ({ ...prev, feeTypes: updated }));
  };

  const handleFeeTypeChange = (index, field, value) => {
    const updated = [...structureForm.feeTypes];
    updated[index][field] = value;
    setStructureForm((prev) => ({ ...prev, feeTypes: updated }));
  };

  const handleInstallmentChange = (index, field, value) => {
    const updated = [...structureForm.installments];
    updated[index][field] = value;
    setStructureForm((prev) => ({ ...prev, installments: updated }));
  };

  const handleOpenAddStructure = () => {
    const defaultCourseId = courses?.data?.[0]?._id || '';
    const defaultCourseName = courses?.data?.[0]?.name || 'Class 5';
    setStructureStep(1);
    setStructureForm({
      id: '',
      name: `${defaultCourseName} - Regular`,
      academicSession: academicYear,
      courseId: defaultCourseId,
      section: 'A',
      feeTypes: [
        { type: 'Tuition Fee', amount: 24000, frequency: 'Annual' },
        { type: 'Admission Fee', amount: 5000, frequency: 'One Time' },
        { type: 'Activity Fee', amount: 3000, frequency: 'Annual' },
        { type: 'Computer Fee', amount: 2000, frequency: 'Annual' },
      ],
      enableInstallments: true,
      numberOfInstallments: 4,
      installments: [
        { name: '1st Installment', amount: 8500, dueDate: '2026-04-10' },
        { name: '2nd Installment', amount: 8500, dueDate: '2026-07-10' },
        { name: '3rd Installment', amount: 8500, dueDate: '2026-10-10' },
        { name: '4th Installment', amount: 8500, dueDate: '2027-01-10' },
      ],
      applyLateFee: true,
      lateFeeAmount: 100,
      lateFeePeriod: 'Per Day',
      allowPartialPayment: false,
      isActive: true,
    });
    setStructureModal(true);
  };

  const handleOpenEditStructure = (f) => {
    setStructureStep(1);
    const feeTypes = f.feeTypes && f.feeTypes.length > 0
      ? f.feeTypes
      : [
          { type: 'Tuition Fee', amount: f.tuition || 0, frequency: 'Annual' },
          ...(f.exam ? [{ type: 'Examination Fee', amount: f.exam, frequency: 'Annual' }] : []),
          ...(f.lab ? [{ type: 'Activity Fee', amount: f.lab, frequency: 'Annual' }] : []),
          ...(f.library ? [{ type: 'Computer Fee', amount: f.library, frequency: 'Annual' }] : []),
        ];

    const numInst = f.numberOfInstallments || 4;
    const installments = f.installments && f.installments.length > 0
      ? f.installments
      : [
          { name: '1st Installment', amount: Math.round((f.total || 0) / 4), dueDate: '2026-04-10' },
          { name: '2nd Installment', amount: Math.round((f.total || 0) / 4), dueDate: '2026-07-10' },
          { name: '3rd Installment', amount: Math.round((f.total || 0) / 4), dueDate: '2026-10-10' },
          { name: '4th Installment', amount: Math.round((f.total || 0) / 4), dueDate: '2027-01-10' },
        ];

    setStructureForm({
      id: f._id || '',
      name: f.name || `${f.class} - Regular`,
      academicSession: f.academicSession || academicYear,
      courseId: f.courseId || '',
      section: f.section || 'A',
      feeTypes,
      enableInstallments: f.enableInstallments !== undefined ? f.enableInstallments : true,
      numberOfInstallments: numInst,
      installments,
      applyLateFee: f.applyLateFee !== undefined ? f.applyLateFee : true,
      lateFeeAmount: f.lateFeeAmount !== undefined ? f.lateFeeAmount : 100,
      lateFeePeriod: f.lateFeePeriod || 'Per Day',
      allowPartialPayment: f.allowPartialPayment || false,
      isActive: f.isActive !== undefined ? f.isActive : true,
    });
    setStructureModal(true);
  };

  const handleDuplicateStructure = (f) => {
    handleOpenEditStructure(f);
    setStructureForm((prev) => ({
      ...prev,
      id: '',
      name: `${prev.name} (Copy)`,
    }));
  };

  const handleDeleteStructure = async (f) => {
    if (!f._id) return;
    if (!confirm(`Are you sure you want to delete fee structure for ${f.class}?`)) return;
    const r = await run(() => api(`/api/fees/structures?id=${f._id}`, 'DELETE'), 'Fee structure deleted');
    if (r) {
      mutateDash();
    }
  };

  const handleSaveStructure = async (e) => {
    if (e) e.preventDefault();
    if (!structureForm.courseId) return;
    const r = await run(
      () => api('/api/fees/structures', 'POST', structureForm),
      'Fee Structure saved successfully'
    );
    if (r) {
      setStructureModal(false);
      mutateDash();
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
      ...filteredReceipts.map((r) => [r.receiptNo, r.name, r.class, r.amount, r.mode, r.date]),
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
          value={inr(dashData?.kpis?.totalFee || 0)}
          sub="Annual target"
        />
        <Stat
          icon={CheckCircle2}
          tone="green"
          label="Collected Fees"
          value={inr(dashData?.kpis?.collectedFees || 0)}
          sub={dashData?.kpis?.totalFee ? `${Math.round(((dashData.kpis.collectedFees || 0) / dashData.kpis.totalFee) * 100)}% collected` : '0% collected'}
          subTone="text-emerald-600 font-bold"
        />
        <Stat
          icon={AlertTriangle}
          tone="red"
          label="Pending Fees"
          value={inr(dashData?.kpis?.pendingFees || 0)}
          sub={dashData?.kpis?.totalFee ? `${Math.round(((dashData.kpis.pendingFees || 0) / dashData.kpis.totalFee) * 100)}% remaining` : '0% remaining'}
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
                  {recentList.length > 0 ? (
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
                  ) : (
                    <div className="py-10 text-center text-xs text-ink-400">
                      No recent fee payments found.
                    </div>
                  )}
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
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Fee Structure Management</h3>
                <p className="text-xs text-ink-400">Manage class-wise fee structures, fee breakdowns, and installment schedules</p>
              </div>
              <button onClick={handleOpenAddStructure} className="btn-primary text-xs h-9">
                <Plus className="h-3.5 w-3.5" /> Create Fee Structure
              </button>
            </div>

            {/* Class Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="font-bold text-ink-500 shrink-0">Class:</span>
              <button
                onClick={() => setSelectedClassFilter('all')}
                className={`rounded-lg px-3 py-1 font-semibold transition ${
                  selectedClassFilter === 'all'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-ink-600 border border-ink/10 hover:bg-ink-50'
                }`}
              >
                All Classes
              </button>
              {courses?.data?.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedClassFilter(c.name)}
                  className={`rounded-lg px-3 py-1 font-semibold transition whitespace-nowrap ${
                    selectedClassFilter === c.name
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-ink-600 border border-ink/10 hover:bg-ink-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* List / Cards of Fee Structures */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feeStructures
                .filter((f) => selectedClassFilter === 'all' || f.class === selectedClassFilter)
                .map((f, i) => {
                  const items = f.feeTypes && f.feeTypes.length > 0
                    ? f.feeTypes
                    : [
                        { type: 'Tuition Fee', amount: f.tuition || 0, frequency: 'Annual' },
                        ...(f.exam ? [{ type: 'Admission/Exam Fee', amount: f.exam, frequency: 'One Time' }] : []),
                        ...(f.lab ? [{ type: 'Activity Fee', amount: f.lab, frequency: 'Annual' }] : []),
                        ...(f.library ? [{ type: 'Computer Fee', amount: f.library, frequency: 'Annual' }] : []),
                      ];
                  const totalAmount = f.total || items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                  const insts = f.installments && f.installments.length > 0 ? f.installments : [];

                  return (
                    <div
                      key={f._id || i}
                      className="card p-5 transition hover:shadow-md border border-ink/[.08] relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                              <Layers className="h-5 w-5" />
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-ink">{f.name || `${f.class} - Regular`}</h4>
                              <p className="text-[11px] text-ink-400">
                                {f.academicSession || '2026 - 2027'} &bull; Section {f.section || 'A'}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Edit, Copy, Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditStructure(f)}
                              title="Edit Structure"
                              className="rounded-lg p-1.5 text-ink-400 hover:text-brand-600 hover:bg-brand-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateStructure(f)}
                              title="Duplicate Structure"
                              className="rounded-lg p-1.5 text-ink-400 hover:text-sky-600 hover:bg-sky-50"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStructure(f)}
                              title="Delete Structure"
                              className="rounded-lg p-1.5 text-ink-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Total Card */}
                        <div className="mt-4 rounded-xl bg-brand-50/50 p-3 border border-brand-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-800">Total Fee (Annual)</span>
                          <span className="text-lg font-black text-brand-700">{inr(totalAmount)}</span>
                        </div>

                        {/* Fee Types Breakdown */}
                        <div className="mt-3.5 space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                            Fee Components ({items.length})
                          </span>
                          <div className="space-y-1 text-xs">
                            {items.slice(0, 4).map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-0.5 text-ink-600">
                                <span>{item.type || 'Fee'}</span>
                                <span className="font-semibold text-ink">{inr(item.amount)}</span>
                              </div>
                            ))}
                            {items.length > 4 && (
                              <div className="text-[11px] text-brand-600 font-semibold">
                                +{items.length - 4} more components
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Installments Breakdown */}
                        {insts.length > 0 && (
                          <div className="mt-3 border-t border-ink/[.06] pt-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                              Installments ({insts.length} parts)
                            </span>
                            <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px]">
                              {insts.slice(0, 4).map((inst, idx) => (
                                <div key={idx} className="rounded-lg bg-ink-50/70 p-1.5">
                                  <div className="font-semibold text-ink-700">{inst.name}</div>
                                  <div className="font-bold text-brand-700">{inr(inst.amount)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Badge & Status */}
                      <div className="mt-4 flex items-center justify-between border-t border-ink/[.06] pt-2.5 text-xs">
                        <span className="flex items-center gap-1.5 text-ink-500">
                          <span className={`h-2 w-2 rounded-full ${f.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {f.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-ink-400 text-[11px]">
                          {f.applyLateFee !== false ? `Late Fee: ₹${f.lateFeeAmount || 100}/${f.lateFeePeriod || 'day'}` : 'No Late Fee'}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {feeStructures.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-ink-400">
                  No fee structures configured yet. Click 'Create Fee Structure' to add one.
                </div>
              )}
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

            {/* Search & Mode Filter Bar */}
            <div className="my-2 flex flex-wrap gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="inp pl-9"
                  placeholder="Search receipt no, student name, class..."
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                />
              </div>

              <select
                className="inp w-auto"
                value={receiptMode}
                onChange={(e) => setReceiptMode(e.target.value)}
              >
                <option value="">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Online">Online / Netbanking</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <Table
              rows={filteredReceipts}
              empty="No matching fee receipts found."
              cols={[
                { h: 'Receipt No.', render: (r) => <span className="font-mono font-bold text-brand-700">{r.receiptNo}</span> },
                { h: 'Student Name', render: (r) => <div className="font-bold text-ink">{r.name}</div> },
                { h: 'Class Assigned', render: (r) => r.class },
                { h: 'Amount Paid', render: (r) => <span className="font-extrabold text-ink">₹ {r.amount?.toLocaleString('en-IN')}</span> },
                { h: 'Mode', render: (r) => <Badge tone={r.mode === 'Online' ? 'green' : r.mode === 'UPI' ? 'purple' : 'orange'}>{r.mode}</Badge> },
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

      {/* Create / Edit Fee Structure Modal - Exactly matching design */}
      {structureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-ink/10 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink/[.08] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shadow-sm">
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    {structureForm.id ? 'Edit Fee Structure' : 'Create Fee Structure'}
                  </h2>
                  <p className="text-xs text-ink-400">Configure class-wise fee components, installments and payment rules</p>
                </div>
              </div>
              <button
                onClick={() => setStructureModal(false)}
                className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Wizard Indicator */}
            <div className="border-b border-ink/[.06] bg-ink-50/40 px-6 py-3">
              <div className="flex items-center justify-around max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => setStructureStep(1)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                      structureStep === 1
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm'
                        : structureStep > 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-ink-400 border border-ink/20'
                    }`}
                  >
                    1
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      structureStep === 1 ? 'text-brand-700' : 'text-ink-500'
                    }`}
                  >
                    Basic Details
                  </span>
                </button>

                <div className={`h-[2px] w-16 sm:w-28 transition-colors ${structureStep >= 2 ? 'bg-brand-500' : 'bg-ink/10'}`} />

                <button
                  type="button"
                  onClick={() => setStructureStep(2)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                      structureStep === 2
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm'
                        : structureStep > 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-ink-400 border border-ink/20'
                    }`}
                  >
                    2
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      structureStep === 2 ? 'text-brand-700' : 'text-ink-500'
                    }`}
                  >
                    Add Fee Types
                  </span>
                </button>

                <div className={`h-[2px] w-16 sm:w-28 transition-colors ${structureStep >= 3 ? 'bg-brand-500' : 'bg-ink/10'}`} />

                <button
                  type="button"
                  onClick={() => setStructureStep(3)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                      structureStep === 3
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-sm'
                        : 'bg-white text-ink-400 border border-ink/20'
                    }`}
                  >
                    3
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      structureStep === 3 ? 'text-brand-700' : 'text-ink-500'
                    }`}
                  >
                    Installment & Due Dates
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveStructure}>
              <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
                {/* 1. Basic Details Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Fee Structure Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={structureForm.name}
                      onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                      placeholder="e.g. Class 5 - Regular"
                      className="inp text-xs"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Academic Session <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="inp text-xs"
                      value={structureForm.academicSession}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, academicSession: e.target.value })
                      }
                      required
                    >
                      <option value="2026 - 2027">2026 – 2027</option>
                      <option value="2025 - 2026">2025 – 2026</option>
                      <option value="2024 - 2025">2024 – 2025</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Class <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="inp text-xs"
                      value={structureForm.courseId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const cObj = courses?.data?.find((x) => x._id === cid);
                        setStructureForm({
                          ...structureForm,
                          courseId: cid,
                          name: cObj ? `${cObj.name} - Regular` : structureForm.name,
                        });
                      }}
                      required
                    >
                      <option value="">Select Class</option>
                      {courses?.data?.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-ink-700 mb-1">
                      Section
                    </label>
                    <select
                      className="inp text-xs"
                      value={structureForm.section}
                      onChange={(e) => setStructureForm({ ...structureForm, section: e.target.value })}
                    >
                      <option value="All">All Sections</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>

                {/* 2. Main Two Column Grid: Fee Types & Amounts vs Installment Plan */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Left Column: Fee Types & Amounts */}
                  <div className="rounded-2xl border border-ink/[.08] bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-ink/[.06]">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold text-sm">
                          ₹
                        </span>
                        <h3 className="text-sm font-bold text-ink">Fee Types &amp; Amounts</h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFeeType}
                        className="btn-primary text-xs h-7 px-2.5 py-1 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Fee Type
                      </button>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {/* Table headers */}
                      <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-ink-400 px-1">
                        <div className="col-span-5">Fee Type</div>
                        <div className="col-span-3">Amount (₹)</div>
                        <div className="col-span-3">Frequency</div>
                        <div className="col-span-1 text-center"></div>
                      </div>

                      {/* Dynamic rows */}
                      {structureForm.feeTypes.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <input
                              type="text"
                              required
                              value={item.type}
                              onChange={(e) => handleFeeTypeChange(idx, 'type', e.target.value)}
                              placeholder="e.g. Tuition Fee"
                              className="inp text-xs py-1.5"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.amount}
                              onChange={(e) => handleFeeTypeChange(idx, 'amount', e.target.value)}
                              placeholder="0"
                              className="inp text-xs py-1.5 font-semibold text-ink"
                            />
                          </div>
                          <div className="col-span-3">
                            <select
                              value={item.frequency || 'Annual'}
                              onChange={(e) => handleFeeTypeChange(idx, 'frequency', e.target.value)}
                              className="inp text-xs py-1.5"
                            >
                              <option value="Annual">Annual</option>
                              <option value="One Time">One Time</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Term">Term</option>
                            </select>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFeeType(idx)}
                              disabled={structureForm.feeTypes.length <= 1}
                              title="Delete component"
                              className="text-rose-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-rose-400 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Fee Banner */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-sky-50/70 p-3.5 border border-sky-100">
                      <span className="text-xs font-bold text-sky-900">Total Fee (Annual)</span>
                      <span className="text-xl font-black text-sky-700">
                        {inr(calculateFeeTotal(structureForm.feeTypes))}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Installment Plan */}
                  <div className="rounded-2xl border border-ink/[.08] bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-ink/[.06]">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <h3 className="text-sm font-bold text-ink">Installment Plan</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={structureForm.enableInstallments}
                          onChange={(e) =>
                            setStructureForm({ ...structureForm, enableInstallments: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink/20 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    {structureForm.enableInstallments ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">
                            No. of Installments <span className="text-rose-500">*</span>
                          </label>
                          <select
                            className="inp text-xs py-1.5"
                            value={structureForm.numberOfInstallments}
                            onChange={(e) => handleNumberOfInstallmentsChange(e.target.value)}
                          >
                            <option value={1}>1 (Full Single Payment)</option>
                            <option value={2}>2 (Half-Yearly)</option>
                            <option value={3}>3 (Term Wise)</option>
                            <option value={4}>4 (Quarterly)</option>
                            <option value={6}>6 (Bi-Monthly)</option>
                            <option value={10}>10 Installments</option>
                            <option value={12}>12 (Monthly)</option>
                          </select>
                        </div>

                        {/* Installments table */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-ink-400 px-1">
                            <div className="col-span-4">Installment</div>
                            <div className="col-span-4">Amount (₹)</div>
                            <div className="col-span-4">Due Date</div>
                          </div>

                          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                            {structureForm.installments.map((inst, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-4">
                                  <input
                                    type="text"
                                    value={inst.name}
                                    onChange={(e) => handleInstallmentChange(idx, 'name', e.target.value)}
                                    className="inp text-xs py-1.5 font-medium text-ink-700"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <input
                                    type="number"
                                    min="0"
                                    value={inst.amount}
                                    onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                                    className="inp text-xs py-1.5 font-semibold text-ink"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <input
                                    type="date"
                                    value={inst.dueDate}
                                    onChange={(e) => handleInstallmentChange(idx, 'dueDate', e.target.value)}
                                    className="inp text-xs py-1.5"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Installment sum verification banner */}
                        {calculateInstallmentsTotal(structureForm.installments) !==
                          calculateFeeTotal(structureForm.feeTypes) && (
                          <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>
                              Installments sum ({inr(calculateInstallmentsTotal(structureForm.installments))})
                              differs from Total Fee ({inr(calculateFeeTotal(structureForm.feeTypes))}).
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-xs text-ink-400">
                        Installments disabled. Students will pay the total fee in one single collection.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Additional Settings Section */}
                <div className="rounded-2xl border border-ink/[.08] bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    <span>Additional Settings</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {/* Apply Late Fee */}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={structureForm.applyLateFee}
                          onChange={(e) =>
                            setStructureForm({ ...structureForm, applyLateFee: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-ink/20 text-brand-600 focus:ring-brand-500"
                        />
                        <span>Apply late fee after due date</span>
                      </label>

                      {structureForm.applyLateFee && (
                        <div className="flex items-center gap-2">
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400 font-bold">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={structureForm.lateFeeAmount}
                              onChange={(e) =>
                                setStructureForm({ ...structureForm, lateFeeAmount: e.target.value })
                              }
                              className="inp text-xs py-1 pl-6"
                              placeholder="100"
                            />
                          </div>

                          <select
                            value={structureForm.lateFeePeriod}
                            onChange={(e) =>
                              setStructureForm({ ...structureForm, lateFeePeriod: e.target.value })
                            }
                            className="inp text-xs py-1 w-32"
                          >
                            <option value="Per Day">Per Day</option>
                            <option value="Per Week">Per Week</option>
                            <option value="One Time">One Time</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Allow Partial Payment */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={structureForm.allowPartialPayment}
                          onChange={(e) =>
                            setStructureForm({
                              ...structureForm,
                              allowPartialPayment: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-ink/20 text-brand-600 focus:ring-brand-500"
                        />
                        <span>Allow partial payment (custom amount)</span>
                      </label>
                    </div>

                    {/* Make this fee structure active */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={structureForm.isActive}
                          onChange={(e) =>
                            setStructureForm({ ...structureForm, isActive: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-ink/20 text-brand-600 focus:ring-brand-500"
                        />
                        <span>Make this fee structure active</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-ink/[.08] px-6 py-4 bg-ink-50/20">
                <button
                  type="button"
                  onClick={() => setStructureModal(false)}
                  className="btn border border-ink/15 text-xs text-ink-700 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Save Fee Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeesAccountsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center">Loading fees...</div>}>
      <FeesContent />
    </Suspense>
  );
}
