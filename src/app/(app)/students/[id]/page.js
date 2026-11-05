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
  MapPin,
  Calendar,
  BookOpen,
  Users,
  CreditCard,
  MessageCircle,
  FileText,
  User,
  Heart,
  Droplet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Receipt,
  Download
} from 'lucide-react';
import { useApi, api, run, fmtDate } from '@/lib/client';
import { StatusBadge, Badge, Avatar, Card, Spinner, Modal, inr } from '@/components/ui';

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); // overview, fees, attendance, documents
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');

  const { data: student, isLoading: loadingStudent, mutate: mutateStudent } = useApi(`/api/students/${id}`);
  const { data: summary, isLoading: loadingSummary, mutate: mutateSummary } = useApi(`/api/students/${id}/summary`);

  if (loadingStudent || !student) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) return;
    const ok = await run(() => api(`/api/students/${id}`, 'DELETE'), 'Student deleted successfully');
    if (ok) router.push('/students');
  };

  const handleCollectFee = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;
    const res = await run(
      () => api('/api/fees/collect', 'POST', { student: id, amount: Number(payAmount), mode: payMode }),
      'Fee payment collected successfully'
    );
    if (res) {
      setPayModal(false);
      setPayAmount('');
      mutateSummary();
    }
  };

  const handleSendWhatsApp = () => {
    run(
      () => api('/api/whatsapp/send', 'POST', { scope: 'student', student: id, template: 'fee_due' }),
      'Fee reminder sent on WhatsApp'
    );
  };

  const fees = summary?.fees || { total: 0, paid: 0, due: 0, records: [] };
  const att = summary?.attendance || { present: 0, absent: 0, late: 0, total: 0, percent: 0 };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-subtle transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-ink">{student.name}</h1>
              <StatusBadge s={student.status} />
            </div>
            <p className="text-xs font-semibold text-slate-500">Student ID: {student.studentId || '–'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleSendWhatsApp} className="btn-green">
            <MessageCircle className="h-4 w-4" />
            Send WhatsApp
          </button>
          {fees.due > 0 && (
            <button
              onClick={() => {
                setPayAmount(String(fees.due));
                setPayModal(true);
              }}
              className="btn-primary"
            >
              <CreditCard className="h-4 w-4" />
              Collect Fees
            </button>
          )}
          <Link href={`/students/${id}/edit`} className="btn-outline">
            <Pencil className="h-4 w-4 text-brand-600" />
            Edit Profile
          </Link>
          <button onClick={handleDelete} className="btn-outline text-rose-600 hover:bg-rose-50 hover:border-rose-300">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative">
              <Avatar src={student.photo?.url} name={student.name} size={100} />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-extrabold text-ink">{student.name}</h2>
                <Badge tone="purple">{student.course?.name || 'No Course'}</Badge>
                {student.batch?.name && <Badge tone="blue">{student.batch.name}</Badge>}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-sm text-slate-600">
                {(student.mobile || student.parentMobile) && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="h-4 w-4 text-brand-600" />
                    {student.mobile || student.parentMobile}
                  </span>
                )}
                {student.email && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Mail className="h-4 w-4 text-brand-600" />
                    {student.email}
                  </span>
                )}
                {student.address && (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {student.address}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-500">
                <span>Admission: <b className="text-slate-700">{fmtDate(student.admissionDate)}</b></span>
                <span>•</span>
                <span>Parent: <b className="text-slate-700">{student.parentName}</b> ({student.parentRelation || 'Guardian'})</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500">Fees Due</div>
              <div className={`mt-1 text-xl font-black ${fees.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {inr(fees.due)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Paid: {inr(fees.paid)}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500">Attendance</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-ink">{att.percent}%</span>
                <span className="text-xs font-medium text-emerald-600">Present</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                {att.present} of {att.total} days
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex border-b border-slate-100 gap-6 text-sm font-semibold">
          {[
            { id: 'overview', label: 'Full Overview' },
            { id: 'fees', label: `Fee Records (${fees.records?.length || 0})` },
            { id: 'attendance', label: 'Attendance' },
            { id: 'documents', label: `Documents (${student.documents?.length || 0})` },
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
          {/* Personal Information */}
          <Card title="Personal Information">
            <div className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-ink">{student.name}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Student ID</span>
                <span className="font-semibold text-brand-600">{student.studentId || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Date of Birth</span>
                <span className="font-semibold text-ink">{fmtDate(student.dob) || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Gender</span>
                <span className="font-semibold text-ink">{student.gender || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Blood Group</span>
                <span className="font-semibold text-ink">{student.bloodGroup || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Student Mobile</span>
                <span className="font-semibold text-ink">{student.mobile || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-ink">{student.email || '–'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Residential Address</span>
                <span className="font-semibold text-ink max-w-[60%] text-right">{student.address || '–'}</span>
              </div>
            </div>
          </Card>

          {/* Academic & Parent Info */}
          <div className="space-y-6">
            <Card title="Academic & Enrollment Details">
              <div className="divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Enrolled Course</span>
                  <span className="font-semibold text-ink">{student.course?.name || '–'}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Allocated Batch</span>
                  <span className="font-semibold text-ink">{student.batch?.name || '–'}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Batch Timing</span>
                  <span className="font-semibold text-ink">
                    {student.batch?.startTime && student.batch?.endTime
                      ? `${student.batch.startTime} - ${student.batch.endTime}`
                      : '–'}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Admission Date</span>
                  <span className="font-semibold text-ink">{fmtDate(student.admissionDate)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Account Status</span>
                  <StatusBadge s={student.status} />
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Fee Plan</span>
                  <span className="font-semibold capitalize text-ink">{student.feePlan?.replace('_', ' ') || 'Monthly'}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Plan Amount</span>
                  <span className="font-semibold text-emerald-600">{inr(student.feeAmount)}</span>
                </div>
              </div>
            </Card>

            <Card title="Parent / Guardian Details">
              <div className="divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Parent / Guardian Name</span>
                  <span className="font-semibold text-ink">{student.parentName}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Relationship</span>
                  <span className="font-semibold text-ink">{student.parentRelation || 'Guardian'}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Primary Phone (WhatsApp)</span>
                  <span className="font-semibold text-brand-600 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {student.parentMobile}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Fees & Payment History */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed Fees</div>
              <div className="mt-2 text-2xl font-black text-ink">{inr(fees.total)}</div>
              <div className="mt-1 text-xs text-slate-400">Total fee commitments</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Paid Fees</div>
              <div className="mt-2 text-2xl font-black text-emerald-700">{inr(fees.paid)}</div>
              <div className="mt-1 text-xs text-emerald-600">Successfully received</div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-subtle">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Outstanding Due</div>
              <div className="mt-2 text-2xl font-black text-rose-600">{inr(fees.due)}</div>
              <div className="mt-1 text-xs text-rose-600">Remaining pending dues</div>
            </div>
          </div>

          <Card
            title="Fee Invoices & Records"
            action={
              fees.due > 0 && (
                <button
                  onClick={() => {
                    setPayAmount(String(fees.due));
                    setPayModal(true);
                  }}
                  className="btn-primary text-xs"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Collect Payment
                </button>
              )
            }
          >
            {fees.records?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Billing Month</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fees.records.map((r) => {
                      const bal = r.amount - r.paid;
                      return (
                        <tr key={r._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-ink">{r.month || '–'}</td>
                          <td className="py-3 px-4 text-slate-600">{fmtDate(r.dueDate)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{inr(r.amount)}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">{inr(r.paid)}</td>
                          <td className="py-3 px-4 font-semibold text-rose-600">{inr(bal)}</td>
                          <td className="py-3 px-4">
                            <StatusBadge s={r.status} />
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {r.payments?.length > 0 ? (
                              <div className="space-y-1">
                                {r.payments.map((p, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 font-medium">
                                    <span className="text-emerald-700">{inr(p.amount)}</span>
                                    <span className="text-slate-400">({p.mode})</span>
                                    {p.receiptNo && <span className="text-[10px] text-slate-400 font-mono">#{p.receiptNo}</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="italic text-slate-400">No payments yet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                No fee records found for this student.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Attendance Summary */}
      {activeTab === 'attendance' && (
        <div className="grid gap-6 md:grid-cols-[340px_1fr]">
          <Card title="Attendance Performance (This Month)">
            <div className="flex flex-col items-center justify-center p-4">
              <div
                className="flex h-36 w-36 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#10b981 ${att.percent * 3.6}deg, #e5e7eb 0)`,
                }}
              >
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-subtle">
                  <span className="text-2xl font-black text-ink">{att.percent}%</span>
                  <span className="text-[11px] font-semibold text-slate-500">Present</span>
                </div>
              </div>

              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Present Days
                  </div>
                  <span className="font-bold text-emerald-900">{att.present} days</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-amber-50/60 p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Late Days
                  </div>
                  <span className="font-bold text-amber-900">{att.late} days</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-rose-50/60 p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-rose-800">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    Absent Days
                  </div>
                  <span className="font-bold text-rose-900">{att.absent} days</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Batch Attendance Insights">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 p-4">
                <h4 className="font-bold text-ink">Batch Details</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Student is enrolled in <b className="text-ink">{student.batch?.name || 'Default Batch'}</b> for course{' '}
                  <b className="text-ink">{student.course?.name}</b>.
                </p>
                <div className="mt-3 flex gap-3 text-xs">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    Total Tracked Days: {att.total}
                  </span>
                  <span className="rounded-lg bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                    Attendance Rate: {att.percent}%
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-600">
                <p className="font-medium">
                  Attendance is recorded per session from the{' '}
                  <Link href="/attendance" className="font-bold text-brand-600 hover:underline">
                    Attendance
                  </Link>{' '}
                  module. If daily alerts are turned on, parents receive instant notifications when the student is marked absent or late.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Documents */}
      {activeTab === 'documents' && (
        <Card
          title="Attached Documents"
          action={
            <Link href={`/students/${id}/edit`} className="btn-outline text-xs">
              <PlusCircle className="h-3.5 w-3.5" />
              Upload / Manage Documents
            </Link>
          }
        >
          {student.documents?.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {student.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 transition hover:border-brand-300 hover:shadow-subtle"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-ink">{doc.name || 'Document'}</div>
                      <div className="text-[11px] text-slate-500">Stored file</div>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
                    title="View Document"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              No documents uploaded for this student yet.
              <div className="mt-3">
                <Link href={`/students/${id}/edit`} className="btn-primary text-xs">
                  Upload Documents
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Fee Payment Collection Modal */}
      {payModal && (
        <Modal open={payModal} onClose={() => setPayModal(false)} title={`Collect Fees – ${student.name}`}>
          <form onSubmit={handleCollectFee} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Total Due:</span>
                <span className="font-bold text-rose-600">{inr(fees.due)}</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Amount (₹)</label>
              <input
                type="number"
                min="1"
                max={fees.due}
                required
                className="inp"
                placeholder="Enter amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Payment Mode</label>
              <select className="inp" value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                <option value="UPI">UPI / QR Code</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPayModal(false)} className="btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Confirm & Record Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
