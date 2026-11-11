'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Trash2, FileText, Check } from 'lucide-react';
import { useApi, api, run, upload, toast } from '@/lib/client';
import { Field, Card, cn, inr, Avatar } from './ui';

const STEPS = ['Student', 'Class', 'Fees', 'Review'];
const PLANS = [
  ['monthly', 'Monthly', 1],
  ['quarterly', 'Quarterly', 3],
  ['half_yearly', 'Half-yearly', 6],
  ['yearly', 'Yearly', 12],
];
const EMPTY = {
  name: '', dob: '', gender: 'Male', bloodGroup: '', mobile: '',
  parentName: '', parentRelation: 'Father', parentMobile: '', email: '', address: '',
  photo: null, documents: [], course: '', batch: '', feePlan: 'monthly', feeAmount: 0, status: 'active',
};
const digits = (v) => (v || '').replace(/\D/g, '').slice(-10);

function Select({ options, ...props }) {
  return (
    <select className="inp" {...props}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function StudentForm({ initial }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(
    initial
      ? {
        ...EMPTY, ...initial,
        course: initial.course?._id || initial.course,
        batch: initial.batch?._id || initial.batch,
        dob: initial.dob?.slice(0, 10) || '',
      }
      : EMPTY
  );
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const { data: courses } = useApi('/api/courses');
  const { data: batches } = useApi(f.course ? `/api/batches?course=${f.course}` : null);
  const course = courses?.data?.find((c) => c._id === f.course);
  const batch = batches?.data?.find((b) => b._id === f.batch);
  const feeOf = (plan) => course?.fees?.find((x) => x.plan === plan)?.amount || 0;
  const pickPlan = (plan) => setF((x) => ({ ...x, feePlan: plan, feeAmount: feeOf(plan) }));

  const uploadFile = (folder, onDone) => async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = await run(() => upload(file, folder));
    if (r) onDone(r);
    e.target.value = '';
  };
  const onPhoto = uploadFile('students', (r) => setF((x) => ({ ...x, photo: { url: r.url, publicId: r.publicId } })));
  const onDoc = uploadFile('documents', (r) =>
    setF((x) => ({ ...x, documents: [...x.documents, { name: r.name, url: r.url, publicId: r.publicId }] }))
  );

  const validate = () => {
    if (step === 0) {
      if (!f.name.trim()) return 'Enter the student’s name';
      if (!f.parentName.trim()) return 'Enter the parent’s name';
      if (digits(f.parentMobile).length !== 10) return 'Enter a valid 10-digit parent mobile number';
    }
    if (step === 1 && (!f.course || !f.batch)) return 'Select a class and section';
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) return toast(err, 'error');
    if (step === 1) pickPlan(f.feePlan);
    setStep(step + 1);
  };

  const save = async () => {
    setBusy(true);
    const body = { ...f };
    if (!body.dob) delete body.dob;
    const r = await run(
      () => (initial ? api(`/api/students/${initial._id}`, 'PUT', body) : api('/api/students', 'POST', body)),
      initial ? 'Student updated' : 'Student admitted'
    );
    setBusy(false);
    if (r) router.push('/students');
  };

  const review = [
    ['Student', `${f.name} · ${f.gender}${f.dob ? ` · ${f.dob}` : ''}`, 0],
    ['Parent', `${f.parentName} (${f.parentRelation}) · ${f.parentMobile}`, 0],
    ['Class', `${course?.name || '–'} · ${batch?.name || '–'}`, 1],
    ['Fee plan', `${PLANS.find((p) => p[0] === f.feePlan)?.[1]} · ${inr(f.feeAmount)}`, 2],
    ['Documents', f.documents.length ? `${f.documents.length} attached` : 'None', 0],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/students" className="rounded-lg border border-ink/10 bg-white p-2 hover:bg-ink-50" aria-label="Back to students">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-ink">{initial ? `Edit ${initial.name}` : 'New admission'}</h1>
      </div>

      {/* Stepper */}
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              className="w-full text-left disabled:cursor-default"
            >
              <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-brand-600' : 'bg-ink/10')} />
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
                    i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-ink/10 text-ink-400'
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn('text-sm font-semibold', i === step ? 'text-ink' : 'text-ink-400')}>{s}</span>
              </div>
            </button>
          </li>
        ))}
      </ol>

      {/* Step 1 – Student */}
      {step === 0 && (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-col items-center gap-4 border-b border-ink/[.06] pb-5 sm:flex-row">
              <Avatar src={f.photo?.url} name={f.name || 'Student'} size={80} />
              <div className="flex gap-2">
                <label className="btn-outline cursor-pointer">
                  <Upload className="h-4 w-4" />{f.photo ? 'Change photo' : 'Upload photo'}
                  <input type="file" hidden accept="image/*" onChange={onPhoto} />
                </label>
                {f.photo && (
                  <button type="button" className="btn border border-ink/10 text-ink-500" onClick={() => setF({ ...f, photo: null })}>
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required className="sm:col-span-2">
                <input className="inp" value={f.name} onChange={set('name')} autoFocus />
              </Field>
              <Field label="Date of birth"><input type="date" className="inp" value={f.dob} onChange={set('dob')} /></Field>
              <Field label="Gender"><Select options={['Male', 'Female', 'Other']} value={f.gender} onChange={set('gender')} /></Field>
              <Field label="Blood group">
                <select className="inp" value={f.bloodGroup} onChange={set('bloodGroup')}>
                  <option value="">Not set</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Student mobile">
                <input className="inp" inputMode="tel" value={f.mobile} onChange={set('mobile')} />
              </Field>
              <Field label="Email" className="sm:col-span-2"><input type="email" className="inp" value={f.email} onChange={set('email')} /></Field>
              <Field label="Address" className="sm:col-span-2"><textarea rows={2} className="inp" value={f.address} onChange={set('address')} /></Field>
            </div>
          </Card>

          <Card title="Parent or guardian">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required><input className="inp" value={f.parentName} onChange={set('parentName')} /></Field>
              <Field label="Relation"><Select options={['Father', 'Mother', 'Guardian']} value={f.parentRelation} onChange={set('parentRelation')} /></Field>
              <Field label="WhatsApp mobile" required className="sm:col-span-2">
                <input className="inp" inputMode="tel" value={f.parentMobile} onChange={set('parentMobile')} placeholder="10-digit number" />
              </Field>
            </div>
          </Card>

          <Card title="Documents">
            {f.documents.length > 0 && (
              <ul className="mb-3 space-y-2">
                {f.documents.map((d, i) => (
                  <li key={d.publicId} className="flex items-center gap-3 rounded-lg border border-ink/10 p-2.5 text-sm">
                    <FileText className="h-5 w-5 text-ink-400" />
                    <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">{d.name}</a>
                    <button
                      type="button"
                      aria-label="Remove document"
                      onClick={() => setF((x) => ({ ...x, documents: x.documents.filter((_, j) => j !== i) }))}
                      className="text-ink-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="btn-outline cursor-pointer">
              <Upload className="h-4 w-4" />Add document
              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onDoc} />
            </label>
            <p className="mt-2 text-xs text-ink-400">PDF, JPG or PNG, up to 5 MB.</p>
          </Card>
        </div>
      )}

      {/* Step 2 – Class */}
      {step === 1 && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class" required>
              <select
                className="inp"
                value={f.course}
                onChange={(e) => setF({ ...f, course: e.target.value, batch: '', feeAmount: 0 })}
              >
                <option value="">Select class</option>
                {courses?.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Section" required>
              <select className="inp" value={f.batch} onChange={set('batch')} disabled={!f.course}>
                <option value="">Select section</option>
                {batches?.data?.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}{b.teacher?.name ? ` · ${b.teacher.name}` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="inp" value={f.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="onhold">On hold</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          {courses && !courses.data?.length && (
            <p className="mt-4 text-sm text-amber-700">
              No classes yet. <Link href="/courses" className="font-semibold underline">Add a class and section</Link> first.
            </p>
          )}
        </Card>
      )}

      {/* Step 3 – Fees */}
      {step === 2 && (
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLANS.map(([k, label, months]) => (
              <label
                key={k}
                className={cn(
                  'cursor-pointer rounded-xl border p-4 transition',
                  f.feePlan === k ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-ink/10 hover:bg-ink-50'
                )}
              >
                <input type="radio" name="plan" className="sr-only" checked={f.feePlan === k} onChange={() => pickPlan(k)} />
                <div className="font-semibold text-ink">{label}</div>
                <div className="mt-1 text-lg font-bold text-ink">{inr(feeOf(k))}</div>
                <div className="text-xs text-ink-400">every {months === 1 ? 'month' : `${months} months`}</div>
              </label>
            ))}
          </div>
          <Field label="Amount (edit to give a discount)" className="mt-5 max-w-xs">
            <input type="number" min="0" className="inp" value={f.feeAmount} onChange={(e) => setF({ ...f, feeAmount: Number(e.target.value) })} />
          </Field>
        </Card>
      )}

      {/* Step 4 – Review */}
      {step === 3 && (
        <Card>
          <div className="mb-4 flex items-center gap-3 border-b border-ink/[.06] pb-4">
            <Avatar src={f.photo?.url} name={f.name} size={56} />
            <div className="text-lg font-bold text-ink">{f.name}</div>
          </div>
          <dl className="divide-y divide-ink/[.06] text-sm">
            {review.map(([k, v, s]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-3">
                <dt className="w-24 shrink-0 text-ink-400">{k}</dt>
                <dd className="flex-1 font-medium text-ink">{v}</dd>
                <button type="button" onClick={() => setStep(s)} className="text-xs font-semibold text-brand-600 hover:underline">Edit</button>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-ink/[.08] pt-5">
        {step === 0 ? (
          <Link href="/students" className="btn border border-ink/10 bg-white">Cancel</Link>
        ) : (
          <button type="button" className="btn border border-ink/10 bg-white" onClick={() => setStep(step - 1)}>Back</button>
        )}
        {step < 3 ? (
          <button type="button" className="btn-primary" onClick={next}>Continue</button>
        ) : (
          <button type="button" className="btn-primary" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Admit student'}
          </button>
        )}
      </div>
    </div>
  );
}