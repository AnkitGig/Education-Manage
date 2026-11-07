import Link from 'next/link';
import { ArrowRight, Check, Users, CreditCard, CalendarCheck, MessageCircle, Layers, UsersRound, BarChart3, Megaphone, UserCog, ShieldCheck, GraduationCap, Star, Zap, PlayCircle, Plus, Mail } from 'lucide-react';
import { getSession } from '@/lib/auth';
import LandingNav from '@/components/landing/Nav';
import Logo from '@/components/landing/Logo';
import Testimonials from '@/components/landing/Testimonials';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'EduManage – Coaching institute management software',
  description: 'Admissions, fees, attendance, teachers and parent updates on WhatsApp, all in one simple dashboard. Built for coaching institutes in India.',
};

/* ------------------------------------------------------------------
   CONTENT – everything marked "SAMPLE" is placeholder copy from the
   design mock-up. Replace it with real, verifiable numbers, client
   logos and testimonials before you publish the page.
------------------------------------------------------------------- */
const TRUSTED = [ // SAMPLE client names – replace with your real clients' logos
  { name: 'Vidya Plus', sub: 'COACHING INSTITUTE', cls: 'text-sky-700 font-extrabold tracking-tight' },
  { name: 'Pragati', sub: 'CLASSES', cls: 'text-red-600 font-black italic' },
  { name: 'Career Hub', sub: '', cls: 'text-blue-800 font-extrabold' },
  { name: 'Gyan Point', sub: 'ACADEMY', cls: 'text-blue-600 font-extrabold italic' },
  { name: 'TOPPERS', sub: 'ACADEMY', cls: 'text-navy font-black tracking-widest' },
];
const STATS = [ // SAMPLE figures
  [Users, '1,000+', 'Institutes Trust Us'], [GraduationCap, '5,00,000+', 'Students Managed'],
  [MessageCircle, '1 Cr+', 'WhatsApp Messages Sent'], [Star, '99.9%', 'Uptime & Reliability'],
];
const TESTIMONIALS = [ // SAMPLE testimonials
  { quote: 'EduManage has made our day-to-day work so much easier. Fee collection is smooth, attendance takes seconds and parents are always informed on WhatsApp.', name: 'Rakesh Sharma', role: 'Director, Sharma Coaching Classes, Jaipur', photo: '/landing/avatar.webp' },
  { quote: 'Fee reminders go out by themselves now, so we spend far less time chasing payments at the front desk.', name: 'Sample Name', role: 'Founder, Sample Academy' },
  { quote: 'The monthly profit view finally shows us where the money goes. Our team loves how simple everything is.', name: 'Sample Name', role: 'Director, Sample Classes' },
];

const FEATURES = [
  [Users, 'Student', 'Management'], [CreditCard, 'Fees &', 'Receipts'], [CalendarCheck, 'Smart', 'Attendance'], [MessageCircle, 'WhatsApp', 'Notifications'], [Layers, 'Courses &', 'Batches'],
  [UsersRound, 'Teachers', '& Payroll'], [BarChart3, 'Reports', '& Profit'], [Megaphone, 'Notices', '& Events'], [UserCog, 'Multi-user', 'Access'], [ShieldCheck, 'Secure', '& Reliable'],
];
const STEPS = [
  ['Create your institute', 'Sign up and set your institute profile.'],
  ['Add courses & batches', 'Define courses, fee plans, timings and teachers.'],
  ['Admit students', 'A guided form to capture details, photo, documents and the fee plan.'],
  ['Run your daily operations', 'Collect fees, mark attendance and keep parents in the loop on WhatsApp.'],
];
const WHY = [[Zap, 'Save 5–10 hours', 'every week'], [UsersRound, 'Better', 'parent communication'], [Layers, 'Timely fee collection &', 'higher recovery'], [BarChart3, 'Clear view of', 'growth & profitability']];
const TYPES = [
  ['School Coaching', '(Classes 6 – 12)', '/landing/type1.webp'], ['Competitive Exam', '(IIT-JEE, NEET, UPSC, SSC)', '/landing/type2.webp'],
  ['Skill & Hobby Classes', '(Spoken English, Computer, etc.)', '/landing/type3.webp'], ['Tuition & Private Classes', '(Small and mid-size institutes)', '/landing/type4.webp'],
];
const FAQ = [
  ['Do I need a WhatsApp Business account?', 'To deliver real WhatsApp messages you connect the WhatsApp Business Cloud API from Meta. Until then every message is logged in demo mode so you can try the full flow.'],
  ['Can I try it with sample data?', 'Yes. After creating your account, load sample data with one click to explore every screen, then clear it when you are ready to add your own students.'],
  ['Does it work on phones?', 'Yes. The dashboard is fully responsive, so you can mark attendance or collect a fee from your phone.'],
  ['Can I export my data?', 'Students, fees, teachers and monthly reports can be exported as CSV files that open in Excel.'],
  ['Who can log in?', 'Admins, teachers and accounts staff each get their own login. Admins control access from Settings.'],
];
const PLAN = ['Up to 500 students', 'All features included', 'WhatsApp notifications', 'Multi-user access', 'Online support'];

