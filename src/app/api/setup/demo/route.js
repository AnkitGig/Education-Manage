import { NextResponse } from 'next/server';
import { wrap, bad } from '@/lib/crud';
import { nextId, lastMonths, dayKey } from '@/lib/utils';
import { DEFAULT_TEMPLATES } from '@/lib/templates';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Teacher from '@/models/Teacher';
import Batch from '@/models/Batch';
import FeeRecord from '@/models/FeeRecord';
import Attendance from '@/models/Attendance';
import Salary from '@/models/Salary';
import Expense from '@/models/Expense';
import Notice from '@/models/Notice';
import Message from '@/models/Message';
import Template from '@/models/Template';
import Institute from '@/models/Institute';
import Counter from '@/models/Counter';

// tiny deterministic PRNG so the sample data looks the same every time
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const PLANS = [['monthly', 1], ['quarterly', 3], ['half_yearly', 6], ['yearly', 12]];
const COURSES = [
  ['Class 10 (Maths)', 'CBSE', 10, 'Maths', [2000, 5500, 10000, 18000]],
  ['Class 12 (Science)', 'CBSE', 12, 'Science', [3000, 8500, 16000, 30000]],
  ['NEET Coaching', 'NTA', 12, 'Biology', [4500, 13000, 25000, 45000]],
  ['JEE Coaching', 'NTA', 12, 'Physics', [5000, 14500, 28000, 50000]],
  ['English Speaking', 'Skill', 6, 'English', [1500, 4200, 8000, 15000]],
  ['Computer Basics', 'Skill', 4, 'Computer', [1200, 3300, 6000, 11000]],
];
const TEACHERS = [
  ['Priya Sharma', ['Maths', 'Physics'], 28000, 'Senior Teacher'], ['Amit Verma', ['Science', 'Chemistry'], 24000, 'Teacher'],
  ['Sneha Joshi', ['English'], 20000, 'Teacher'], ['Rahul Mehta', ['Maths', 'Reasoning'], 30000, 'Senior Teacher'],
  ['Neha Gupta', ['Biology'], 22000, 'Teacher'], ['Vivek Tiwari', ['Physics'], 24000, 'Teacher'],
];
const FIRST = ['Riya', 'Aman', 'Sneha', 'Rahul', 'Pooja', 'Karan', 'Neha', 'Vivek', 'Aarav', 'Ishita', 'Rohan', 'Ananya', 'Kabir', 'Diya', 'Arjun', 'Meera', 'Aditya', 'Kavya', 'Siddharth', 'Tanvi'];
const FEMALE = new Set(['Riya', 'Sneha', 'Pooja', 'Neha', 'Ishita', 'Ananya', 'Diya', 'Meera', 'Kavya', 'Tanvi']);
const LAST = ['Verma', 'Patel', 'Singh', 'Mehta', 'Sharma', 'Joshi', 'Gupta', 'Tiwari', 'Yadav', 'Jain'];
const DADS = ['Sandeep', 'Rajesh', 'Manoj', 'Anil', 'Suresh', 'Vikram', 'Deepak', 'Ramesh'];
const phone = () => '9' + String(Math.floor(100000000 + rnd() * 899999999));
const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const POST = wrap(async () => {
  if (await Student.countDocuments()) return bad('Sample data can only be loaded into an empty institute');
  const now = new Date();
  const curM = ym(now);

  // ----- courses & teachers -----
  const courses = await Course.insertMany(COURSES.map(([name, board, dur, , fees]) => ({ name, board, durationMonths: dur, fees: PLANS.map(([plan, months], i) => ({ plan, months, amount: fees[i] })) })));
  const teachers = [];
  for (let i = 0; i < TEACHERS.length; i++) {
    const [name, subjects, salary, role] = TEACHERS[i];
    teachers.push(await Teacher.create({ teacherId: await nextId('teacher', 'TCH', 3), name, subjects, salary, role, phone: '+91 98' + String(10000000 + i * 1234567).slice(0, 8), email: name.split(' ')[0].toLowerCase() + '@edumanage.in', joiningDate: new Date(2024, i, 15) }));
  }

  // ----- batches (two per course) -----
  const batches = [];
  for (let ci = 0; ci < courses.length; ci++) {
    for (let bi = 0; bi < 2; bi++) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      batches.push(await Batch.create({
        name: bi ? 'Batch B (Evening)' : 'Batch A (Morning)', course: courses[ci]._id, teacher: teachers[(ci + bi) % teachers.length]._id,
        startTime: bi ? '16:00' : '08:00', endTime: bi ? '18:00' : '10:00', days, room: `Classroom ${1 + ((ci + bi) % 4)}`,
        timetable: days.map((d) => ({ day: d, subject: d === 'Wed' ? 'Practice / Doubt' : d === 'Sat' ? 'Test & Revision' : COURSES[ci][3] })),
      }));
    }
  }

  // ----- students (spread over the last 10 months) -----
  const students = [];
  for (let i = 0; i < 100; i++) {
    const first = FIRST[i % 20], ci = i % courses.length, bi = Math.floor(i / courses.length) % 2;
    const monthsAgo = 9 - Math.floor(i / 10.5);
    const adm = new Date(now.getFullYear(), now.getMonth() - Math.max(0, monthsAgo), Math.min(1 + ((i * 3) % 24), monthsAgo <= 0 ? now.getDate() : 28));
    const last = LAST[(i * 3 + Math.floor(i / 20)) % 10];
    const status = i === 97 ? 'inactive' : i % 17 === 5 ? 'onhold' : 'active';
    students.push(await Student.create({
      studentId: await nextId('student', 'STU', 4), name: `${first} ${last}`, gender: FEMALE.has(first) ? 'Female' : 'Male',
      dob: new Date(2008 + (i % 4), i % 12, 1 + (i % 27)), bloodGroup: pick(['A+', 'B+', 'O+', 'AB+']),
      mobile: phone(), parentName: `${pick(DADS)} ${last}`, parentRelation: 'Father', parentMobile: phone(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`, address: 'Vijay Nagar, Indore (MP)',
      course: courses[ci]._id, batch: batches[ci * 2 + bi]._id, feePlan: 'monthly', feeAmount: COURSES[ci][4][0],
      admissionDate: adm, status, createdAt: adm,
    }));
  }

  // ----- fee records + payments for last 6 months -----
  let rcp = 0;
  const fees = [];
  for (const s of students) {
    for (const m of lastMonths(6)) {
      if (m < ym(s.admissionDate)) continue;
      const [y, mo] = m.split('-').map(Number);
      const isCur = m === curM;
      const r = rnd();
      let paid = s.feeAmount;
      if (isCur) paid = r < 0.82 ? s.feeAmount : r < 0.92 ? Math.round(s.feeAmount / 2) : 0;
      else if (r > 0.93) paid = Math.round(s.feeAmount / 2);
      const maxDay = isCur ? Math.max(1, now.getDate()) : 27;
      const payments = paid ? [{ amount: paid, mode: pick(['UPI', 'UPI', 'Cash', 'Card', 'Bank Transfer']), date: new Date(y, mo - 1, Math.min(maxDay, 2 + Math.floor(rnd() * 20))), receiptNo: 'RCP' + String(++rcp).padStart(5, '0') }] : [];
      fees.push({ student: s._id, month: m, plan: 'monthly', amount: s.feeAmount, paid, dueDate: new Date(y, mo - 1, 5), payments, status: paid >= s.feeAmount ? 'paid' : paid ? 'partial' : 'due' });
    }
  }
  await FeeRecord.insertMany(fees);
  await Counter.findByIdAndUpdate('receipt', { $set: { seq: rcp } }, { upsert: true });

  // ----- attendance for the last 7 days -----
  const att = [];
  for (let d = 0; d < 7; d++) {
    const date = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - d));
    for (const b of batches) {
      const roll = students.filter((s) => String(s.batch) === String(b._id) && s.status === 'active');
      if (!roll.length) continue;
      att.push({ batch: b._id, date, records: roll.map((s) => { const r = rnd(); return { student: s._id, status: r < 0.87 ? 'present' : r < 0.95 ? 'absent' : 'late' }; }) });
    }
  }
  await Attendance.insertMany(att);

  // ----- salary (6 months) & expenses (3 months) -----
  const sal = [];
  for (const m of lastMonths(6)) {
    const [y, mo] = m.split('-').map(Number);
    teachers.forEach((t, i) => {
      const paid = m !== curM || i < 4;
      sal.push({ teacher: t._id, month: m, amount: t.salary, status: paid ? 'paid' : 'pending', paidOn: paid ? new Date(y, mo - 1, 28) : undefined });
    });
  }
  await Salary.insertMany(sal);
  const exp = [];
  for (const m of lastMonths(3)) {
    const [y, mo] = m.split('-').map(Number);
    [['Rent', 15000, 1], ['Electricity', 5500 + Math.floor(rnd() * 2000), 5], ['Internet & Wi-Fi', 2000, 5], ['Stationery', 4500, 10], ['Marketing (Ads)', 10000, 12], ['Miscellaneous', 7000, 20]]
      .forEach(([category, amount, day]) => exp.push({ category, amount, date: new Date(y, mo - 1, day) }));
  }
  await Expense.insertMany(exp);

  // ----- notices, messages, templates, institute profile -----
  const dt = (d, h = 10) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, h);
  await Notice.insertMany([
    { title: 'Half Yearly Exam Schedule', body: 'Exam will be held from 10 Nov to 15 Nov 2026.', type: 'exam', audience: ['students', 'parents'], status: 'published', publishedAt: dt(1), views: 456 },
    { title: 'Diwali Holiday', body: 'Institute will remain closed from 1 Nov to 5 Nov 2026.', type: 'holiday', audience: ['students', 'parents'], status: 'published', publishedAt: dt(3, 16), views: 720 },
    { title: 'Fee Payment Reminder', body: 'Last date to pay monthly fee is 5 Nov 2026.', type: 'general', audience: ['parents'], status: 'published', publishedAt: dt(4, 11), views: 312 },
    { title: 'Parent–Teacher Meeting', body: 'PTM will be held on 8 Nov 2026 (Sunday) at 10:00 AM.', type: 'event', audience: ['parents'], status: 'scheduled', scheduledAt: new Date(now.getTime() + 5 * 864e5) },
    { title: 'New Batch – Class 10 (Maths)', body: 'Admissions open for new batch. Limited seats!', type: 'general', audience: ['students', 'parents'], status: 'published', publishedAt: dt(6, 18), views: 198 },
    { title: 'Unit Test – Syllabus', body: 'Unit Test 2 syllabus is now available. Please check.', type: 'exam', audience: ['students'], status: 'published', publishedAt: dt(7, 9), views: 256 },
    { title: 'Annual Day Planning', body: 'Draft – committee to finalise the programme.', type: 'event', audience: ['teachers'], status: 'draft' },
  ]);
  await Message.insertMany([
    { title: 'Fee Due Reminder – batch', template: 'fee_due', recipients: 124, delivered: 122, read: 117, replied: 31, sentAt: dt(0, 10), createdAt: dt(0, 10) },
    { title: 'Attendance Alert – auto', template: 'attendance', recipients: 56, delivered: 55, read: 52, replied: 9, sentAt: dt(1, 9), createdAt: dt(1, 9) },
    { title: 'Payment Confirmation – auto', template: 'payment', recipients: 92, delivered: 90, read: 88, replied: 12, sentAt: dt(2, 16), createdAt: dt(2, 16) },
    { title: 'Exam Schedule – Class 10', template: 'exam', recipients: 118, delivered: 116, read: 110, replied: 40, sentAt: dt(3, 11), createdAt: dt(3, 11) },
  ]);
  if ((await Template.countDocuments()) === 0) await Template.insertMany(DEFAULT_TEMPLATES);
  const inst = (await Institute.findOne()) || (await Institute.create({}));
  const fill = { phone: '+91 98765 43210', address: 'Rohini, New Delhi – 110085, India', regNo: 'EDU123456', website: 'https://www.edumanage.in' };
  Object.entries(fill).forEach(([k, v]) => { if (!inst[k]) inst[k] = v; });
  await inst.save();

  return NextResponse.json({ ok: true, students: students.length, teachers: teachers.length, batches: batches.length });
});

// Wipes all business data (keeps users, institute profile and templates)
export const DELETE = wrap(async (_, __, session) => {
  if (session.role !== 'admin') return bad('Only admins can clear data', 403);
  await Promise.all([Student, Course, Teacher, Batch, FeeRecord, Attendance, Salary, Expense, Notice, Message, Counter].map((M) => M.deleteMany({})));
  return NextResponse.json({ ok: true });
});

export const dynamic = 'force-dynamic';
