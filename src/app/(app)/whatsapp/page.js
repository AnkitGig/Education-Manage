'use client';
import { useEffect, useState } from 'react';
import { MessageCircle, Send, CheckCheck, Eye, Reply, User, Users, BookOpen, Globe, Pencil, Bell, CalendarDays, IndianRupee, Megaphone, Cake, FileText, Plus, Check } from 'lucide-react';
import { useApi, api, run, fmtDate } from '@/lib/client';
import { Stat, Card, Toggle, PageHeader, Modal, Field, cn } from '@/components/ui';

const ICONS = { fee_due: IndianRupee, attendance: CalendarDays, payment: Check, announcement: Megaphone, birthday: Cake, exam: FileText };
const SCOPES = [['student', 'Single Student', User], ['batch', 'Batch', Users], ['course', 'Course', BookOpen], ['all', 'All Students', Globe]];
const AUTO = [['feeReminder', 'Fee Due Reminder', 'Auto send 3 days before due date', IndianRupee], ['attendanceAlert', 'Attendance Alert', 'Auto send when student is absent', CalendarDays], ['paymentConfirmation', 'Payment Confirmation', 'Auto send after fee payment', Check], ['announcements', 'General Announcements', 'Send to selected batches/courses', Bell]];

export default function WhatsApp() {
  const { data: tpls, mutate: mt } = useApi('/api/whatsapp/templates');
  const { data: stats, mutate: mst } = useApi('/api/whatsapp/stats');
  const { data: courses } = useApi('/api/courses');
  const { data: inst, mutate: mi } = useApi('/api/settings');
  const [scope, setScope] = useState('batch');
  const [course, setCourse] = useState(''); const [batch, setBatch] = useState(''); const [student, setStudent] = useState('');
  const [tkey, setTkey] = useState('fee_due');
  const [message, setMessage] = useState('');
  const [edit, setEdit] = useState(null);
  const { data: batches } = useApi(course ? `/api/batches?course=${course}` : null);
  const { data: students } = useApi(scope === 'student' ? '/api/students?limit=200&status=active' : null);
  const t = tpls?.data.find((x) => x.key === tkey);
  const s = stats?.stats || { sent: 0, delivered: 0, read: 0, replied: 0 };
  const pct = (v) => (s.sent ? Math.round((v / s.sent) * 100) : 0);
  useEffect(() => { if (courses?.data.length && !course) setCourse(courses.data[0]._id); }, [courses, course]);
  useEffect(() => { if (batches?.data.length && !batches.data.find((b) => b._id === batch)) setBatch(batches.data[0]._id); }, [batches, batch]);

  const sample = { parent: 'Parent', student: students?.data.find((x) => x._id === student)?.name || 'Aarav Sharma', course: courses?.data.find((c) => c._id === course)?.name || 'Class 10', batch: batches?.data.find((b) => b._id === batch)?.name || 'Batch A', amount: '2,000', dueDate: '05 Nov 2026', date: fmtDate(new Date()), receipt: 'RCP00001', institute: inst?.name || 'Institute', message: message || '[your message]' };
  const preview = t ? t.body.replace(/\{\{(\w+)\}\}/g, (_, k) => sample[k] ?? '') : '';
  const needsMsg = t && t.body.includes('{{message}}');

  const send = async () => {
    const r = await run(() => api('/api/whatsapp/send', 'POST', { scope, course, batch, student, template: tkey, message }), null);
    if (r) { run(async () => r, `Sent to ${r.sent} recipient(s)${r.failed ? `, ${r.failed} failed` : ''}`); mst(); }
  };
  const toggleAuto = (k, v) => run(() => api('/api/settings', 'PUT', { automation: { ...inst.automation, [k]: v } }), null).then(() => mi());
  const saveTpl = async () => { await run(() => api(`/api/whatsapp/templates/${edit._id}`, 'PUT', { title: edit.title, description: edit.description, body: edit.body }), 'Template saved'); setEdit(null); mt(); };

  return (
    <div className="space-y-5">
      <PageHeader icon={MessageCircle} title="WhatsApp Communication" sub="Send automated and bulk messages to students and parents.">
        {inst?.integrations?.whatsapp
          ? <span className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-600">● WhatsApp Connected</span>
          : <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">Demo mode – add WHATSAPP_TOKEN to .env to deliver</span>}
      </PageHeader>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={Send} tone="green" label="Messages Sent (This Month)" value={s.sent} />
        <Stat icon={Users} tone="purple" label={`Delivered (${s.delivered})`} value={`${pct(s.delivered)}%`} />
        <Stat icon={CheckCheck} tone="blue" label={`Read (${s.read})`} value={`${pct(s.read)}%`} />
        <Stat icon={Reply} tone="red" label="Replied" value={s.replied} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr] 2xl:grid-cols-[320px_1fr_340px]">
        <Card title="Message Templates">
          <div className="space-y-2">
            {tpls?.data.map((x) => { const I = ICONS[x.key] || FileText; return (
              <div key={x._id} onClick={() => setTkey(x.key)} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3', tkey === x.key ? 'border-brand-300 bg-brand-50' : 'border-transparent hover:bg-slate-50')}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600"><I className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold">{x.title}</div><div className="truncate text-xs text-slate-500">{x.description}</div></div>
                <button onClick={(e) => { e.stopPropagation(); setEdit({ ...x }); }}><Pencil className="h-4 w-4 text-slate-400" /></button>
              </div>); })}
          </div>
        </Card>

        <Card title="Send WhatsApp Message" icon={Send}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{SCOPES.map(([k, l, I]) => <button key={k} onClick={() => setScope(k)} className={cn('flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold', scope === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'bg-white text-slate-600')}><I className="h-4 w-4" />{l}</button>)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {scope !== 'all' && <Field label="Course" required><select className="inp" value={course} onChange={(e) => { setCourse(e.target.value); setBatch(''); }}>{courses?.data.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>}
            {(scope === 'batch') && <Field label="Batch" required><select className="inp" value={batch} onChange={(e) => setBatch(e.target.value)}>{batches?.data.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></Field>}
            {scope === 'student' && <Field label="Student" required><select className="inp" value={student} onChange={(e) => setStudent(e.target.value)}><option value="">Select…</option>{students?.data.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}</select></Field>}
            <Field label="Template" required><select className="inp" value={tkey} onChange={(e) => setTkey(e.target.value)}>{tpls?.data.map((x) => <option key={x._id} value={x.key}>{x.title}</option>)}</select></Field>
          </div>
          {needsMsg && <Field label="Your message" className="mt-3"><textarea rows={3} className="inp" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type the announcement…" /></Field>}
          <div className="mt-4"><div className="lbl">Message Preview</div><div className="rounded-xl bg-[#efe9dc] p-4"><div className="max-w-md whitespace-pre-wrap rounded-lg rounded-tl-none bg-[#e7ffd0] p-3 text-sm shadow-sm">{preview}</div></div></div>
          <div className="mt-4 flex justify-end"><button className="btn-primary" onClick={send} disabled={needsMsg && !message}><Send className="h-4 w-4" />Send Now</button></div>
        </Card>

        <div className="grid gap-5 lg:col-span-2 lg:grid-cols-2 2xl:col-span-1 2xl:grid-cols-1">
          <Card title="Automated WhatsApp Alerts">
            <div className="space-y-3">{AUTO.map(([k, l, d, I]) => <div key={k} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><I className="h-4 w-4" /></span><div className="flex-1"><div className="text-sm font-semibold">{l}</div><div className="text-xs text-slate-500">{d}</div></div><Toggle checked={inst?.automation?.[k] !== false} onChange={(v) => toggleAuto(k, v)} /></div>)}</div>
            <p className="mt-3 text-xs text-slate-400">Fee reminders are sent by calling <code>/api/cron/reminders</code> once a day (see README).</p>
          </Card>
          <Card title="Recent WhatsApp Messages">
            <div className="space-y-3">
              {!stats?.recent.length && <p className="text-sm text-slate-400">No messages yet</p>}
              {stats?.recent.map((m) => <div key={m._id} className="flex items-center gap-3"><MessageCircle className="h-8 w-8 rounded-full bg-emerald-50 p-1.5 text-emerald-600" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{m.title}</div><div className="text-xs text-slate-500">{m.recipients} recipients · {fmtDate(m.sentAt || m.createdAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div><CheckCheck className={cn('h-4 w-4', m.status === 'failed' ? 'text-red-500' : 'text-emerald-500')} /></div>)}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit template" width="max-w-xl">
        {edit && <><div className="space-y-3"><Field label="Title"><input className="inp" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field><Field label="Message"><textarea rows={8} className="inp" value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field><p className="text-xs text-slate-500">Placeholders: {'{{parent}} {{student}} {{course}} {{batch}} {{amount}} {{dueDate}} {{date}} {{receipt}} {{message}} {{institute}}'}</p></div><div className="mt-4 flex justify-end gap-2"><button className="btn border" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={saveTpl}>Save template</button></div></>}
      </Modal>
    </div>
  );
}