const Chip = ({ children, className = '' }) => <span className={`inline-flex items-center gap-2 rounded-full bg-royal-100 px-3.5 py-1.5 text-[13px] font-semibold text-royal ${className}`}>{children}</span>;
const Squiggle = () => (
  <svg className="absolute -bottom-2.5 left-0 h-3 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 C 30 2, 60 12, 100 6 S 170 3, 198 7" stroke="#1f5fe0" strokeWidth="3.2" fill="none" strokeLinecap="round" /></svg>
);
const Flag = () => (
  <svg width="22" height="15" viewBox="0 0 22 15" className="rounded-[3px] ring-1 ring-black/10" aria-hidden="true"><rect width="22" height="5" fill="#ff9933" /><rect y="5" width="22" height="5" fill="#fff" /><rect y="10" width="22" height="5" fill="#138808" /><circle cx="11" cy="7.5" r="1.8" fill="none" stroke="#000080" strokeWidth=".7" /></svg>
);
const Primary = ({ href, children, className = '' }) => <Link href={href} className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-royal px-6 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-royal-700 ${className}`}>{children}</Link>;
const Outline = ({ href, children, className = '' }) => <a href={href} className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-royal/50 bg-white px-6 text-[15px] font-semibold text-royal transition hover:bg-royal-50 ${className}`}>{children}</a>;
const Tick = () => <Check className="h-[18px] w-[18px] shrink-0 text-emerald-600" strokeWidth={2.6} />;

