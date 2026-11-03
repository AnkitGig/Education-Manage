import Counter from '@/models/Counter';

export async function nextId(key, prefix, pad = 3) {
  const c = await Counter.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return prefix + String(c.seq).padStart(pad, '0');
}

export const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const feeStatus = (r) =>
  r.paid >= r.amount ? 'paid' : r.paid > 0 ? 'partial' : new Date(r.dueDate) < new Date() ? 'overdue' : 'due';

export const PLAN_MONTHS = { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 };

export const curMonth = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const monthRange = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return [new Date(y, mo - 1, 1), new Date(y, mo, 1)];
};
export const lastMonths = (n, from = new Date()) =>
  Array.from({ length: n }, (_, i) => curMonth(new Date(from.getFullYear(), from.getMonth() - (n - 1 - i), 1)));
export const monthLabel = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleString('en-IN', { month: 'short' }) + ' ' + String(y).slice(2);
};
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
