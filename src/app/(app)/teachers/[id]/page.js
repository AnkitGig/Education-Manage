'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  IndianRupee,
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Upload,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useApi, api, run, fmtDate, thisMonth, upload } from '@/lib/client';
import { StatusBadge, Badge, Avatar, Card, Spinner, Modal, Field, inr } from '@/components/ui';

const SUBJ_TONE = ['purple', 'blue', 'orange', 'green'];

function TeacherEditModal({ open, onClose, initial, onSaved }) {
  const [f, setF] = useState(null);
  const v =
    f ||
    (initial
      ? {
          ...initial,
          subjectsText: initial.subjects?.join(', ') || '',
          joiningDate: initial.joiningDate?.slice(0, 10) || '',
        }
      : {});
  const set = (k) => (e) => setF({ ...v, [k]: e.target.value });

  const save = async () => {
    const body = {
      ...v,
      subjects: (v.subjectsText || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      salary: +v.salary || 0,
    };
    delete body.subjectsText;
    if (!body.joiningDate) delete body.joiningDate;
    const r = await run(() => api(`/api/teachers/${initial._id}`, 'PUT', body), 'Teacher updated successfully');
    if (r) {
      setF(null);
      onSaved();
      onClose();
    }
  };

  const photo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = await run(() => upload(file, 'teachers'));
    if (r) setF({ ...v, photo: { url: r.url, publicId: r.publicId } });
  };

  return (
    <Modal open={open} onClose={() => { setF(null); onClose(); }} title="Edit Teacher" width="max-w-xl">
      <div className="mb-4 flex items-center gap-4">
        <Avatar src={v.photo?.url} name={v.name || 'T'} size={64} />
        <label className="btn-outline cursor-pointer">
          <Upload className="h-4 w-4" />
          Change Photo
          <input hidden type="file" accept="image/*" onChange={photo} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <input className="inp" value={v.name || ''} onChange={set('name')} />
        </Field>
        <Field label="Phone">
          <input className="inp" value={v.phone || ''} onChange={set('phone')} />
        </Field>
        <Field label="Email">
          <input type="email" className="inp" value={v.email || ''} onChange={set('email')} />
        </Field>
        <Field label="Subjects (comma separated)">
          <input className="inp" value={v.subjectsText || ''} onChange={set('subjectsText')} placeholder="Maths, Physics" />
        </Field>
        <Field label="Monthly salary (₹)">
          <input type="number" className="inp" value={v.salary || ''} onChange={set('salary')} />
        </Field>
        <Field label="Role">
          <select className="inp" value={v.role || 'Teacher'} onChange={set('role')}>
            <option>Teacher</option>
            <option>Senior Teacher</option>
          </select>
        </Field>
        <Field label="Payment Type">
          <select className="inp" value={v.paymentType || 'Fixed Monthly'} onChange={set('paymentType')}>
            <option>Fixed Monthly</option>
            <option>Per Batch</option>
            <option>Hourly</option>
          </select>
        </Field>
        <Field label="Joining date">
          <input type="date" className="inp" value={v.joiningDate || ''} onChange={set('joiningDate')} />
        </Field>
        <Field label="Status" className="sm:col-span-2">
          <select className="inp" value={v.status || 'active'} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="onleave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn border" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={save}>
          Save Changes
        </button>
      </div>
    </Modal>
  );
}

