'use client';
import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Building2, Users, Crown, Link2, Database, SlidersHorizontal, Camera, Check, Plus, Pencil, Trash2, MessageCircle, CreditCard, Save } from 'lucide-react';
import { useApi, api, run, upload, fmtDate } from '@/lib/client';
import { Card, Field, Table, Badge, StatusBadge, Avatar, PageHeader, Toggle, Modal, inr } from '@/components/ui';

export default function Settings() {
  const { data, mutate } = useApi('/api/settings');
  const { data: users, mutate: mu } = useApi('/api/users');
  const [f, setF] = useState(null);
  const [um, setUm] = useState(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (patch = f) => { const r = await run(() => api('/api/settings', 'PUT', patch), 'Settings saved'); if (r) mutate(); };
  const logo = async (e) => { const file = e.target.files[0]; if (!file) return; const r = await run(() => upload(file, 'logo')); if (r) { const logo = { url: r.url, publicId: r.publicId }; setF({ ...f, logo }); save({ logo }); } };
  const sys = (k, v) => { const system = { ...f.system, [k]: v }; setF({ ...f, system }); save({ system }); };
  const saveUser = async () => {
    const r = await run(() => (um._id ? api(`/api/users/${um._id}`, 'PUT', um) : api('/api/users', 'POST', um)), 'User saved');
    if (r) { setUm(null); mu(); }
  };
  const delUser = async (u) => { if (confirm(`Remove ${u.name}?`)) { await run(() => api(`/api/users/${u._id}`, 'DELETE'), 'User removed'); mu(); } };
  const loadDemo = async () => { const r = await run(() => api('/api/setup/demo', 'POST'), 'Sample data loaded'); if (r) mutate(); };
  const clearAll = async () => { if (confirm('Delete ALL students, fees, attendance, teachers, courses and notices? Users and settings are kept. This cannot be undone.')) await run(() => api('/api/setup/demo', 'DELETE'), 'All data cleared'); };
  const plan = f.plan || {};

  return (
    <div className="space-y-5">
      <PageHeader icon={SettingsIcon} title="Settings & Institute Profile" sub="Manage institute details, users, permissions, integrations and system preferences." />
      <div className="grid gap-5 2xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card title="Institute Profile" icon={Building2}>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="relative flex h-40 flex-col items-center justify-center rounded-2xl bg-brand-50">
                {f.logo?.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={f.logo.url} alt="logo" className="h-full w-full rounded-2xl object-contain p-2" />
                  : <div className="text-center"><Building2 className="mx-auto h-10 w-10 text-brand-600" /><div className="mt-1 text-sm font-bold">{f.name}</div></div>}
                <label className="absolute -bottom-3 -right-3 cursor-pointer rounded-full border bg-white p-2 shadow"><Camera className="h-4 w-4 text-brand-600" /><input hidden type="file" accept="image/*" onChange={logo} /></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Institute Name" required><input className="inp" value={f.name || ''} onChange={set('name')} /></Field>
                <Field label="Registration No."><input className="inp" value={f.regNo || ''} onChange={set('regNo')} /></Field>
                <Field label="Contact Number" required><input className="inp" value={f.phone || ''} onChange={set('phone')} /></Field>
                <Field label="Email" required><input className="inp" value={f.email || ''} onChange={set('email')} /></Field>
                <Field label="Address" required className="sm:col-span-2"><input className="inp" value={f.address || ''} onChange={set('address')} /></Field>
              </div>
              <Field label="Website" className="sm:col-span-1"><input className="inp" value={f.website || ''} onChange={set('website')} /></Field>
              <Field label="Time Zone"><select className="inp" value={f.timezone} onChange={set('timezone')}><option value="Asia/Kolkata">(GMT+05:30) India Standard Time</option></select></Field>
            </div>
          </Card>
          <Card title="Institute Details" icon={Building2}>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Institute Type"><select className="inp" value={f.type} onChange={set('type')}><option>Coaching Institute</option><option>School</option><option>Tuition Center</option></select></Field>
              <Field label="Board / Focus"><select className="inp" value={f.board} onChange={set('board')}>{['CBSE', 'ICSE', 'State Board', 'JEE / NEET', 'Mixed'].map((b) => <option key={b}>{b}</option>)}</select></Field>
              <Field label="Academic Year"><input className="inp" value={f.academicYear} onChange={set('academicYear')} /></Field>
              <Field label="Language"><select className="inp" value={f.language} onChange={set('language')}><option>English</option><option>Hindi</option><option>English + Hindi</option></select></Field>
            </div>
            <div className="mt-4 flex justify-end"><button className="btn-primary" onClick={() => save()}><Save className="h-4 w-4" />Save Changes</button></div>
          </Card>
          <Card title="Users, Roles & Permissions" icon={Users} action={<button className="btn-outline py-1.5" onClick={() => setUm({ name: '', email: '', password: '', role: 'teacher' })}><Plus className="h-4 w-4" />Add User</button>}>
            <Table rows={users?.data} cols={[
              { h: '#', render: (_, i) => i + 1 },
              { h: 'User Name', render: (u) => <div className="flex items-center gap-2"><Avatar name={u.name} size={32} /><div><div className="font-semibold">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div></div> },
              { h: 'Role', render: (u) => <Badge tone={u.role === 'admin' ? 'purple' : u.role === 'teacher' ? 'blue' : 'orange'} className="capitalize">{u.role}</Badge> },
              { h: 'Status', render: (u) => <StatusBadge s={u.status} /> },
              { h: 'Last Login', render: (u) => <span className="text-xs">{u.lastLogin ? fmtDate(u.lastLogin, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–'}</span> },
              { h: 'Actions', render: (u) => <div className="flex gap-2"><button onClick={() => setUm({ ...u, password: '' })}><Pencil className="h-4 w-4 text-brand-600" /></button><button onClick={() => delUser(u)}><Trash2 className="h-4 w-4 text-red-500" /></button></div> },
            ]} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Subscription Plan" icon={Crown} action={<Badge tone="purple">{plan.name} Plan</Badge>}>
            <div className="flex items-end justify-between"><div className="text-3xl font-extrabold">{inr(plan.price)}<span className="text-base font-medium text-slate-500"> / month</span></div><span className="text-xs text-slate-500">Valid till: {fmtDate(plan.validTill)}</span></div>
            <ul className="mt-3 grid grid-cols-2 gap-1.5 text-sm">{[`Up to ${plan.maxStudents} Students`, 'Reports & Analytics', 'Fees & Payments', 'Multi-user Access', 'WhatsApp Notifications', 'Online Support'].map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" />{x}</li>)}</ul>
          </Card>
          <Card title="Integrations" icon={Link2}>
            <div className="space-y-3">{[[MessageCircle, 'WhatsApp (Business API)', 'Send fee reminders, attendance alerts & notices', f.integrations?.whatsapp], [CreditCard, 'Cloudinary', 'Photos, logos and documents storage', f.integrations?.cloudinary]].map(([I, t, d, on]) => <div key={t} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><I className="h-5 w-5" /></span><div className="flex-1"><div className="text-sm font-bold">{t}</div><div className="text-xs text-slate-500">{d}</div></div><Badge tone={on ? 'green' : 'gray'}>{on ? 'Connected' : 'Not connected'}</Badge></div>)}</div>
            <p className="mt-3 text-xs text-slate-400">Credentials are read from your server’s <code>.env</code> file.</p>
          </Card>
          <Card title="Sample Data" icon={Database}>
            <p className="text-sm text-ink-500">Fill an empty institute with demo courses, teachers, students, fees and attendance to explore the app.</p>
            <div className="mt-3 flex flex-wrap gap-2"><button className="btn-outline" onClick={loadDemo}>Load sample data</button><button className="btn border border-rose-200 text-rose-600 hover:bg-rose-50" onClick={clearAll}>Clear all data</button></div>
          </Card>
          <Card title="System Settings" icon={SlidersHorizontal}>
            <div className="space-y-3 text-sm">{[['emailNotifications', 'Email Notifications'], ['portalAccess', 'Student/Parent Portal Access'], ['mobileAccess', 'Mobile App Access'], ['autoBackup', 'Auto Backup']].map(([k, l]) => <div key={k} className="flex items-center justify-between"><span className="font-medium">{l}</span><Toggle checked={f.system?.[k] !== false} onChange={(v) => sys(k, v)} /></div>)}</div>
          </Card>
        </div>
      </div>

      <Modal open={!!um} onClose={() => setUm(null)} title={um?._id ? 'Edit user' : 'Add user'}>
        {um && <><div className="space-y-3">
          <Field label="Name" required><input className="inp" value={um.name} onChange={(e) => setUm({ ...um, name: e.target.value })} /></Field>
          <Field label="Email" required><input type="email" className="inp" value={um.email} onChange={(e) => setUm({ ...um, email: e.target.value })} /></Field>
          <Field label={um._id ? 'New password (leave blank to keep)' : 'Password'} required={!um._id}><input type="password" className="inp" value={um.password} onChange={(e) => setUm({ ...um, password: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Role"><select className="inp" value={um.role} onChange={(e) => setUm({ ...um, role: e.target.value })}><option value="admin">Admin</option><option value="teacher">Teacher</option><option value="accounts">Accounts</option></select></Field>
            <Field label="Status"><select className="inp" value={um.status || 'active'} onChange={(e) => setUm({ ...um, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>
        </div><div className="mt-5 flex justify-end gap-2"><button className="btn border" onClick={() => setUm(null)}>Cancel</button><button className="btn-primary" onClick={saveUser}>Save user</button></div></>}
      </Modal>
    </div>
  );
}
