import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import FeeStructure from '@/models/FeeStructure';
import Course from '@/models/Course';

export const GET = wrap(async () => {
  await connectDB();
  const list = await FeeStructure.find().populate('course', 'name board').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ data: list });
});

export const POST = wrap(async (req) => {
  await connectDB();
  const body = await req.json();
  const {
    id,
    courseId,
    name,
    academicSession,
    section,
    feeTypes,
    installments,
    enableInstallments,
    numberOfInstallments,
    applyLateFee,
    lateFeeAmount,
    lateFeePeriod,
    allowPartialPayment,
    isActive,
    // legacy support
    tuition,
    exam,
    lab,
    library,
    frequency,
  } = body;

  const course = await Course.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: 'Class / Course not found' }, { status: 404 });
  }

  // Calculate total
  let total = 0;
  let types = feeTypes;
  if (Array.isArray(feeTypes) && feeTypes.length > 0) {
    total = feeTypes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  } else {
    const tuitionNum = Number(tuition) || 0;
    const examNum = Number(exam) || 0;
    const labNum = Number(lab) || 0;
    const libNum = Number(library) || 0;
    total = tuitionNum + examNum + labNum + libNum;
    types = [
      { type: 'Tuition Fee', amount: tuitionNum, frequency: frequency || 'Annual' },
      ...(examNum > 0 ? [{ type: 'Examination Fee', amount: examNum, frequency: 'Annual' }] : []),
      ...(labNum > 0 ? [{ type: 'Activity / Lab Fee', amount: labNum, frequency: 'Annual' }] : []),
      ...(libNum > 0 ? [{ type: 'Library Fee', amount: libNum, frequency: 'Annual' }] : []),
    ];
  }

  const payload = {
    course: courseId,
    className: course.name,
    name: name || `${course.name} - Regular`,
    academicSession: academicSession || '2026 - 2027',
    section: section || 'All',
    feeTypes: types,
    total,
    frequency: frequency || 'yearly',
    enableInstallments: enableInstallments !== undefined ? enableInstallments : true,
    numberOfInstallments: Number(numberOfInstallments) || 4,
    installments: Array.isArray(installments) ? installments : [],
    applyLateFee: applyLateFee !== undefined ? applyLateFee : true,
    lateFeeAmount: Number(lateFeeAmount) || 100,
    lateFeePeriod: lateFeePeriod || 'Per Day',
    allowPartialPayment: allowPartialPayment || false,
    isActive: isActive !== undefined ? isActive : true,
  };

  let feeStructure;
  if (id) {
    feeStructure = await FeeStructure.findByIdAndUpdate(id, payload, { new: true });
  } else {
    // Check if structure exists for same course & session or upsert
    feeStructure = await FeeStructure.findOneAndUpdate(
      { course: courseId, academicSession: payload.academicSession, section: payload.section },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Sync to course fee plan
  const existingFees = course.fees || [];
  const planName = 'yearly';
  const planIdx = existingFees.findIndex((f) => f.plan === planName);
  if (planIdx > -1) {
    existingFees[planIdx].amount = total;
  } else {
    existingFees.push({ plan: planName, amount: total, months: 12 });
  }
  await Course.findByIdAndUpdate(courseId, { fees: existingFees });

  return NextResponse.json(feeStructure, { status: 201 });
});

export const DELETE = wrap(async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  await FeeStructure.findByIdAndDelete(id);
  return NextResponse.json({ success: true, message: 'Fee structure deleted' });
});

export const dynamic = 'force-dynamic';