export default function TeacherDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); // overview, batches, salary
  const [editModal, setEditModal] = useState(false);

  const { data: teacher, isLoading: loadingTeacher, mutate: mutateTeacher } = useApi(`/api/teachers/${id}`);
  const { data: batchesRes, isLoading: loadingBatches } = useApi(`/api/batches?teacher=${id}`);
  const { data: salaryRes, isLoading: loadingSalary, mutate: mutateSalary } = useApi(`/api/salary?teacher=${id}`);

  if (loadingTeacher || !teacher) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${teacher.name}? This action cannot be undone.`)) return;
    const ok = await run(() => api(`/api/teachers/${id}`, 'DELETE'), 'Teacher deleted');
    if (ok) router.push('/teachers');
  };

  const handleMarkSalary = async () => {
    const curM = thisMonth();
    const r = await run(() => api('/api/salary/process', 'POST', { month: curM, payTeacher: id }), `Salary for ${curM} marked as paid`);
    if (r) mutateSalary();
  };

  const year = String(new Date().getFullYear());
  const salaryList = salaryRes?.data || [];
  const ytd = salaryList.filter((s) => s.month?.startsWith(year));
  const paidYtd = ytd.filter((s) => s.status === 'paid').reduce((a, s) => a + s.amount, 0);
  const pendingYtd = ytd.filter((s) => s.status !== 'paid').reduce((a, s) => a + s.amount, 0);
  const totalYtd = paidYtd + pendingYtd;

  const batches = batchesRes?.data || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teachers"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-subtle transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-ink">{teacher.name}</h1>
              <StatusBadge s={teacher.status} />
            </div>
            <p className="text-xs font-semibold text-slate-500">Teacher ID: {teacher.teacherId || '–'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {teacher.phone && (
            <a
              href={`https://wa.me/${teacher.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-green"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
          <button onClick={handleMarkSalary} className="btn-primary">
            <IndianRupee className="h-4 w-4" />
            Mark Current Salary
          </button>
          <button onClick={() => setEditModal(true)} className="btn-outline">
            <Pencil className="h-4 w-4 text-brand-600" />
            Edit Profile
          </button>
          <button onClick={handleDelete} className="btn-outline text-rose-600 hover:bg-rose-50 hover:border-rose-300">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar src={teacher.photo?.url} name={teacher.name} size={100} />
            <div className="text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-extrabold text-ink">{teacher.name}</h2>
                <Badge tone="purple">{teacher.role || 'Teacher'}</Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                {teacher.subjects?.map((s, i) => (
                  <Badge key={s} tone={SUBJ_TONE[i % 4]}>
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-sm text-slate-600 pt-1">
                {teacher.phone && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="h-4 w-4 text-brand-600" />
                    {teacher.phone}
                  </span>
                )}
                {teacher.email && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Mail className="h-4 w-4 text-brand-600" />
                    {teacher.email}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-500">
                <span>Joined: <b className="text-slate-700">{fmtDate(teacher.joiningDate)}</b></span>
                <span>•</span>
                <span>Payment: <b className="text-slate-700">{teacher.paymentType || 'Fixed Monthly'}</b></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500">Monthly Salary</div>
              <div className="mt-1 text-xl font-black text-ink">{inr(teacher.salary)}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{teacher.paymentType || 'Fixed Monthly'}</div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500">Assigned Batches</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-ink">{batches.length}</span>
                <span className="text-xs font-medium text-brand-600">Active</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">Teaching batches</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex border-b border-slate-100 gap-6 text-sm font-semibold">
          {[
            { id: 'overview', label: 'Full Overview' },
            { id: 'batches', label: `Assigned Batches (${batches.length})` },
            { id: 'salary', label: `Salary & Payouts (${salaryList.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 transition-colors border-b-2 font-bold ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Full Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Teacher Profile & Contact Details">
            <div className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-ink">{teacher.name}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Teacher ID</span>
                <span className="font-semibold text-brand-600">{teacher.teacherId || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Role / Designation</span>
                <span className="font-semibold text-ink">{teacher.role || 'Teacher'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Phone Number</span>
                <span className="font-semibold text-ink">{teacher.phone || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-ink">{teacher.email || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Joining Date</span>
                <span className="font-semibold text-ink">{fmtDate(teacher.joiningDate)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Current Status</span>
                <StatusBadge s={teacher.status} />
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Compensation & Employment">
              <div className="divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Agreed Salary</span>
                  <span className="font-semibold text-emerald-600">{inr(teacher.salary)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Payment Terms</span>
                  <span className="font-semibold text-ink">{teacher.paymentType || 'Fixed Monthly'}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Total YTD Paid ({year})</span>
                  <span className="font-semibold text-emerald-600">{inr(paidYtd)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Pending YTD ({year})</span>
                  <span className="font-semibold text-rose-600">{inr(pendingYtd)}</span>
                </div>
              </div>
            </Card>

            <Card title="Subjects & Specialization">
              <p className="text-xs text-slate-500 mb-3">Courses and subjects taught by this teacher:</p>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects?.length > 0 ? (
                  teacher.subjects.map((s, i) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-brand-600" />
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 italic">No specific subjects listed</span>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Batches */}
      {activeTab === 'batches' && (
        <Card title={`Batches Assigned (${batches.length})`}>
          {batches.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {batches.map((b) => (
                <div
                  key={b._id}
                  className="rounded-xl border border-slate-200 p-4 shadow-subtle hover:border-brand-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-ink">{b.name}</h4>
                      <p className="text-xs font-semibold text-brand-600">{b.course?.name || 'Course'}</p>
                    </div>
                    <Badge tone="purple">{b.room || 'Room'}</Badge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Timing: <b>{b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : 'TBD'}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Days: <b>{b.days?.join(', ') || 'Mon-Sat'}</b></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              No batches are currently assigned to this teacher.
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Salary Records */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">YTD Total ({year})</div>
              <div className="mt-2 text-2xl font-black text-ink">{inr(totalYtd)}</div>
              <div className="mt-1 text-xs text-slate-400">Total payable salary this year</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Paid Salary</div>
              <div className="mt-2 text-2xl font-black text-emerald-700">{inr(paidYtd)}</div>
              <div className="mt-1 text-xs text-emerald-600">Total disbursements cleared</div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Pending Amount</div>
              <div className="mt-2 text-2xl font-black text-rose-600">{inr(pendingYtd)}</div>
              <div className="mt-1 text-xs text-rose-600">Pending monthly cycles</div>
            </div>
          </div>

          <Card
            title="Monthly Salary History"
            action={
              <button onClick={handleMarkSalary} className="btn-primary text-xs">
                <IndianRupee className="h-3.5 w-3.5" />
                Process This Month
              </button>
            }
          >
            {salaryList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Payable Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Method / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryList.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-ink">{s.month}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-600">{inr(s.amount)}</td>
                        <td className="py-3 px-4">
                          <StatusBadge s={s.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-600">{fmtDate(s.paidAt || s.createdAt)}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{s.method || s.notes || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-500">
                No salary disbursement records found for this teacher yet.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editModal && (
        <TeacherEditModal
          open={editModal}
          initial={teacher}
          onClose={() => setEditModal(false)}
          onSaved={() => {
            mutateTeacher();
          }}
        />
      )}
    </div>
  );
}

