'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Upload,
  UserCheck,
  FileText,
  Clock,
  X
} from 'lucide-react';
import { useApi, api, run, qs, fmtDate, downloadCSV } from '@/lib/client';
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
  inr,
  Empty
} from '@/components/ui';

export default function StaffManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'teachers';
  const [tab, setTab] = useState(currentTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setTab(t);
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setF((x) => ({ ...x, page: 1 }));
    router.replace(`/staff?tab=${newTab}`, { scroll: false });
  };

  const [f, setF] = useState({ q: '', department: 'all', status: 'all', page: 1 });
  const [sel, setSel] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const limit = 8;
  const setFilter = (o) => setF((x) => ({ ...x, page: 1, ...o }));

  const typeParam = tab === 'teachers' ? 'Teaching' : tab === 'non-teaching' ? 'Non-Teaching' : 'all';
  const query = qs({
    page: f.page,
    limit,
    type: typeParam,
    q: f.q,
    department: f.department,
    status: f.status,
  });

  const { data, isLoading, mutate } = useApi(`/api/staff?${query}`);
  const { data: attendanceData, mutate: refreshAttendance } = useApi('/api/staff/attendance');
  const { data: leavesData, mutate: refreshLeaves } = useApi('/api/staff/leaves');

  const staffList = data?.data || [];
  const stats = data?.stats || {
    totalStaff: 0,
    teachersCount: 0,
    nonTeachingCount: 0,
    presentToday: 0,
    onLeave: 0,
  };

  // Add staff form
  const [form, setForm] = useState({
    name: '',
    type: 'Teaching',
    role: 'Teacher',
    department: 'Academics',
    subjects: '',
    assignedClasses: '',
    phone: '',
    email: '',
    salary: '',
  });

  // Leave form
  const [leaveForm, setLeaveForm] = useState({
    staff: '',
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
  });

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    const r = await run(() =>
      api('/api/staff', 'POST', {
        ...form,
        subjects: form.subjects ? form.subjects.split(',').map((s) => s.trim()) : [],
        assignedClasses: form.assignedClasses ? form.assignedClasses.split(',').map((c) => c.trim()) : [],
        salary: Number(form.salary) || 0,
      }),
      'Staff member added'
    );
    if (r) {
      setAddModal(false);
      setForm({ name: '', type: 'Teaching', role: 'Teacher', department: 'Academics', subjects: '', assignedClasses: '', phone: '', email: '', salary: '' });
      mutate();
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    const r = await run(() => api('/api/staff/leaves', 'POST', { ...leaveForm, status: 'Approved' }), 'Leave approved');
    if (r) {
      setLeaveModal(false);
      refreshLeaves();
      mutate();
    }
  };

  const exportStaff = () =>
    downloadCSV('staff_records.csv', [
      ['ID', 'Name', 'Type', 'Role', 'Department', 'Phone', 'Email', 'Salary', 'Status'],
      ...staffList.map((s) => [s.staffId, s.name, s.type, s.role, s.department, s.phone, s.email, s.salary, s.status]),
    ]);

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-5">
        {/* Page Header standard */}
        <PageHeader
          icon={Users}
          title="Staff Management"
          sub="Manage teachers, non-teaching staff, attendance, leaves, allocations and documents."
        >
          <button onClick={exportStaff} className="btn-outline">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button onClick={() => setAddModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        </PageHeader>

        {/* 5 Consistent Stat Cards matching theme */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat icon={Users} tone="purple" label="Total Staff" value={stats.totalStaff} />
          <Stat icon={GraduationCap} tone="green" label="Teachers" value={stats.teachersCount} />
          <Stat icon={Briefcase} tone="blue" label="Non-Teaching" value={stats.nonTeachingCount} />
          <Stat icon={CalendarCheck} tone="orange" label="Present Today" value={stats.presentToday} />
          <Stat icon={CalendarDays} tone="red" label="On Leave" value={stats.onLeave} />
        </div>

        {/* Main Card with Tabs */}
        <Card>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            tabs={[
              ['teachers', `All Teachers (${stats.teachersCount})`],
              ['non-teaching', `Non-Teaching Staff (${stats.nonTeachingCount})`],
              ['attendance', 'Staff Attendance'],
              ['leaves', 'Leave Management'],
              ['allocation', 'Teacher Allocation'],
              ['documents', 'Staff Documents'],
            ]}
          />

          {/* TAB 1 & 2: Teachers & Non-Teaching Table */}
          {(tab === 'teachers' || tab === 'non-teaching') && (
            <>
              <div className="my-4 flex flex-wrap gap-3">
                <div className="relative min-w-52 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="inp pl-9"
                    placeholder="Search by name, ID, subject, phone..."
                    value={f.q}
                    onChange={(e) => setFilter({ q: e.target.value })}
                  />
                </div>

                <select
                  className="inp w-auto"
                  value={f.department}
                  onChange={(e) => setFilter({ department: e.target.value })}
                >
                  <option value="all">All Departments</option>
                  <option value="Academics">Academics</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Library">Library</option>
                </select>

                <select
                  className="inp w-auto"
                  value={f.status}
                  onChange={(e) => setFilter({ status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <Table
                loading={isLoading}
                rows={staffList}
                activeId={sel?._id}
                onRowClick={(s) => setSel(s)}
                empty="No staff members found"
                cols={[
                  { h: '#', render: (_, i) => (f.page - 1) * limit + i + 1 },
                  {
                    h: 'Staff Name',
                    render: (s) => (
                      <Link
                        href={`/staff/${s._id}`}
                        className="flex items-center gap-2.5 group hover:opacity-90"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Avatar name={s.name} size={32} />
                        <div>
                          <div className="font-semibold text-ink group-hover:text-brand-600 transition-colors">{s.name}</div>
                          <div className="text-xs text-ink-400">ID: {s.staffId}</div>
                        </div>
                      </Link>
                    ),
                  },
                  {
                    h: 'Role',
                    render: (s) => (
                      <Badge tone="purple">{s.role || s.type}</Badge>
                    ),
                  },
                  {
                    h: tab === 'teachers' ? 'Subject(s)' : 'Department',
                    render: (s) => (tab === 'teachers' ? s.subjects?.join(', ') || '–' : s.department),
                  },
                  {
                    h: tab === 'teachers' ? 'Class Assigned' : 'Designation',
                    render: (s) => (tab === 'teachers' ? s.assignedClasses?.join(', ') || '–' : s.role),
                  },
                  {
                    h: 'Phone',
                    render: (s) => (
                      <span className="flex items-center gap-1.5 text-xs text-ink-700">
                        <Phone className="h-3.5 w-3.5 text-brand-500" />
                        {s.phone || '–'}
                      </span>
                    ),
                  },
                  {
                    h: 'Status',
                    render: (s) => (
                      <StatusBadge s={s.status?.toLowerCase().replace(' ', '') || 'active'} />
                    ),
                  },
                  {
                    h: 'Actions',
                    render: (s) => (
                      <div className="flex items-center gap-2 text-ink-400" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/staff/${s._id}`} title="View Full Profile" className="hover:text-brand-600">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    ),
                  },
                ]}
              />

              <Pager
                page={f.page}
                pages={data?.pages || 1}
                total={data?.total || 0}
                limit={limit}
                onPage={(p) => setF({ ...f, page: p })}
                label="staff members"
              />
            </>
          )}

          {/* TAB 3: Staff Attendance */}
          {tab === 'attendance' && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-ink">Daily Attendance Sheet</h3>
                  <p className="text-xs text-ink-400">Quickly mark staff presence or record check-in / check-out times</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-500">Date:</span>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="inp h-9 w-auto text-xs font-semibold"
                  />
                </div>
              </div>

              <Table
                rows={attendanceData?.data}
                empty="No attendance records found"
                cols={[
                  {
                    h: 'Staff Member',
                    render: ({ staff }) => (
                      <div className="flex items-center gap-2">
                        <Avatar name={staff.name} size={30} />
                        <div>
                          <div className="font-semibold text-ink">{staff.name}</div>
                          <div className="text-xs text-ink-400">{staff.staffId} • {staff.role}</div>
                        </div>
                      </div>
                    ),
                  },
                  { h: 'Type', render: ({ staff }) => <Badge tone="gray">{staff.type}</Badge> },
                  { h: 'Check In', render: ({ record }) => record?.checkIn || '09:00 AM' },
                  { h: 'Check Out', render: ({ record }) => record?.checkOut || '04:30 PM' },
                  {
                    h: 'Status',
                    render: ({ record }) => (
                      <StatusBadge s={record?.status?.toLowerCase().replace(' ', '') || 'present'} />
                    ),
                  },
                  {
                    h: 'Mark',
                    render: ({ staff }) => (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => api('/api/staff/attendance', 'POST', { staffId: staff._id, date: new Date().toISOString().slice(0, 10), status: 'Present', checkIn: '09:00 AM', checkOut: '04:30 PM' }).then(() => refreshAttendance())}
                          className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          P
                        </button>
                        <button
                          onClick={() => api('/api/staff/attendance', 'POST', { staffId: staff._id, date: new Date().toISOString().slice(0, 10), status: 'Absent' }).then(() => refreshAttendance())}
                          className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        >
                          A
                        </button>
                        <button
                          onClick={() => api('/api/staff/attendance', 'POST', { staffId: staff._id, date: new Date().toISOString().slice(0, 10), status: 'Half Day' }).then(() => refreshAttendance())}
                          className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          HD
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 4: Leave Management */}
          {tab === 'leaves' && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-ink">Leave Applications &amp; Approvals</h3>
                  <p className="text-xs text-ink-400">Casual, sick, paid and unpaid leaves for staff</p>
                </div>
                <button onClick={() => setLeaveModal(true)} className="btn-primary h-9 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Apply Leave
                </button>
              </div>

              <Table
                rows={leavesData}
                empty="No leave applications yet"
                cols={[
                  {
                    h: 'Staff Member',
                    render: (l) => (
                      <div className="font-semibold text-ink">
                        {l.staff?.name || 'Staff Member'}
                        <div className="text-xs text-ink-400">{l.staff?.role}</div>
                      </div>
                    ),
                  },
                  { h: 'Leave Type', render: (l) => <Badge tone="purple">{l.leaveType}</Badge> },
                  { h: 'Duration', render: (l) => `${l.startDate} to ${l.endDate}` },
                  { h: 'Days', render: (l) => <b>{l.days} day(s)</b> },
                  { h: 'Reason', render: (l) => <span className="text-ink-500">{l.reason}</span> },
                  {
                    h: 'Status',
                    render: (l) => (
                      <StatusBadge s={l.status === 'Approved' ? 'active' : l.status === 'Rejected' ? 'inactive' : 'pending'} />
                    ),
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 5: Teacher Allocation */}
          {tab === 'allocation' && (
            <div className="mt-4 space-y-4">
              <div className="border-b border-ink/[.06] pb-3">
                <h3 className="text-sm font-bold text-ink">Subject &amp; Class Teacher Matrix</h3>
                <p className="text-xs text-ink-400">View teacher assignments by subjects and assigned classes</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staffList.filter((s) => s.type === 'Teaching').map((t) => (
                  <div key={t._id} className="card p-4 transition hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-600">{t.staffId}</span>
                      <StatusBadge s={t.status?.toLowerCase().replace(' ', '') || 'active'} />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar name={t.name} size={40} />
                      <div>
                        <h4 className="font-bold text-ink">{t.name}</h4>
                        <div className="text-xs text-ink-400">{t.role} • {t.subjects?.join(', ') || 'General'}</div>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-ink/[.06] pt-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Classes Assigned</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {t.assignedClasses?.length ? (
                          t.assignedClasses.map((c) => (
                            <Badge key={c} tone="purple">{c}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-ink-400 italic">No classes assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Staff Documents */}
          {tab === 'documents' && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-ink">Staff Document Vault</h3>
                  <p className="text-xs text-ink-400">Identity proofs, academic certificates, agreements and records</p>
                </div>
                <button className="btn-outline h-9 text-xs">
                  <Upload className="h-3.5 w-3.5" />
                  Upload Document
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {['ID Proof (Aadhar/PAN)', 'Educational Degrees', 'Appointment Letters', 'Police Verification'].map((doc) => (
                  <div key={doc} className="card p-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-ink">{doc}</h4>
                    <p className="mt-1 text-xs text-ink-400">Verified digital records on file</p>
                    <button className="btn-outline mt-4 w-full h-8 text-xs">View Files</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right Drawer Profile Inspection (Identical to Students & Teachers page) */}
      {sel && (
        <>
          <div className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] 2xl:hidden" onClick={() => setSel(null)} />
          <aside className="fixed inset-y-0 right-0 z-40 w-[400px] max-w-full space-y-4 overflow-y-auto bg-surface p-4 shadow-pop 2xl:sticky 2xl:inset-auto 2xl:top-24 2xl:z-auto 2xl:w-auto 2xl:self-start 2xl:overflow-visible 2xl:bg-transparent 2xl:p-0 2xl:shadow-none">
            <Card title="Staff Member Profile" action={<button onClick={() => setSel(null)}><X className="h-5 w-5 text-ink-400" /></button>}>
              <div className="flex gap-4">
                <Avatar name={sel.name} size={72} />
                <div className="min-w-0 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-bold text-ink">{sel.name}</h3>
                    <StatusBadge s={sel.status?.toLowerCase().replace(' ', '') || 'active'} />
                  </div>
                  <div className="text-xs text-ink-400">ID: {sel.staffId}</div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-600">
                    <Phone className="h-3.5 w-3.5 text-brand-500" />
                    {sel.phone || '–'}
                  </div>
                  {sel.email && (
                    <div className="flex items-center gap-1.5 truncate text-xs text-ink-600">
                      <Mail className="h-3.5 w-3.5 text-brand-500" />
                      {sel.email}
                    </div>
                  )}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                {[
                  ['Staff Type', sel.type],
                  ['Role', sel.role],
                  ['Department', sel.department],
                  ['Subjects', sel.subjects?.join(', ') || '–'],
                  ['Classes', sel.assignedClasses?.join(', ') || '–'],
                  ['Monthly Salary', inr(sel.salary)],
                  ['Joining Date', fmtDate(sel.joiningDate)],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-xs text-ink-400">{k}</dt>
                    <dd className="font-semibold text-xs text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 pt-3 border-t border-ink/[.06]">
                <Link
                  href={`/staff/${sel._id}`}
                  className="btn-outline w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <Eye className="h-3.5 w-3.5" /> View Full Profile Page
                </Link>
              </div>
            </Card>

            <Card title="Compensation">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-ink-400">Fixed Monthly</div>
                  <div className="text-xl font-extrabold text-ink">{inr(sel.salary)}</div>
                </div>
                <Badge tone="green">Active Payroll</Badge>
              </div>
            </Card>
          </aside>
        </>
      )}

      {/* Add Staff Modal */}
      {addModal && (
        <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Staff Member" width="max-w-xl">
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Neha Sharma"
                  className="inp"
                />
              </Field>
              <Field label="Staff Type" required>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="inp"
                >
                  <option value="Teaching">Teaching</option>
                  <option value="Non-Teaching">Non-Teaching</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role / Designation" required>
                <input
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Teacher, Accountant, etc."
                  className="inp"
                />
              </Field>
              <Field label="Department" required>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="inp"
                >
                  <option value="Academics">Academics</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Library">Library</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone / WhatsApp" required>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="inp"
                />
              </Field>
              <Field label="Email Address">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@institute.com"
                  className="inp"
                />
              </Field>
            </div>

            {form.type === 'Teaching' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Subject(s) (comma separated)">
                  <input
                    value={form.subjects}
                    onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                    placeholder="Mathematics, Physics"
                    className="inp"
                  />
                </Field>
                <Field label="Assigned Classes (comma separated)">
                  <input
                    value={form.assignedClasses}
                    onChange={(e) => setForm({ ...form, assignedClasses: e.target.value })}
                    placeholder="Class 8 A, Class 9 B"
                    className="inp"
                  />
                </Field>
              </div>
            )}

            <Field label="Monthly Salary (₹)">
              <input
                type="number"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="35000"
                className="inp"
              />
            </Field>

            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={() => setAddModal(false)} className="btn border border-ink/10">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Staff
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Leave Modal */}
      {leaveModal && (
        <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title="Apply Leave for Staff" width="max-w-lg">
          <form onSubmit={handleApplyLeave} className="space-y-4">
            <Field label="Select Staff Member" required>
              <select
                required
                value={leaveForm.staff}
                onChange={(e) => setLeaveForm({ ...leaveForm, staff: e.target.value })}
                className="inp"
              >
                <option value="">Choose staff member...</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.staffId} - {s.role})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Leave Type">
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="inp"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </Field>
              <Field label="Number of Days">
                <input
                  type="number"
                  min="1"
                  value={leaveForm.days}
                  onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
                  className="inp"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start Date" required>
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="inp"
                />
              </Field>
              <Field label="End Date" required>
                <input
                  type="date"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="inp"
                />
              </Field>
            </div>

            <Field label="Reason" required>
              <textarea
                required
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Reason for leave..."
                className="inp h-20"
              />
            </Field>

            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={() => setLeaveModal(false)} className="btn border border-ink/10">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Approve &amp; Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
