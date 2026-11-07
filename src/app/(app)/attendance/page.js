'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Users,
  BarChart3,
  Clock,
  FileText,
  Save,
  Download,
  Layers,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import { useApi, api, run, todayKey, downloadCSV } from '@/lib/client';
import { Avatar, Badge, StatusBadge, Spinner, Card } from '@/components/ui';

const TABS = [
  { id: 'students', label: 'Student Attendance', sub: 'Mark Daily Attendance', icon: Users },
  { id: 'staff', label: 'Staff Attendance', sub: 'Track Staff Attendance', icon: Users },
  { id: 'reports', label: 'Attendance Reports', sub: 'View & Export Reports', icon: BarChart3 },
  { id: 'late', label: 'Late Arrivals', sub: 'Track Late Comers', icon: Clock },
  { id: 'leaves', label: 'Leave Applications', sub: 'Manage Leave Requests', icon: FileText },
];

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'students';
  const [tab, setTab] = useState(currentTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setTab(t);
  }, [searchParams]);

  const handleTabChange = (t) => {
    setTab(t);
    router.replace(`/attendance?tab=${t}`, { scroll: false });
  };

  const [date, setDate] = useState(todayKey());
  const [selectedClass, setSelectedClass] = useState('Class 8');
  const [section, setSection] = useState('A');
  const [mode, setMode] = useState('Manual');
  const [busy, setBusy] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Fetch student attendance overview
  const { data, isLoading, mutate } = useApi(
    `/api/attendance/overview?class=${encodeURIComponent(selectedClass)}&section=${section}&date=${date}`
  );

  // Fetch staff attendance & leaves for sub-tabs
  const { data: staffAttData, mutate: mutateStaffAtt } = useApi(`/api/staff/attendance?date=${date}`);
  const { data: staffLeavesData } = useApi('/api/staff/leaves');

  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (data?.students) {
      setStudents(data.students);
    }
  }, [data]);

  const stats = data?.stats || {
    total: 32,
    present: 28,
    absent: 2,
    late: 1,
    halfDay: 1,
    rate: '87.5%',
    attendanceRate: 87.5,
  };

  const setStatus = (id, status) => {
    setStudents((prev) => prev.map((s) => (s._id === id ? { ...s, status } : s)));
  };

  const handleSaveAttendance = async () => {
    if (!data?.batchId) return;
    setBusy(true);
    const records = students.map((s) => ({ student: s._id, status: s.status }));
    const ok = await run(
      () =>
        api('/api/attendance/overview', 'POST', {
          batchId: data.batchId,
          date,
          records,
        }),
      'Attendance saved successfully'
    );
    setBusy(false);
    if (ok) mutate();
  };

  const handleBulkAction = (status) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const exportAttendanceCSV = () => {
    const rows = [
      ['Roll No', 'Student Name', 'Class', 'Section', 'Date', 'Status'],
      ...students.map((s) => [s.roll, s.name, selectedClass, section, date, s.status]),
    ];
    downloadCSV(`attendance_${selectedClass}_${section}_${date}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/dashboard" className="hover:text-royal">Home</Link>
        <span>›</span>
        <span className="text-slate-700">Attendance</span>
        <span>›</span>
        <span className="font-semibold text-royal">
          {TABS.find((t) => t.id === tab)?.label}
        </span>
      </div>

      {/* Header title */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal/10 text-royal">
          <CalendarCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          <p className="text-sm text-slate-500">
            Mark, track and manage attendance records and daily activity
          </p>
        </div>
      </div>

      {/* Top 5 Sub-Modules / Tab Cards (Exact match to screenshot) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-start gap-3 rounded-2xl p-4 text-left transition-all ${
                active
                  ? 'border-2 border-royal bg-white shadow-md shadow-blue-500/10'
                  : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  active ? 'bg-royal text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-bold truncate ${active ? 'text-royal' : 'text-slate-900'}`}>
                  {t.label}
                </div>
                <div className="mt-0.5 text-xs text-slate-400 truncate">{t.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Student Attendance (Exact match to screenshot) */}
      {tab === 'students' && (
        <div className="space-y-5">
          {/* Controls Bar: Date, Class, Section, Attendance Mode + Action Buttons */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-royal"
                  />
                </div>
              </div>

              {/* Class */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none focus:border-royal"
                >
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-royal"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              {/* Attendance Mode */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">Attendance Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none focus:border-royal"
                >
                  <option value="Manual">Manual</option>
                  <option value="Biometric">Biometric</option>
                  <option value="RFID Card">RFID Card</option>
                </select>
              </div>
            </div>

            {/* Action buttons on right */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => handleBulkAction('present')}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Layers className="h-4 w-4 text-royal" />
                Bulk Action
              </button>

              <button
                type="button"
                onClick={exportAttendanceCSV}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4 text-slate-500" />
                Export
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={handleSaveAttendance}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-royal px-5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-royal-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                {busy ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </div>

          {/* Main Grid: Left Attendance Table + Right Attendance Summary Cards */}
          <div className="grid gap-5 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
            {/* Left: Radio Matrix Student Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="w-12 px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedAll}
                          onChange={(e) => {
                            setSelectedAll(e.target.checked);
                            setSelectedRows(e.target.checked ? students.map((s) => s._id) : []);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-royal focus:ring-royal/20"
                        />
                      </th>
                      <th className="px-4 py-3.5">Roll No.</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">P</span>
                          Present
                        </span>
                      </th>
                      <th className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white">A</span>
                          Absent
                        </span>
                      </th>
                      <th className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">L</span>
                          Late
                        </span>
                      </th>
                      <th className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">H</span>
                          Half Day
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <Spinner />
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                          No students enrolled in {selectedClass} - Section {section}.
                        </td>
                      </tr>
                    ) : (
                      students.map((s) => (
                        <tr key={s._id} className="transition hover:bg-slate-50/70">
                          <td className="px-4 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(s._id)}
                              onChange={() =>
                                setSelectedRows((prev) =>
                                  prev.includes(s._id) ? prev.filter((i) => i !== s._id) : [...prev, s._id]
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-royal focus:ring-royal/20"
                            />
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">{s.roll}</td>
                          <td className="px-4 py-3.5 font-bold text-navy">
                            <div className="flex items-center gap-3">
                              <Avatar name={s.name} size={32} src={s.photo?.url} />
                              <span>{s.name}</span>
                            </div>
                          </td>

                          {/* Present Radio */}
                          <td className="px-4 py-3.5 text-center">
                            <label className="cursor-pointer inline-flex items-center justify-center">
                              <input
                                type="radio"
                                name={`status_${s._id}`}
                                checked={s.status === 'present'}
                                onChange={() => setStatus(s._id, 'present')}
                                className="h-5 w-5 cursor-pointer text-emerald-600 accent-emerald-600"
                              />
                            </label>
                          </td>

                          {/* Absent Radio */}
                          <td className="px-4 py-3.5 text-center">
                            <label className="cursor-pointer inline-flex items-center justify-center">
                              <input
                                type="radio"
                                name={`status_${s._id}`}
                                checked={s.status === 'absent'}
                                onChange={() => setStatus(s._id, 'absent')}
                                className="h-5 w-5 cursor-pointer text-rose-600 accent-rose-600"
                              />
                            </label>
                          </td>

                          {/* Late Radio */}
                          <td className="px-4 py-3.5 text-center">
                            <label className="cursor-pointer inline-flex items-center justify-center">
                              <input
                                type="radio"
                                name={`status_${s._id}`}
                                checked={s.status === 'late'}
                                onChange={() => setStatus(s._id, 'late')}
                                className="h-5 w-5 cursor-pointer text-amber-500 accent-amber-500"
                              />
                            </label>
                          </td>

                          {/* Half Day Radio */}
                          <td className="px-4 py-3.5 text-center">
                            <label className="cursor-pointer inline-flex items-center justify-center">
                              <input
                                type="radio"
                                name={`status_${s._id}`}
                                checked={s.status === 'halfday'}
                                onChange={() => setStatus(s._id, 'halfday')}
                                className="h-5 w-5 cursor-pointer text-purple-600 accent-purple-600"
                              />
                            </label>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Summary Donut & Today's Insights (Exact matching cards) */}
            <div className="space-y-4">
              {/* Card 1: Attendance Summary with Donut */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-navy">Attendance Summary</h3>
                  <span className="text-xs font-semibold text-slate-500">{selectedClass} - Section {section}</span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  {/* Donut Chart */}
                  <div
                    className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(
                        #10b981 0% ${(stats.present / (stats.total || 1)) * 100}%,
                        #ef4444 ${(stats.present / (stats.total || 1)) * 100}% ${((stats.present + stats.absent) / (stats.total || 1)) * 100}%,
                        #f59e0b ${((stats.present + stats.absent) / (stats.total || 1)) * 100}% ${((stats.present + stats.absent + stats.late) / (stats.total || 1)) * 100}%,
                        #8b5cf6 ${((stats.present + stats.absent + stats.late) / (stats.total || 1)) * 100}% 100%
                      )`,
                    }}
                  >
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                      <span className="text-2xl font-black text-navy">{stats.total}</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Students</span>
                    </div>
                  </div>

                  {/* Summary Counts with indicators */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Present</span>
                      <b className="ml-auto text-slate-900">{stats.present} ({Math.round((stats.present / (stats.total || 1)) * 100)}%)</b>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="text-slate-600">Absent</span>
                      <b className="ml-auto text-slate-900">{stats.absent} ({Math.round((stats.absent / (stats.total || 1)) * 100)}%)</b>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Late</span>
                      <b className="ml-auto text-slate-900">{stats.late} ({Math.round((stats.late / (stats.total || 1)) * 100)}%)</b>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                      <span className="text-slate-600">Half Day</span>
                      <b className="ml-auto text-slate-900">{stats.halfDay} ({Math.round((stats.halfDay / (stats.total || 1)) * 100)}%)</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Today's Insights */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 text-navy font-bold text-sm">
                  <FileText className="h-4 w-4 text-royal" />
                  Today’s Insights
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Users className="h-4 w-4 text-royal" />
                      Attendance Rate
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                      {stats.rate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Late Arrivals
                    </span>
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                      {stats.late}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-rose-500" />
                      Leave Applied
                    </span>
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700">
                      2
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Staff Attendance */}
      {tab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-navy">Daily Staff Attendance</h2>
              <p className="text-xs text-slate-500">Record check-in, check-out and presence for teachers and staff</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Staff</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Check In</th>
                  <th className="px-5 py-3.5">Check Out</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Quick Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffAttData?.data?.map(({ staff, record }) => (
                  <tr key={staff._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-bold text-navy">
                      <div>{staff.name}</div>
                      <div className="text-xs font-normal text-slate-400">{staff.staffId}</div>
                    </td>
                    <td className="px-5 py-3.5">{staff.role}</td>
                    <td className="px-5 py-3.5 text-slate-600">{record?.checkIn || '09:00 AM'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{record?.checkOut || '04:30 PM'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        record?.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                        record?.status === 'Absent' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {record?.status || 'Present'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => api('/api/staff/attendance', 'POST', { staffId: staff._id, date, status: 'Present', checkIn: '09:00 AM', checkOut: '04:30 PM' }).then(() => mutateStaffAtt())}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          P
                        </button>
                        <button
                          onClick={() => api('/api/staff/attendance', 'POST', { staffId: staff._id, date, status: 'Absent' }).then(() => mutateStaffAtt())}
                          className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        >
                          A
                        </button>
                        <button
                          onClick={() => api('/api/staff/attendance', 'POST', { staffId: staff._id, date, status: 'Half Day' }).then(() => mutateStaffAtt())}
                          className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          HD
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Attendance Reports */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-navy">Monthly Attendance Analytics &amp; Reports</h3>
              <p className="text-xs text-slate-500">Export student and staff monthly attendance matrices</p>
            </div>
            <button
              onClick={exportAttendanceCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-royal px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-royal-700"
            >
              <Download className="h-4 w-4" />
              Download Monthly Report
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Average Attendance Rate</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">92.4%</div>
              <div className="mt-1 text-xs text-slate-500">+2.1% from last month</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Total Working Days</div>
              <div className="mt-2 text-3xl font-extrabold text-navy">24 Days</div>
              <div className="mt-1 text-xs text-slate-500">Current Academic Month</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase">Defaulters (&lt; 75%)</div>
              <div className="mt-2 text-3xl font-extrabold text-rose-600">4 Students</div>
              <div className="mt-1 text-xs text-slate-500">Requires parent notification</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Late Arrivals */}
      {tab === 'late' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-navy">Late Comers Tracker</h3>
            <p className="text-xs text-slate-500">Students and staff arriving after official assembly time</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Roll No</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Class &amp; Section</th>
                  <th className="px-5 py-3.5">Arrival Time</th>
                  <th className="px-5 py-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.filter((s) => s.status === 'late').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                      No late arrivals recorded for today.
                    </td>
                  </tr>
                ) : (
                  students
                    .filter((s) => s.status === 'late')
                    .map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3.5 font-bold">{s.roll}</td>
                        <td className="px-5 py-3.5 font-bold text-navy">{s.name}</td>
                        <td className="px-5 py-3.5">{selectedClass} - Section {section}</td>
                        <td className="px-5 py-3.5 text-amber-600 font-semibold">08:25 AM</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">Traffic delay</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Leave Applications */}
      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-navy">Leave Requests &amp; Management</h3>
            <p className="text-xs text-slate-500">Student &amp; staff submitted leaves with approval workflow</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Applicant</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffLeavesData?.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-bold text-navy">
                      {l.staff?.name || 'Staff Member'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{l.staff?.role || 'Staff'}</td>
                    <td className="px-5 py-3.5 font-medium">{l.leaveType}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{l.startDate} to {l.endDate}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{l.reason}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                        l.status === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