export default async function Landing() {
  const session = await getSession();
  const cta = session ? ['/dashboard', 'Open dashboard'] : ['/login', 'Get started free'];

  return (
    <div className="overflow-x-hidden bg-white font-sans text-navy pt-16">
      <LandingNav loggedIn={!!session} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-r from-white via-[#f4f8ff] to-[#e9f1ff]">
        <div className="mx-auto grid max-w-[1240px] items-center px-5 sm:px-8 lg:min-h-[560px] lg:grid-cols-[1.12fr_1fr]">
          <div className="relative z-10 py-12 lg:py-16">
            <span className="inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium shadow-sm ring-1 ring-slate-200"><Flag />Built for coaching institutes in India</span>
            <h1 className="mt-6 max-w-[640px] text-[40px] font-extrabold leading-[1.08] tracking-tight sm:text-[50px] lg:text-[54px]">
              Run your coaching institute without <span className="relative inline-block text-royal">the chaos<Squiggle /></span>
            </h1>
            <p className="mt-7 max-w-[500px] text-[17px] leading-relaxed text-slate-600">Admissions, fees, attendance, teachers and parent updates on WhatsApp, all in one simple dashboard. Spend less time on registers and more on teaching.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Primary href={cta[0]}>{cta[1]}<ArrowRight className="h-4 w-4" /></Primary>
              <Outline href="#how">See how it works<PlayCircle className="h-5 w-5" /></Outline>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
              {['Setup in 5 minutes', 'No installation', 'Start with sample data'].map((t) => <li key={t} className="flex items-center gap-2"><Tick />{t}</li>)}
            </ul>
          </div>
          <div className="relative -mx-5 sm:-mx-8 lg:hidden"><img src="/landing/hero.webp" alt="A teacher smiling in a coaching classroom" width={1158} height={814} className="h-auto w-full" /></div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-0 hidden w-[56%] lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/hero.webp" alt="A teacher smiling in a coaching classroom" width={1158} height={814} className="h-full w-full object-cover object-left [mask-image:linear-gradient(to_right,transparent,black_30%)]" />
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="border-b border-slate-100">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-5 px-5 py-6 sm:px-8 lg:flex-nowrap">
          <p className="text-[17px] font-medium lg:max-w-[330px]">Trusted by <b className="text-royal">1,000+</b> coaching institutes across India</p>
          <span className="hidden h-10 w-px bg-slate-200 lg:block" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-3 lg:flex-nowrap">
            {TRUSTED.map((l) => (
              <div key={l.name} className="text-center leading-none"><div className={`whitespace-nowrap text-lg ${l.cls}`}>{l.name}</div>{l.sub && <div className="mt-1 text-[8px] font-bold tracking-[.18em] text-slate-500">{l.sub}</div>}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE ICONS */}
      <section id="features" className="scroll-mt-20 px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-y-6 rounded-2xl bg-white py-6 shadow-[0_8px_30px_-12px_rgba(20,60,160,.25)] ring-1 ring-slate-200/70 sm:grid-cols-5 lg:grid-cols-10">
          {FEATURES.map(([Icon, a, b]) => (
            <div key={a + b} className="flex flex-col items-center px-2 text-center lg:border-l lg:border-slate-200/80 lg:first:border-l-0">
              <Icon className="h-8 w-8 text-royal" strokeWidth={1.6} />
              <div className="mt-2.5 text-[13px] font-semibold leading-snug">{a}<br />{b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPLETE SOLUTION */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-y-0 left-0 hidden w-[56%] lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/laptop.webp" alt="EduManage dashboard on a laptop" width={1296} height={696} loading="lazy" className="h-full w-full object-cover object-right [mask-image:linear-gradient(to_right,black_72%,transparent)]" />
        </div>
        <div className="relative mx-auto grid max-w-[1240px] lg:min-h-[420px] lg:grid-cols-[1.1fr_1fr]">
          <div className="-mx-0 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/laptop.webp" alt="EduManage dashboard on a laptop" width={1296} height={696} loading="lazy" className="h-auto w-full" />
          </div>
          <div className="hidden lg:block" />
          <div className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:py-14 lg:pl-4">
            <div><Chip>The Complete Solution</Chip></div>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl">Everything your institute needs, <span className="relative inline-block text-royal">in one platform<Squiggle /></span></h2>
            <ul className="mt-7 space-y-3 text-[15px] font-medium text-slate-700">
              {['Manage students, fees, attendance and teachers', 'Keep parents informed on WhatsApp automatically', 'Track your growth and profitability with reports', 'Access from any device, anytime, anywhere'].map((t) => <li key={t} className="flex items-start gap-3"><Tick />{t}</li>)}
            </ul>
            <div><Primary href="#features" className="mt-8">Explore all features<ArrowRight className="h-4 w-4" /></Primary></div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-5 pt-8 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-y-7 rounded-2xl bg-gradient-to-r from-royal-700 via-royal to-royal-700 px-4 py-7 text-white shadow-xl shadow-blue-700/20 lg:grid-cols-4">
          {STATS.map(([Icon, n, l]) => (
            <div key={l} className="flex items-center justify-center gap-3 px-2 sm:gap-4 sm:px-3 lg:border-l lg:border-white/20 lg:first:border-l-0">
              <Icon className="h-8 w-8 shrink-0 text-white/90 sm:h-10 sm:w-10" strokeWidth={1.5} />
              <div><div className="text-xl font-extrabold leading-none sm:text-[28px]">{n}</div><div className="mt-1.5 text-[13px] text-white/80">{l}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW + PRICING */}
      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div id="how" className="scroll-mt-24">
            <Chip className="rounded-md py-1">How it works</Chip>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Get started in 4 simple steps</h2>
            <p className="mt-2 text-slate-600">Set up your institute and start managing everything in an afternoon.</p>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-royal text-base font-bold text-white shadow-md shadow-blue-600/30">{i + 1}</span>
                    {i < 3 && <span className="hidden flex-1 items-center xl:flex"><span className="h-px flex-1 border-t border-dashed border-slate-300" /><ArrowRight className="-ml-1 h-3.5 w-3.5 text-slate-400" /></span>}
                  </div>
                  <h3 className="mt-3.5 text-[15px] font-bold leading-snug">{t}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{d}</p>
                </li>
              ))}
            </ol>
          </div>

          <div id="pricing" className="scroll-mt-24 rounded-2xl bg-gradient-to-br from-white to-royal-50 p-6 shadow-[0_10px_30px_-12px_rgba(20,60,160,.3)] ring-1 ring-slate-200/80">
            <Chip className="rounded-md py-1">Simple &amp; Transparent Pricing</Chip>
            <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-x-4">
              <div>
                <h3 className="text-xl font-extrabold">Standard Plan</h3>
                <div className="mt-2 flex items-end gap-1"><span className="text-[44px] font-extrabold leading-none tracking-tight">₹399</span><span className="pb-1 text-lg text-slate-600">/month</span></div>
              </div>
              <ul className="space-y-1.5 text-[13px] font-medium text-slate-700">{PLAN.map((p) => <li key={p} className="flex items-center gap-2"><Tick />{p}</li>)}</ul>
            </div>
            <Primary href={cta[0]} className="mt-6 w-full">{session ? 'Open dashboard' : 'Get started now'}<ArrowRight className="h-4 w-4" /></Primary>
            <p className="mt-3 text-center text-[13px] text-slate-600">Need more than 500 students? <a href="mailto:info@edumanage.in" className="font-semibold text-royal hover:underline">Talk to us →</a></p>
          </div>
        </div>
      </section>

      {/* WHY + TESTIMONIAL */}
      <section id="why" className="scroll-mt-20 px-5 pb-10 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-6 rounded-2xl bg-[#f3f7ff] p-6 ring-1 ring-royal-100 lg:grid-cols-[1.5fr_1fr] lg:p-8">
          <div>
            <h2 className="text-[28px] font-extrabold tracking-tight">Why institutes choose EduManage</h2>
            <div className="mt-6 grid grid-cols-2 gap-y-6 lg:grid-cols-4">
              {WHY.map(([Icon, a, b]) => (
                <div key={a} className="flex flex-col items-center px-3 text-center lg:border-l lg:border-slate-300/60 lg:first:border-l-0">
                  <Icon className="h-9 w-9 text-royal" strokeWidth={1.6} />
                  <div className="mt-3 text-sm font-bold leading-snug">{a}<br />{b}</div>
                </div>
              ))}
            </div>
          </div>
          <Testimonials items={TESTIMONIALS} />
        </div>
      </section>

      {/* TYPES */}
      <section id="types" className="scroll-mt-20 px-5 pb-14 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="text-2xl font-extrabold tracking-tight">Works for different types of institutes</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TYPES.map(([t, s, img]) => (
              <div key={t} className="flex items-center gap-4 rounded-xl bg-white p-2.5 pr-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={t} width={132} height={100} loading="lazy" className="h-[68px] w-[90px] shrink-0 rounded-lg object-cover" />
                <div className="min-w-0"><div className="text-sm font-bold leading-snug">{t}</div><div className="mt-0.5 text-xs leading-snug text-slate-500">{s}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-[#f7f9fe] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center"><Chip>FAQ</Chip><h2 className="mt-4 text-3xl font-extrabold tracking-tight">Questions, answered</h2></div>
          <div className="mt-9 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 open:ring-royal/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">{q}<Plus className="h-5 w-5 shrink-0 text-royal transition group-open:rotate-45" /></summary>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-14 sm:px-8">
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-2xl bg-gradient-to-r from-royal-800 via-royal-700 to-royal px-6 py-14 text-center text-white shadow-xl shadow-blue-700/25">
          <span className="absolute -left-14 -top-14 h-48 w-48 rounded-full bg-white/10" /><span className="absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-white/10" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to run your institute without the chaos?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-lg text-white/80">Create your account in minutes and explore everything with sample data.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href={cta[0]} className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 font-semibold text-royal-700 shadow-lg transition hover:bg-royal-50">{cta[1]}<ArrowRight className="h-4 w-4" /></Link>
            <a href="mailto:info@edumanage.in" className="inline-flex h-12 items-center gap-2 rounded-lg bg-white/15 px-7 font-semibold ring-1 ring-white/40 transition hover:bg-white/25"><Mail className="h-4 w-4" />Talk to us</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5 px-5 py-8 sm:px-8">
          <div className="flex items-center gap-3"><Logo dark className="h-7" /></div>
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-white/70"><a href="#features" className="hover:text-white">Features</a><a href="#pricing" className="hover:text-white">Pricing</a><a href="#faq" className="hover:text-white">FAQ</a><Link href="/login" className="hover:text-white">Log in</Link></nav>
          <p className="text-sm text-white/50">© {new Date().getFullYear()} EduManage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
