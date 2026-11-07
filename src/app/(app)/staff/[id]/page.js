'use client';
import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Building2,
  GraduationCap,
  Briefcase,
  Wallet,
  Clock,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Upload,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useApi, api, run, fmtDate, upload } from '@/lib/client';
import { StatusBadge, Badge, Avatar, Card, Spinner, Modal, Field, inr } from '@/components/ui';

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview'); // overview, attendance, leaves, documents
  const [editModal, setEditModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('ID Proof (Aadhar/PAN)');
  const fileInputRef = useRef(null);

  const { data: staff, isLoading, mutate } = useApi(`/api/staff/${id}`);

  if (isLoading || !staff) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${staff.name}? This action cannot be undone.`)) return;
    const ok = await run(() => api(`/api/staff/${id}`, 'DELETE'), 'Staff member deleted successfully');
    if (ok) router.push('/staff');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    const res = await run(() => upload(file, 'staff_docs'), 'File uploaded successfully');
    if (res?.url) {
      const existingDocs = staff.documents || [];
      const updatedDocs = [
        ...existingDocs,
        {
          title: docTitle,
          docType: docTitle,
          fileUrl: res.url,
          uploadedAt: new Date(),
        },
      ];

      await run(() => api(`/api/staff/${id}`, 'PUT', { documents: updatedDocs }));
      setUploadModal(false);
      mutate();
    }
    setUploading(false);
  };

  const att = staff.attendanceStats || { present: 0, absent: 0, halfDay: 0, total: 0, percent: 95 };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Staff Management
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setEditModal(true)}
            className="btn-outline"
          >
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger"
          >
            <Trash2 className="h-4 w-4" /> Delete Staff
          </button>
        </div>
      </div>

      {/* Staff Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={staff.name} size={96} src={staff.photo?.url} />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-ink">{staff.name}</h1>
                <StatusBadge s={staff.status?.toLowerCase().replace(' ', '') || 'active'} />
                <Badge tone="purple">{staff.type}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                <span>ID: <b className="text-ink">{staff.staffId}</b></span>
                <span>•</span>
                <span>Role: <b className="text-ink">{staff.role}</b></span>
                <span>•</span>
                <span>Dept: <b className="text-ink">{staff.department}</b></span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-xs text-ink-600">
                <a href={`tel:${staff.phone}`} className="flex items-center gap-1.5 hover:text-brand-600">
                  <Phone className="h-3.5 w-3.5 text-brand-500" />
                  {staff.phone || '–'}
                </a>
                {staff.email && (
                  <a href={`mailto:${staff.email}`} className="flex items-center gap-1.5 hover:text-brand-600">
                    <Mail className="h-3.5 w-3.5 text-brand-500" />
                    {staff.email}
                  </a>
                )}
                <span className="flex items-center gap-1.5 text-ink-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {fmtDate(staff.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 border-t border-ink/[.06] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="rounded-xl bg-brand-50/60 p-3 text-center">
              <div className="text-xs text-ink-500 font-medium">Monthly Salary</div>
              <div className="mt-1 text-lg font-extrabold text-brand-700">{inr(staff.salary)}</div>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3 text-center">
              <div className="text-xs text-emerald-700 font-medium">Attendance</div>
              <div className="mt-1 text-lg font-extrabold text-emerald-700">{att.percent}%</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-ink/[.08]">
        <div className="flex gap-6">
          {[
            ['overview', 'Overview & Profile'],
            ['attendance', 'Attendance Records'],
            ['leaves', 'Leave History'],
            ['documents', 'Staff Documents'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === key ? 'text-brand-700' : 'text-ink-500 hover:text-ink'
              }`}
            >
              {label}
              {activeTab === key && (
                <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-brand-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Academic & Allocation */}
          <div className="space-y-6 lg:col-span-2">
            <Card title="Role &amp; Academic Allocations">
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded-xl border border-ink/[.06] bg-brand-50/30 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-400">Subjects Handled</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {staff.subjects?.length ? (
                      staff.subjects.map((s) => (
                        <Badge key={s} tone="purple">{s}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-ink-400 italic">None assigned</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-ink/[.06] bg-brand-50/30 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-400">Assigned Classes / Batches</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {staff.assignedClasses?.length ? (
                      staff.assignedClasses.map((c) => (
                        <Badge key={c} tone="blue">{c}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-ink-400 italic">None assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Employment Details">
              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs text-ink-400">Staff Category</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{staff.type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">Designation / Role</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{staff.role}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">Department</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{staff.department}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">Payment Structure</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{staff.paymentType || 'Fixed Monthly'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">Date of Joining</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{fmtDate(staff.joiningDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">Current Status</dt>
                  <dd className="mt-0.5">
                    <StatusBadge s={staff.status?.toLowerCase().replace(' ', '') || 'active'} />
                  </dd>
                </div>
              </dl>
            </Card>
          </div>

          {/* Right Column: Compensation & Summary */}
          <div className="space-y-6">
            <Card title="Payroll &amp; Compensation">
              <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                <div className="text-xs text-brand-200">Current Base Salary</div>
                <div className="mt-1 text-3xl font-extrabold">{inr(staff.salary)}</div>
                <div className="mt-2 text-xs text-brand-100">Disbursed on 1st of every month</div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-ink/[.06]">
                  <span className="text-ink-500">Pay Frequency</span>
                  <span className="font-semibold text-ink">Monthly</span>
                </div>
                <div className="flex justify-between py-1 border-b border-ink/[.06]">
                  <span className="text-ink-500">Payment Mode</span>
                  <span className="font-semibold text-ink">Bank Transfer / Cash</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-500">Payroll Status</span>
                  <Badge tone="green">Active</Badge>
                </div>
              </div>
            </Card>

            <Card title="Attendance Performance">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#10b981 ${att.percent * 3.6}deg, #e5e7eb 0)`,
                  }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-base font-bold text-ink">
                    {att.percent}%
                  </div>
                </div>
                <div className="space-y-1 text-xs text-ink-600">
                  <div>Present: <b className="text-ink">{att.present} days</b></div>
                  <div>Absent: <b className="text-ink">{att.absent} days</b></div>
                  <div>Half Day: <b className="text-ink">{att.halfDay} days</b></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: Attendance */}
      {activeTab === 'attendance' && (
        <Card title="Recent Attendance Records">
          {staff.attendanceHistory?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/[.06] text-xs font-semibold text-ink-500">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Check In</th>
                    <th className="py-2.5">Check Out</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.attendanceHistory.map((a) => (
                    <tr key={a._id}>
                      <td className="py-2.5 font-medium text-ink">{fmtDate(a.date)}</td>
                      <td className="py-2.5 text-xs text-ink-500">{a.checkIn || '09:00 AM'}</td>
                      <td className="py-2.5 text-xs text-ink-500">{a.checkOut || '04:30 PM'}</td>
                      <td className="py-2.5">
                        <StatusBadge s={a.status?.toLowerCase().replace(' ', '') || 'present'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-ink-400">
              No recent attendance logs recorded for this staff member.
            </div>
          )}
        </Card>
      )}

      {/* TAB: Leaves */}
      {activeTab === 'leaves' && (
        <Card title="Leave Records &amp; History">
          {staff.leaveHistory?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/[.06] text-xs font-semibold text-ink-500">
                    <th className="py-2.5">Leave Type</th>
                    <th className="py-2.5">Dates</th>
                    <th className="py-2.5">Days</th>
                    <th className="py-2.5">Reason</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.leaveHistory.map((l) => (
                    <tr key={l._id}>
                      <td className="py-2.5 font-semibold text-ink">{l.leaveType}</td>
                      <td className="py-2.5 text-xs text-ink-500">{l.startDate} to {l.endDate}</td>
                      <td className="py-2.5 text-xs font-bold">{l.days} day(s)</td>
                      <td className="py-2.5 text-xs text-ink-500">{l.reason}</td>
                      <td className="py-2.5">
                        <StatusBadge s={l.status === 'Approved' ? 'active' : l.status === 'Rejected' ? 'inactive' : 'pending'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-ink-400">
              No leave history applied yet.
            </div>
          )}
        </Card>
      )}

      {/* TAB: Documents */}
      {activeTab === 'documents' && (
        <Card
          title="Uploaded Documents"
          action={
            <button
              onClick={() => setUploadModal(true)}
              className="btn-outline h-9 text-xs flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" /> Upload File
            </button>
          }
        >
          {/* Default categories + real uploaded documents */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['ID Proof (Aadhar/PAN)', 'Degree Certificate', 'Appointment Letter', 'Police Verification'].map((d) => {
              const uploadedDoc = (staff.documents || []).find((doc) => doc.title === d || doc.docType === d);
              return (
                <div key={d} className="rounded-xl border border-ink/[.06] bg-brand-50/20 p-4 flex flex-col justify-between">
                  <div>
                    <FileText className="h-6 w-6 text-brand-600" />
                    <div className="mt-2 text-sm font-bold text-ink">{d}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-0.5">
                      {uploadedDoc ? 'Uploaded & Verified' : 'Standard Document'}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-ink/[.06] flex items-center justify-between text-xs">
                    {uploadedDoc?.fileUrl ? (
                      <a
                        href={uploadedDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View / Download
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setDocTitle(d);
                          setUploadModal(true);
                        }}
                        className="text-brand-600 font-semibold hover:underline"
                      >
                        + Upload Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Additional Custom Uploaded Documents */}
            {(staff.documents || [])
              .filter(
                (doc) =>
                  !['ID Proof (Aadhar/PAN)', 'Degree Certificate', 'Appointment Letter', 'Police Verification'].includes(doc.title)
              )
              .map((doc, idx) => (
                <div key={idx} className="rounded-xl border border-ink/[.06] bg-brand-50/20 p-4 flex flex-col justify-between">
                  <div>
                    <FileText className="h-6 w-6 text-brand-600" />
                    <div className="mt-2 text-sm font-bold text-ink">{doc.title}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-0.5">Uploaded File</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-ink/[.06] text-xs">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View Document
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Upload Document Modal */}
      {uploadModal && (
        <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload Staff Document" width="max-w-md">
          <form onSubmit={handleFileUpload} className="space-y-4">
            <Field label="Document Title / Type" required>
              <select
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="inp"
              >
                <option value="ID Proof (Aadhar/PAN)">ID Proof (Aadhar/PAN)</option>
                <option value="Degree Certificate">Degree Certificate</option>
                <option value="Appointment Letter">Appointment Letter</option>
                <option value="Police Verification">Police Verification</option>
                <option value="Experience Certificate">Experience Certificate</option>
                <option value="Other Document">Other Document</option>
              </select>
            </Field>

            <Field label="Select File (PDF, JPG, PNG)" required>
              <input
                ref={fileInputRef}
                type="file"
                required
                accept="image/*,.pdf,.doc,.docx"
                className="inp py-1.5"
              />
            </Field>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUploadModal(false)}
                className="btn border border-ink/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload &amp; Save
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Staff Profile" width="max-w-xl">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const payload = {
                name: fd.get('name'),
                phone: fd.get('phone'),
                email: fd.get('email'),
                role: fd.get('role'),
                department: fd.get('department'),
                salary: Number(fd.get('salary')) || 0,
                status: fd.get('status'),
              };
              const ok = await run(() => api(`/api/staff/${id}`, 'PUT', payload), 'Profile updated successfully');
              if (ok) {
                setEditModal(false);
                mutate();
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input name="name" defaultValue={staff.name} required className="inp" />
              </Field>
              <Field label="Phone / WhatsApp" required>
                <input name="phone" defaultValue={staff.phone} required className="inp" />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email Address">
                <input name="email" type="email" defaultValue={staff.email} className="inp" />
              </Field>
              <Field label="Role / Designation" required>
                <input name="role" defaultValue={staff.role} required className="inp" />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Department" required>
                <input name="department" defaultValue={staff.department} required className="inp" />
              </Field>
              <Field label="Monthly Salary (₹)">
                <input name="salary" type="number" defaultValue={staff.salary} className="inp" />
              </Field>
            </div>

            <Field label="Status">
              <select name="status" defaultValue={staff.status} className="inp">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>

            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" onClick={() => setEditModal(false)} className="btn border border-ink/10">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
