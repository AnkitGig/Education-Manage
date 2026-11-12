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
import Staff from '@/models/Staff';
import StaffAttendance from '@/models/StaffAttendance';
import StaffLeave from '@/models/StaffLeave';
import FeeStructure from '@/models/FeeStructure';

export const POST = wrap(async () => {
  return bad('Sample data loading has been disabled', 400);
});

// Wipes all business data (keeps users, institute profile and templates)
export const DELETE = wrap(async (_, __, session) => {
  if (session.role !== 'admin') return bad('Only admins can clear data', 403);
  await Promise.all([
    Student, Course, Teacher, Batch, FeeRecord, Attendance, Salary,
    Expense, Notice, Message, Counter, Staff, StaffAttendance, StaffLeave, FeeStructure
  ].map((M) => M.deleteMany({})));
  return NextResponse.json({ ok: true });
});

export const dynamic = 'force-dynamic';
