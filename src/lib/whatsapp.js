import Message from '@/models/Message';

export const fill = (body, vars = {}) => body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

/** Sends a text through WhatsApp Cloud API. Without credentials it's a no-op (mock) so the app still works in dev. */
export async function sendText(to, text) {
  const { WHATSAPP_TOKEN: token, WHATSAPP_PHONE_ID: id } = process.env;
  const num = String(to || '').replace(/\D/g, '');
  if (!num) return { ok: false };
  if (!token || !id) return { ok: true, mock: true };
  const phone = num.length === 10 ? '91' + num : num;
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: text } }),
    });
    return { ok: r.ok };
  } catch {
    return { ok: false };
  }
}

/** items: [{ to, text }] -> sends all, writes one Message log */
export async function sendBulk({ title, template, items }) {
  let sent = 0, failed = 0;
  for (const it of items) {
    const r = await sendText(it.to, it.text);
    r.ok ? sent++ : failed++;
  }
  await Message.create({
    title, template, recipients: items.length, body: items[0]?.text || '',
    delivered: sent, failed, status: failed === items.length && items.length ? 'failed' : 'sent', sentAt: new Date(),
  });
  return { sent, failed, total: items.length };
}
