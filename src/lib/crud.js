import { NextResponse } from 'next/server';
import { connectDB } from './db';
import { getSession } from './auth';
import { esc, monthRange } from './utils';

/** Wraps a route handler with auth check + DB connect + error handling */
export const wrap = (fn) => async (req, ctx) => {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    return await fn(req, ctx, session);
  } catch (e) {
    console.error(e);
    const msg = e.code === 11000 ? 'Duplicate value – record already exists' : e.message || 'Server error';
    return NextResponse.json({ error: msg }, { status: e.status || (e.name === 'ValidationError' ? 400 : 500) });
  }
};

export const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

/** Generic list + create handlers for a mongoose model */
export function collection(Model, { search = [], filters = [], populate, sort = { createdAt: -1 }, dateField, beforeCreate } = {}) {
  return {
    GET: wrap(async (req) => {
      const sp = new URL(req.url).searchParams;
      const q = {};
      filters.forEach((f) => { const v = sp.get(f); if (v && v !== 'all') q[f] = v; });
      const s = sp.get('q');
      if (s && search.length) q.$or = search.map((f) => ({ [f]: { $regex: esc(s), $options: 'i' } }));
      const m = sp.get('month');
      if (m && dateField) { const [a, b] = monthRange(m); q[dateField] = { $gte: a, $lt: b }; }
      const page = +sp.get('page') || 1, limit = +sp.get('limit') || 10;
      let cur = Model.find(q).sort(sort);
      if (sp.get('all') !== '1') cur = cur.skip((page - 1) * limit).limit(limit);
      if (populate) cur = cur.populate(populate);
      const [data, total] = await Promise.all([cur.lean(), Model.countDocuments(q)]);
      return NextResponse.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
    }),
    POST: wrap(async (req) => {
      let body = await req.json();
      if (beforeCreate) body = await beforeCreate(body);
      return NextResponse.json(await Model.create(body), { status: 201 });
    }),
  };
}

/** Generic get / update / delete by id */
export function item(Model, { populate, beforeUpdate } = {}) {
  return {
    GET: wrap(async (_, { params }) => {
      let c = Model.findById(params.id);
      if (populate) c = c.populate(populate);
      const d = await c.lean();
      return d ? NextResponse.json(d) : bad('Not found', 404);
    }),
    PUT: wrap(async (req, { params }) => {
      let body = await req.json();
      if (beforeUpdate) body = await beforeUpdate(body);
      const d = await Model.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
      return d ? NextResponse.json(d) : bad('Not found', 404);
    }),
    DELETE: wrap(async (_, { params }) => {
      const d = await Model.findByIdAndDelete(params.id);
      return d ? NextResponse.json({ ok: true }) : bad('Not found', 404);
    }),
  };
}
