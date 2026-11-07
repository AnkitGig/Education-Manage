import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import FeeStructure from '@/models/FeeStructure';
import Course from '@/models/Course';

export const GET = wrap(async () => {
  await connectDB();
  const list = await FeeStructure.find().populate('course', 'name board').sort({ createdAt: 1 }).lean();
  return NextResponse.json({ data: list });
});

export const POST = wrap(async (req) => {
  await connectDB();
  const body = await req.json();
  const { courseId, tuition, exam, lab, library, frequency } = body;

  const course = await Course.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: 'Class / Course not found' }, { status: 404 });
  }

  const tuitionNum = Number(tuition) || 0;
  const examNum = Number(exam) || 0;
  const labNum = Number(lab) || 0;
  const libNum = Number(library) || 0;
  const total = tuitionNum + examNum + labNum + libNum;

  // Upsert FeeStructure
  const feeStructure = await FeeStructure.findOneAndUpdate(
    { course: courseId },
    {
      course: courseId,
      className: course.name,
      tuition: tuitionNum,
      exam: examNum,
      lab: labNum,
      library: libNum,
      total,
      frequency: frequency || 'monthly',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Also sync back to Course.fees
  const months = frequency === 'quarterly' ? 3 : frequency === 'half_yearly' ? 6 : frequency === 'yearly' ? 12 : 1;
  const existingFees = course.fees || [];
  const planIdx = existingFees.findIndex((f) => f.plan === (frequency || 'monthly'));
  if (planIdx > -1) {
    existingFees[planIdx].amount = total;
  } else {
    existingFees.push({ plan: frequency || 'monthly', amount: total, months });
  }
  await Course.findByIdAndUpdate(courseId, { fees: existingFees });

  return NextResponse.json(feeStructure, { status: 201 });
});

export const dynamic = 'force-dynamic';
