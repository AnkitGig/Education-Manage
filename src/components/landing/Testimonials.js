'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export default function Testimonials({ items }) {
  const [i, setI] = useState(0);
  const t = items[i];
  const go = (d) => setI((i + d + items.length) % items.length);
  return (
    <div className="flex h-full flex-col justify-center rounded-2xl bg-white p-6 shadow-[0_10px_30px_-12px_rgba(20,60,160,.25)] ring-1 ring-slate-200/70 sm:p-7">
      <div className="flex gap-4">
        <Quote className="h-9 w-9 shrink-0 fill-royal-200 text-royal-200" />
        <p className="text-[15px] font-medium leading-relaxed text-navy">“{t.quote}”</p>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {t.photo ? <img src={t.photo} alt={t.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-white" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-royal-100 font-bold text-royal">{t.name[0]}</span>}
          <div><div className="text-sm font-bold text-navy">{t.name}</div><div className="text-xs text-slate-500">{t.role}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} aria-label="Previous" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} aria-label="Next" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">{items.map((_, n) => <button key={n} onClick={() => setI(n)} aria-label={`Testimonial ${n + 1}`} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-royal' : 'w-1.5 bg-slate-300'}`} />)}</div>
    </div>
  );
}
