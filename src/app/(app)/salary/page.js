'use client';
import { useState } from 'react';
import {
  IndianRupee,
  Users,
  FileText,
  TrendingUp,
  Banknote,
  Plus,
  Pencil,
  Trash2,
  Check,
  Clock,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building,
  CreditCard,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  DollarSign
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useApi, api, run, fmtDate, thisMonth, downloadCSV } from '@/lib/client';
import {
  Stat,
  Card,
  Table,
  Tabs,
  StatusBadge,
  Avatar,
  Badge,
  PageHeader,
  Modal,
  Field,
  inr,
  cn
} from '@/components/ui';

const EXPENSE_CATEGORIES = [
  'Electricity Bill',
  'Water & Utilities',
  'Building Rent',
  'Staff Welfare & Tea',
  'Internet & Software',
  'Stationery & Printing',
  'Lab & Sports Equipment',
  'Marketing & Advertising',
  'Vehicle & Transport Fuel',
  'Repairs & Maintenance',
  'Event & Functions',
  'Miscellaneous',
];

export default function SalaryExpensesPage() {
  const [month, setMonth] = useState(thisMonth());
  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'expenses' | 'slips' | 'reports'

  // Search & Filter States
  const [salarySearch, setSalarySearch] = useState('');
  const [salaryTypeFilter, setSalaryTypeFilter] = useState('all'); // all, Teaching, Non-Teaching
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  // Modals
  const [expenseModal, setExpenseModal] = useState(null); // form object
  const [payStaffModal, setPayStaffModal] = useState(null); // single staff pay modal
  const [slipModal, setSlipModal] = useState(null); // view/print salary slip

  // APIs
  const { data: sum, mutate: ms } = useApi(`/api/salary/summary?month=${month}`);
  const { data: pay, mutate: mp, isLoading: payLoading } = useApi(
    `/api/salary?month=${month}&type=${salaryTypeFilter}&q=${encodeURIComponent(salarySearch)}`
  );
  const { data: exp, mutate: me, isLoading: expLoading } = useApi(
    `/api/expenses?month=${month}&category=${expenseCategoryFilter}&q=${encodeURIComponent(expenseSearch)}`
  );

  const c = sum?.current || { income: 0, salary: 0, expenses: 0, profit: 0, margin: 0 };
  const payStats = pay?.stats || {
    totalStaff: 0,
    paidCount: 0,
    pendingCount: 0,
    totalPayroll: 0,
    paidAmount: 0,
    pendingAmount: 0,
  };

  const refreshAll = () => {
    ms();
    mp();
    me();
  };

  // Bulk Process Salary
  const handleProcessPayroll = async () => {
    await run(() => api('/api/salary/process', 'POST', { month }), `Payroll generated for ${month}`);
    refreshAll();
  };

  // Pay single staff with custom adjustments
  const handleSinglePaySubmit = async (e) => {
    e.preventDefault();
    if (!payStaffModal) return;
    const body = {
      month,
      payStaffId: payStaffModal.staff._id,
      allowances: Number(payStaffModal.allowances) || 0,
      deductions: Number(payStaffModal.deductions) || 0,
      paymentMode: payStaffModal.paymentMode || 'Bank Transfer',
      transactionRef: payStaffModal.transactionRef || '',
      remarks: payStaffModal.remarks || '',
    };
    const r = await run(() => api('/api/salary/process', 'POST', body), 'Salary marked as paid');
    if (r) {
      setPayStaffModal(null);
      refreshAll();
    }
  };

  // Toggle paid/pending status directly
  const handleToggleStatus = (record, newStatus) => {
    if (newStatus === 'paid' && !record.salary) {
      // Open pay modal
      setPayStaffModal({
        staff: record.staff,
        allowances: 0,
        deductions: 0,
        paymentMode: 'Bank Transfer',
        transactionRef: '',
        remarks: '',
      });
      return;
    }

    if (record.salary) {
      run(
        () => api(`/api/salary/${record.salary._id}`, 'PUT', { status: newStatus }),
        newStatus === 'paid' ? 'Marked as paid' : 'Payment reversed to pending'
      ).then(refreshAll);
    }
  };

  // Expense Actions
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseModal) return;
    const body = {
      ...expenseModal,
      amount: Number(expenseModal.amount) || 0,
      date: expenseModal.date || new Date().toISOString().slice(0, 10),
    };
    const r = await run(
      () => (expenseModal._id ? api(`/api/expenses/${expenseModal._id}`, 'PUT', body) : api('/api/expenses', 'POST', body)),
      'Expense entry saved'
    );
    if (r) {
      setExpenseModal(null);
      refreshAll();
    }
  };

  const handleDeleteExpense = async (id) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      await run(() => api(`/api/expenses/${id}`, 'DELETE'), 'Expense deleted');
      refreshAll();
    }
  };

  // Export CSVs
  const exportPayrollCSV = () => {
    downloadCSV(`payroll_${month}.csv`, [
      ['Staff ID', 'Staff Name', 'Category', 'Role', 'Department', 'Base Salary', 'Net Payable', 'Status', 'Payment Mode', 'Date'],
      ...(pay?.data || []).map((r) => [
        r.staff?.staffId || '–',
        r.staff?.name || '–',
        r.staff?.type || '–',
        r.staff?.role || '–',
        r.staff?.department || '–',
        r.baseSalary,
        r.netSalary,
        r.status?.toUpperCase(),
        r.paymentMode,
        r.paidOn ? fmtDate(r.paidOn) : 'Pending',
      ]),
    ]);
  };

  const exportExpensesCSV = () => {
    downloadCSV(`expenses_${month}.csv`, [
      ['Title / Item', 'Category', 'Amount (₹)', 'Date', 'Payment Mode', 'Vendor / Notes'],
      ...(exp?.data || []).map((e) => [
        e.title || e.category,
        e.category,
        e.amount,
        fmtDate(e.date),
        e.paymentMode || 'UPI',
        e.vendor || e.note || '–',
      ]),
    ]);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        icon={Banknote}
        title="Salary &amp; Expenses"
        sub="Process staff payroll, generate monthly salary slips, record operational expenses, and analyze profit margins."
      >
        <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-1.5 shadow-sm text-xs font-semibold text-ink-700">
          <Calendar className="h-4 w-4 text-brand-600" />
          <span>Salary Month:</span>
          <input
            type="month"
            className="outline-none bg-transparent font-bold text-ink cursor-pointer"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <button
          className="btn-outline"
          onClick={() =>
            setExpenseModal({
              title: '',
              category: 'Electricity Bill',
              amount: '',
              date: new Date().toISOString().slice(0, 10),
              paymentMode: 'UPI',
              vendor: '',
              invoiceNo: '',
              note: '',
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>

        <button className="btn-primary" onClick={handleProcessPayroll}>
          <IndianRupee className="h-4 w-4" />
          Generate Payroll
        </button>
      </PageHeader>

      {/* Top 5 Financial & Payroll Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          icon={Banknote}
          tone="green"
          label={`Fee Collections (${month})`}
          value={inr(c.income)}
          sub="Student receipts"
          subTone="text-emerald-600 font-bold"
        />
        <Stat
          icon={Users}
          tone="purple"
          label={`Total Staff Salary`}
          value={inr(payStats.totalPayroll || c.salary)}
          sub={`${payStats.paidCount} Paid • ${payStats.pendingCount} Pending`}
        />
        <Stat
          icon={FileText}
          tone="orange"
          label={`Institute Expenses`}
          value={inr(exp?.total || c.expenses)}
          sub={`${exp?.count || 0} bills this month`}
        />
        <Stat
          icon={TrendingUp}
          tone={c.profit >= 0 ? 'blue' : 'red'}
          label="Net Balance / Profit"
          value={inr(c.profit)}
          sub={`Margin: ${c.margin}%`}
          subTone={c.profit >= 0 ? 'text-blue-600 font-bold' : 'text-rose-600 font-bold'}
        />
        <Stat
          icon={TrendingUp}
          tone={sum?.vsPrev >= 0 ? 'green' : 'red'}
          label="Growth vs Last Month"
          value={`${sum?.vsPrev > 0 ? '+' : ''}${sum?.vsPrev ?? 0}%`}
          sub="Net revenue trajectory"
        />
      </div>

      {/* Main Tabs Navigation */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            ['payroll', `Staff Payroll (${payStats.totalStaff})`],
            ['expenses', `Expense Outflows (${exp?.count || 0})`],
            ['analytics', 'Financial Trends & Analytics'],
          ]}
        />

        {/* 1. TAB: Staff Payroll */}
        {activeTab === 'payroll' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Staff Monthly Payroll Register</h3>
                <p className="text-xs text-ink-400">
                  Track salary disbursement for teaching and non-teaching staff for {month}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={exportPayrollCSV} className="btn-outline text-xs h-9">
                  <Download className="h-3.5 w-3.5" /> Export Payroll Sheet
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="my-2 flex flex-wrap gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="inp pl-9"
                  placeholder="Search staff name, ID, role or department..."
                  value={salarySearch}
                  onChange={(e) => setSalarySearch(e.target.value)}
                />
              </div>

              <select
                className="inp w-auto"
                value={salaryTypeFilter}
                onChange={(e) => setSalaryTypeFilter(e.target.value)}
              >
                <option value="all">All Staff Categories</option>
                <option value="Teaching">Teaching Staff</option>
                <option value="Non-Teaching">Non-Teaching Staff</option>
              </select>
            </div>

            {/* Payroll Table */}
            <Table
              loading={payLoading}
              rows={pay?.data}
              empty="No staff records found for this month."
              cols={[
                { h: '#', render: (_, i) => i + 1 },
                {
                  h: 'Staff Member',
                  render: (r) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar src={r.staff?.photo?.url} name={r.staff?.name} size={32} />
                      <div>
                        <div className="font-bold text-ink">{r.staff?.name}</div>
                        <div className="text-[11px] text-ink-400">
                          {r.staff?.staffId} • {r.staff?.department}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  h: 'Role / Type',
                  render: (r) => (
                    <div>
                      <div className="font-semibold text-ink text-xs">{r.staff?.role}</div>
                      <Badge tone={r.staff?.type === 'Teaching' ? 'purple' : 'blue'}>
                        {r.staff?.type}
                      </Badge>
                    </div>
                  ),
                },
                {
                  h: 'Base Salary',
                  render: (r) => <span className="font-bold text-ink">{inr(r.baseSalary)}</span>,
                },
                {
                  h: 'Allowances',
                  render: (r) => (
                    <span className="text-emerald-600 font-semibold text-xs">
                      {r.salary?.allowances ? `+${inr(r.salary.allowances)}` : '₹0'}
                    </span>
                  ),
                },
                {
                  h: 'Deductions',
                  render: (r) => (
                    <span className="text-rose-500 font-semibold text-xs">
                      {r.salary?.deductions ? `-${inr(r.salary.deductions)}` : '₹0'}
                    </span>
                  ),
                },
                {
                  h: 'Net Payable',
                  render: (r) => (
                    <span className="font-extrabold text-brand-700">{inr(r.netSalary)}</span>
                  ),
                },
                {
                  h: 'Status',
                  render: (r) => {
                    if (r.status === 'paid') return <Badge tone="green" dot>Paid</Badge>;
                    if (r.status === 'pending') return <Badge tone="orange" dot>Pending</Badge>;
                    return <Badge tone="gray">Not Generated</Badge>;
                  },
                },
                {
                  h: 'Slip & Actions',
                  render: (r) => (
                    <div className="flex items-center gap-2">
                      {/* View Slip */}
                      <button
                        title="Print / View Payslip"
                        onClick={() => setSlipModal(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2 py-1 text-xs font-semibold hover:bg-brand-50 hover:text-brand-600 transition"
                      >
                        <Printer className="h-3 w-3" /> Payslip
                      </button>

                      {/* Pay / Undo Action */}
                      {r.status === 'paid' ? (
                        <button
                          title="Undo payment"
                          onClick={() => handleToggleStatus(r, 'pending')}
                          className="text-xs text-ink-400 hover:text-rose-600 hover:underline"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setPayStaffModal({
                              staff: r.staff,
                              allowances: r.salary?.allowances || 0,
                              deductions: r.salary?.deductions || 0,
                              paymentMode: r.salary?.paymentMode || 'Bank Transfer',
                              transactionRef: r.salary?.transactionRef || '',
                              remarks: '',
                            })
                          }
                          className="btn-primary text-xs px-2.5 py-1 h-7"
                        >
                          <Check className="h-3 w-3" /> Pay Now
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />

            {/* Payroll Bottom Summary Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink/[.06] bg-brand-50/30 p-4">
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <span className="text-ink-400">Total Staff:</span>{' '}
                  <b className="text-ink">{payStats.totalStaff}</b>
                </div>
                <div>
                  <span className="text-ink-400">Total Disbursed:</span>{' '}
                  <b className="text-emerald-600">{inr(payStats.paidAmount)}</b>
                </div>
                <div>
                  <span className="text-ink-400">Pending Disbursement:</span>{' '}
                  <b className="text-rose-500">{inr(payStats.pendingAmount)}</b>
                </div>
              </div>

              <div className="text-sm font-bold text-ink">
                Total Payroll: <span className="text-brand-700 text-lg font-black">{inr(payStats.totalPayroll)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB: Expenses Management */}
        {activeTab === 'expenses' && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Institute Operational Expenses</h3>
                <p className="text-xs text-ink-400">
                  Track vendor bills, electricity, rent, maintenance and daily utility expenditures
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={exportExpensesCSV} className="btn-outline text-xs h-9">
                  <Download className="h-3.5 w-3.5" /> Export Expense Sheet
                </button>
                <button
                  onClick={() =>
                    setExpenseModal({
                      title: '',
                      category: 'Electricity Bill',
                      amount: '',
                      date: new Date().toISOString().slice(0, 10),
                      paymentMode: 'UPI',
                      vendor: '',
                      invoiceNo: '',
                      note: '',
                    })
                  }
                  className="btn-primary text-xs h-9"
                >
                  <Plus className="h-3.5 w-3.5" /> Record Expense
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="my-2 flex flex-wrap gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="inp pl-9"
                  placeholder="Search expense title, vendor, invoice or notes..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                />
              </div>

              <select
                className="inp w-auto"
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              >
                <option value="all">All Expense Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Expenses Cards Breakdown (Top 4 Categories) */}
            {exp?.catBreakdown && Object.keys(exp.catBreakdown).length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(exp.catBreakdown)
                  .slice(0, 4)
                  .map(([cat, amt]) => (
                    <div key={cat} className="card p-3.5 border border-ink/[.06]">
                      <div className="text-xs text-ink-400 font-medium truncate">{cat}</div>
                      <div className="mt-1 text-xl font-black text-ink">{inr(amt)}</div>
                      <div className="mt-1 text-[11px] text-ink-500">
                        {Math.round((amt / (exp.total || 1)) * 100)}% of monthly total
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Expenses Table */}
            <Table
              loading={expLoading}
              rows={exp?.data}
              empty="No expense entries recorded for this month. Click 'Record Expense' to add one."
              cols={[
                { h: '#', render: (_, i) => i + 1 },
                {
                  h: 'Expense / Item',
                  render: (e) => (
                    <div>
                      <div className="font-bold text-ink">{e.title || e.category}</div>
                      {e.vendor && <div className="text-[11px] text-ink-400">Vendor: {e.vendor}</div>}
                    </div>
                  ),
                },
                {
                  h: 'Category',
                  render: (e) => <Badge tone="purple">{e.category}</Badge>,
                },
                {
                  h: 'Amount',
                  render: (e) => (
                    <span className="font-extrabold text-ink">{inr(e.amount)}</span>
                  ),
                },
                {
                  h: 'Payment Mode',
                  render: (e) => (
                    <Badge tone={e.paymentMode === 'UPI' ? 'green' : 'blue'}>
                      {e.paymentMode || 'UPI'}
                    </Badge>
                  ),
                },
                {
                  h: 'Date',
                  render: (e) => fmtDate(e.date),
                },
                {
                  h: 'Invoice / Note',
                  render: (e) => (
                    <span className="text-xs text-ink-500 truncate max-w-xs block">
                      {e.invoiceNo ? `Inv #${e.invoiceNo} • ` : ''}
                      {e.note || '–'}
                    </span>
                  ),
                },
                {
                  h: 'Actions',
                  render: (e) => (
                    <div className="flex gap-2">
                      <button
                        title="Edit Expense"
                        onClick={() =>
                          setExpenseModal({
                            ...e,
                            date: e.date ? new Date(e.date).toISOString().slice(0, 10) : '',
                          })
                        }
                        className="rounded-lg p-1 text-brand-600 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete Expense"
                        onClick={() => handleDeleteExpense(e._id)}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />

            <div className="mt-3 flex items-center justify-between border-t border-ink/[.06] pt-3">
              <span className="text-sm text-ink-500">Total Outflow for {month}</span>
              <b className="text-xl font-black text-rose-600">{inr(exp?.total || 0)}</b>
            </div>
          </div>
        )}

        {/* 3. TAB: Financial Trends & Analytics */}
        {activeTab === 'analytics' && (
          <div className="mt-5 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              {/* Trend Chart */}
              <div className="rounded-2xl border border-ink/[.06] bg-brand-50/20 p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-ink">Income vs Expenses (Last 6 Months)</h3>
                  <p className="text-xs text-ink-400">Comparing fee revenues against staff salaries and bills</p>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={(sum?.trend || []).map((t) => ({
                        ...t,
                        out: (t.salary || 0) + (t.expenses || 0),
                      }))}
                    >
                      <CartesianGrid vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => {
                          const a = Math.abs(v);
                          const s = v < 0 ? '-' : '';
                          return s + (a >= 1e5 ? +(a / 1e5).toFixed(1) + 'L' : a >= 1e3 ? Math.round(a / 1e3) + 'K' : a);
                        }}
                      />
                      <Tooltip formatter={(v) => inr(v)} />
                      <Legend />
                      <Bar dataKey="income" name="Fee Revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="out" name="Total Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      <Line dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Statement Summary */}
              <div className="rounded-2xl border border-ink/[.06] bg-white p-5 space-y-4">
                <div className="border-b border-ink/[.06] pb-3">
                  <h3 className="text-sm font-bold text-ink">Financial Statement – {month}</h3>
                  <p className="text-xs text-ink-400">Overall profit and operating breakdown</p>
                </div>

                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-ink/[.04] pb-2">
                    <dt className="text-ink-600">Total Fee Inflow</dt>
                    <dd className="font-extrabold text-emerald-600">{inr(c.income)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-ink/[.04] pb-2">
                    <dt className="text-ink-600">Staff Salary Outflow</dt>
                    <dd className="font-extrabold text-rose-500">-{inr(c.salary)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-ink/[.04] pb-2">
                    <dt className="text-ink-600">Operational Bills</dt>
                    <dd className="font-extrabold text-rose-500">-{inr(c.expenses)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-ink/[.04] pb-2 pt-1 font-bold">
                    <dt className="text-ink">Net Operating Outflow</dt>
                    <dd className="text-rose-600">{inr((c.salary || 0) + (c.expenses || 0))}</dd>
                  </div>
                </dl>

                <div
                  className={cn(
                    'flex items-center justify-between rounded-xl p-4',
                    c.profit >= 0 ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold">Net Profit / Surplus</div>
                    <div className="text-xs opacity-75">Operating Profit Margin: {c.margin}%</div>
                  </div>
                  <b className="text-2xl font-black">{inr(c.profit)}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Pay Single Staff Modal with Custom Adjustments */}
      {payStaffModal && (
        <Modal
          open={!!payStaffModal}
          onClose={() => setPayStaffModal(null)}
          title={`Disburse Salary – ${payStaffModal.staff?.name}`}
          width="max-w-md"
        >
          <form onSubmit={handleSinglePaySubmit} className="space-y-4">
            <div className="rounded-xl bg-brand-50/50 p-3 text-xs flex justify-between items-center border border-ink/[.06]">
              <div>
                <span className="text-ink-400">Designation:</span> <b>{payStaffModal.staff?.role}</b>
                <div className="text-ink-400">ID: {payStaffModal.staff?.staffId}</div>
              </div>
              <div className="text-right">
                <span className="text-ink-400">Base Salary:</span>
                <div className="text-base font-extrabold text-ink">{inr(payStaffModal.staff?.salary)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Bonus / Allowance (₹)">
                <input
                  type="number"
                  min="0"
                  className="inp"
                  value={payStaffModal.allowances}
                  onChange={(e) => setPayStaffModal({ ...payStaffModal, allowances: e.target.value })}
                  placeholder="0"
                />
              </Field>

              <Field label="Deductions (₹)">
                <input
                  type="number"
                  min="0"
                  className="inp"
                  value={payStaffModal.deductions}
                  onChange={(e) => setPayStaffModal({ ...payStaffModal, deductions: e.target.value })}
                  placeholder="0"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Mode" required>
                <select
                  className="inp"
                  value={payStaffModal.paymentMode}
                  onChange={(e) => setPayStaffModal({ ...payStaffModal, paymentMode: e.target.value })}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI / Google Pay</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </Field>

              <Field label="Txn / Ref Number">
                <input
                  className="inp"
                  value={payStaffModal.transactionRef}
                  onChange={(e) => setPayStaffModal({ ...payStaffModal, transactionRef: e.target.value })}
                  placeholder="e.g. UTR123456"
                />
              </Field>
            </div>

            <Field label="Remarks / Note">
              <input
                className="inp"
                value={payStaffModal.remarks}
                onChange={(e) => setPayStaffModal({ ...payStaffModal, remarks: e.target.value })}
                placeholder="e.g. Overtime or festival bonus added"
              />
            </Field>

            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 text-center">
              <div className="text-xs text-ink-500 font-semibold uppercase">Net Amount to Transfer</div>
              <div className="mt-1 text-2xl font-black text-brand-700">
                {inr(
                  Math.max(
                    0,
                    (Number(payStaffModal.staff?.salary) || 0) +
                      (Number(payStaffModal.allowances) || 0) -
                      (Number(payStaffModal.deductions) || 0)
                  )
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPayStaffModal(null)}
                className="btn border border-ink/10 text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Confirm &amp; Disburse
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Expense Modal */}
      {expenseModal && (
        <Modal
          open={!!expenseModal}
          onClose={() => setExpenseModal(null)}
          title={expenseModal._id ? 'Edit Expense Record' : 'Record New Expense'}
          width="max-w-md"
        >
          <form onSubmit={handleSaveExpense} className="space-y-4">
            <Field label="Expense Title / Description" required>
              <input
                required
                className="inp"
                value={expenseModal.title}
                onChange={(e) => setExpenseModal({ ...expenseModal, title: e.target.value })}
                placeholder="e.g. Monthly Electricity Bill for Campus"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category" required>
                <select
                  className="inp"
                  value={expenseModal.category}
                  onChange={(e) => setExpenseModal({ ...expenseModal, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Amount (₹)" required>
                <input
                  type="number"
                  min="1"
                  required
                  className="inp"
                  value={expenseModal.amount}
                  onChange={(e) => setExpenseModal({ ...expenseModal, amount: e.target.value })}
                  placeholder="15000"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Date" required>
                <input
                  type="date"
                  required
                  className="inp"
                  value={expenseModal.date}
                  onChange={(e) => setExpenseModal({ ...expenseModal, date: e.target.value })}
                />
              </Field>

              <Field label="Payment Mode">
                <select
                  className="inp"
                  value={expenseModal.paymentMode}
                  onChange={(e) => setExpenseModal({ ...expenseModal, paymentMode: e.target.value })}
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Net Banking / NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Vendor / Payee Name">
                <input
                  className="inp"
                  value={expenseModal.vendor}
                  onChange={(e) => setExpenseModal({ ...expenseModal, vendor: e.target.value })}
                  placeholder="e.g. Electricity Board"
                />
              </Field>

              <Field label="Bill / Invoice Number">
                <input
                  className="inp"
                  value={expenseModal.invoiceNo}
                  onChange={(e) => setExpenseModal({ ...expenseModal, invoiceNo: e.target.value })}
                  placeholder="e.g. INV-9874"
                />
              </Field>
            </div>

            <Field label="Notes / Remarks">
              <input
                className="inp"
                value={expenseModal.note}
                onChange={(e) => setExpenseModal({ ...expenseModal, note: e.target.value })}
                placeholder="Optional notes or details"
              />
            </Field>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setExpenseModal(null)}
                className="btn border border-ink/10 text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Save Expense
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Printable Salary Payslip Modal */}
      {slipModal && (
        <Modal
          open={!!slipModal}
          onClose={() => setSlipModal(null)}
          title="Official Staff Payslip"
          width="max-w-md"
        >
          <div className="space-y-4 p-2 text-ink">
            <div className="text-center border-b border-ink/[.08] pb-3">
              <h2 className="text-lg font-black text-navy">EduManage Academy</h2>
              <p className="text-xs text-ink-400">Monthly Salary Statement &amp; Payslip</p>
              <span className="mt-1 inline-block text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                Month: {month}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-ink-400">Employee ID:</span>
              <span className="font-bold font-mono">{slipModal.staff?.staffId}</span>

              <span className="text-ink-400">Staff Name:</span>
              <span className="font-bold">{slipModal.staff?.name}</span>

              <span className="text-ink-400">Department:</span>
              <span className="font-semibold">{slipModal.staff?.department}</span>

              <span className="text-ink-400">Designation / Role:</span>
              <span className="font-semibold">{slipModal.staff?.role}</span>

              <span className="text-ink-400">Payment Status:</span>
              <span>
                {slipModal.status === 'paid' ? (
                  <Badge tone="green">Paid ({slipModal.paidOn ? fmtDate(slipModal.paidOn) : 'Cleared'})</Badge>
                ) : (
                  <Badge tone="orange">Pending</Badge>
                )}
              </span>

              <span className="text-ink-400">Payment Mode:</span>
              <span className="font-semibold">{slipModal.paymentMode || 'Bank Transfer'}</span>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="rounded-xl border border-ink/[.06] bg-slate-50/50 p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-600">Basic Salary:</span>
                <b className="text-ink">{inr(slipModal.baseSalary)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Allowances &amp; Incentives:</span>
                <b className="text-emerald-600">+{inr(slipModal.salary?.allowances || 0)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Deductions (TDS / Leaves):</span>
                <b className="text-rose-500">-{inr(slipModal.salary?.deductions || 0)}</b>
              </div>
            </div>

            <div className="rounded-xl bg-brand-50/70 p-4 border border-brand-200 text-center">
              <div className="text-xs text-ink-500 font-semibold uppercase">Net Take-Home Pay</div>
              <div className="text-2xl font-black text-brand-700 mt-1">{inr(slipModal.netSalary)}</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">
                {slipModal.status === 'paid' ? 'Payment Verified & Transferred' : 'Scheduled for Disbursement'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSlipModal(null)} className="btn border border-ink/10 text-xs">
                Close
              </button>
              <button onClick={() => window.print()} className="btn-primary text-xs flex items-center gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print Payslip
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
