'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Upload, Trash2, Paperclip, FileText, Check } from 'lucide-react';
import { useApi, api, run, upload, toast } from '@/lib/client';
import { Field, Card, cn, inr, Avatar } from './ui';

const STEPS = ['Student Details', 'Course & Batch', 'Fee Plan', 'Review & Save'];
const PLANS = [['monthly', 'Monthly', 1], ['quarterly', 'Quarterly', 3], ['half_yearly', 'Half Yearly', 6], ['yearly', 'Yearly', 12]];
const EMPTY = { name: '', dob: '', gender: 'Male', bloodGroup: '', mobile: '', parentName: '', parentRelation: 'Father', parentMobile: '', email: '', address: '', photo: null, documents: [], course: '', batch: '', feePlan: 'monthly', feeAmount: 0, status: 'active' };

export default function StudentForm({ initial }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState(initial ? { ...EMPTY, ...initial, course: initial.course?._id || initial.course, batch: initial.batch?._id || initial.batch, dob: initial.dob?.slice(0, 10) || '' } : EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const { data: courses } = useApi('/api/courses');
  const { data: batches } = useApi(f.course ? `/api/batches?course=${f.course}` : null);
  const course = courses?.data.find((c) => c._id === f.course);
  const feeOf = (plan) => course?.fees?.find((x) => x.plan === plan)?.amount || 0;

  const pickPlan = (plan) => setF((x) => ({ ...x, feePlan: plan, feeAmount: feeOf(plan) }));

  const onPhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = await run(() => upload(file, 'students'));
    if (r) setF((x) => ({ ...x, photo: { url: r.url, publicId: r.publicId } }));
  };
  const onDoc = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = await run(() => upload(file, 'documents'));
    if (r) setF((x) => ({ ...x, documents: [...x.documents, { name: r.name, url: r.url, publicId: r.publicId }] }));
    e.target.value = '';
  };

  const validate = () => {
    if (step === 0 && (!f.name || !f.parentName || !f.parentMobile)) return 'Student name, parent name and parent mobile are required';
    if (step === 0 && !/^\d{10}$/.test(f.parentMobile.replace(/\D/g, '').slice(-10))) return 'Enter a valid 10-digit parent mobile number';
    if (step === 1 && (!f.course || !f.batch)) return 'Select a course and a batch';
    return null;
  };
  const next = () => { const e = validate(); if (e) return toast(e, 'error'); if (step === 1 && !f.feeAmount) pickPlan(f.feePlan); setStep(step + 1); };

  const save = async () => {
    setBusy(true);
    const body = { ...f }; if (!body.dob) delete body.dob;
    const r = await run(() => (initial ? api(`/api/students/${initial._id}`, 'PUT', body) : api('/api/students', 'POST', body)), initial ? 'Student updated' : 'Student admitted');
    setBusy(false);
    if (r) router.push('/students');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/students" className="rounded-lg border bg-white p-2"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold">{initial ? `Edit ${initial.name}` : 'Add New Student (Admission)'}</h1><p className="text-sm text-slate-500">Create a student record, course enrollment and fee plan.</p></div>
      </div>

      <ol className="flex flex-wrap items-center gap-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold', i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500')}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
            <span className={cn('text-sm font-semibold', i === step ? 'text-brand-700' : 'text-slate-500')}>{s}</span>
            {i < 3 && <span className="mx-1 hidden h-px w-10 bg-slate-300 sm:block" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          <Card title="Student Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required><input className="inp" value={f.name} onChange={set('name')} /></Field>
              <Field label="Date of Birth"><input type="date" className="inp" value={f.dob} onChange={set('dob')} /></Field>
              <Field label="Gender"><select className="inp" value={f.gender} onChange={set('gender')}>{['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Blood Group"><select className="inp" value={f.bloodGroup} onChange={set('bloodGroup')}><option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Mobile (Student)"><input className="inp" inputMode="tel" value={f.mobile} onChange={set('mobile')} placeholder="+91 98765 43210" /></Field>
              <Field label="Parent / Guardian Mobile" required><input className="inp" inputMode="tel" value={f.parentMobile} onChange={set('parentMobile')} placeholder="WhatsApp number" /></Field>
              <Field label="Parent / Guardian Name" required><input className="inp" value={f.parentName} onChange={set('parentName')} /></Field>
              <Field label="Relation"><select className="inp" value={f.parentRelation} onChange={set('parentRelation')}>{['Father', 'Mother', 'Guardian'].map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Email" className="sm:col-span-2"><input type="email" className="inp" value={f.email} onChange={set('email')} /></Field>
              <Field label="Address" className="sm:col-span-2"><textarea rows={3} className="inp" value={f.address} onChange={set('address')} /></Field>
            </div>
            <div className="mt-5 border-t pt-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold"><Paperclip className="h-4 w-4 text-brand-600" />Documents <span className="text-xs font-normal text-slate-500">(optional · PDF, JPG, PNG · max 5 MB)</span></h3>
              <div className="space-y-2">
                {f.documents.map((d, i) => (
                  <div key={d.publicId} className="flex items-center gap-3 rounded-lg border p-2 text-sm"><FileText className="h-5 w-5 text-red-500" /><a href={d.url} target="_blank" className="flex-1 truncate hover:underline">{d.name}</a>
                    <button onClick={() => setF((x) => ({ ...x, documents: x.documents.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4 text-red-500" /></button></div>
                ))}
              </div>
              <label className="btn-outline mt-3 cursor-pointer"><Upload className="h-4 w-4" />Upload Document<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onDoc} /></label>
            </div>
          </Card>
          <Card title="Student Photo">
            <div className="flex flex-col items-center gap-3">
              <Avatar src={f.photo?.url} name={f.name || 'Student'} size={150} />
              <label className="btn-outline w-full cursor-pointer"><Upload className="h-4 w-4" />Upload Photo<input type="file" hidden accept="image/*" onChange={onPhoto} /></label>
              {f.photo && <button className="btn w-full border border-red-200 text-red-600" onClick={() => setF({ ...f, photo: null })}><Trash2 className="h-4 w-4" />Remove</button>}
            </div>
          </Card>
        </div>
      )}

      {step === 1 && (
        <Card title="Course & Batch" className="max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course" required><select className="inp" value={f.course} onChange={(e) => setF({ ...f, course: e.target.value, batch: '', feeAmount: 0 })}><option value="">Select course</option>{courses?.data.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
            <Field label="Batch" required><select className="inp" value={f.batch} onChange={set('batch')} disabled={!f.course}><option value="">Select batch</option>{batches?.data.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></Field>
            <Field label="Status"><select className="inp" value={f.status} onChange={set('status')}><option value="active">Active</option><option value="onhold">On Hold</option><option value="inactive">Inactive</option></select></Field>
          </div>
          {courses && !courses.data.length && <p className="mt-3 text-sm text-amber-600">Create a course and batch first in <Link href="/courses" className="underline">Courses & Batches</Link>.</p>}
        </Card>
      )}

      {step === 2 && (
        <Card title="Fee Plan" className="max-w-2xl">
          <div className="space-y-2">
            {PLANS.map(([k, l, m]) => (
              <label key={k} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border p-3', f.feePlan === k && 'border-brand-500 bg-brand-50')}>
                <input type="radio" name="plan" checked={f.feePlan === k} onChange={() => pickPlan(k)} className="accent-brand-600" />
                <span className="flex-1 font-semibold">{l}</span><span className="text-sm text-slate-600">{inr(feeOf(k))} / {m} {m === 1 ? 'month' : 'months'}</span>
              </label>
            ))}
          </div>
          <Field label="Fee amount for this plan (editable for discounts)" className="mt-4"><input type="number" min="0" className="inp" value={f.feeAmount} onChange={(e) => setF({ ...f, feeAmount: +e.target.value })} /></Field>
        </Card>
      )}

      {step === 3 && (
        <Card title="Review" className="max-w-2xl">
          <div className="mb-3 flex items-center gap-3"><Avatar src={f.photo?.url} name={f.name} size={56} /><div><div className="font-bold">{f.name}</div><div className="text-sm text-slate-500">{f.gender} · {f.dob || 'DOB not set'}</div></div></div>
          <dl className="grid grid-cols-[150px_1fr] gap-y-2 text-sm">
            {[['Parent', `${f.parentName} (${f.parentRelation})`], ['Parent mobile', f.parentMobile], ['Student mobile', f.mobile || '–'], ['Email', f.email || '–'], ['Address', f.address || '–'], ['Course', course?.name], ['Batch', batches?.data.find((b) => b._id === f.batch)?.name], ['Fee plan', `${PLANS.find((p) => p[0] === f.feePlan)?.[1]} · ${inr(f.feeAmount)}`], ['Documents', `${f.documents.length} file(s)`]].map(([k, v]) => (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>))}
          </dl>
        </Card>
      )}

      <div className="flex justify-center gap-3 pt-2">
        {step === 0 ? <Link href="/students" className="btn border bg-white">Cancel</Link> : <button className="btn border bg-white" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 3 ? <button className="btn-primary" onClick={next}>Save & Continue <ArrowRight className="h-4 w-4" /></button> : <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : initial ? 'Update Student' : 'Admit Student'}</button>}
      </div>
    </div>
  );
}
