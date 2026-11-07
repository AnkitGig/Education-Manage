import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import FeeRecord from '@/models/FeeRecord';
import Course from '@/models/Course';
import Student from '@/models/Student';
import { curMonth, feeStatus } from '@/lib/utils';

export const GET = wrap(async () => {
  await connectDB();

  const now = new Date();
  const currentMonthStr = curMonth(); // YYYY-MM

  // 1. Fetch all FeeRecords populated with student and course/batch
  const feeRecords = await FeeRecord.find({})
    .populate({
      path: 'student',
      select: 'name studentId photo course batch parentMobile',
      populate: [
        { path: 'course', select: 'name' },
        { path: 'batch', select: 'name' },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  // 2. Fetch all Courses for Dynamic Fee Structure
  const courses = await Course.find({ status: 'active' }).lean();

  // 3. Compute KPI Aggregates
  let totalFee = 0;
  let collectedFees = 0;
  let pendingFees = 0;

  feeRecords.forEach((r) => {
    totalFee += Number(r.amount || 0);
    collectedFees += Number(r.paid || 0);
  });
  pendingFees = Math.max(0, totalFee - collectedFees);

  // 4. Compute Last 8 Months Overview for Chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = {};

  // Initialize last 8 months in chronological order
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = monthNames[d.getMonth()];
    monthlyMap[key] = { month: label, collectedAmt: 0, pendingAmt: 0 };
  }

  feeRecords.forEach((r) => {
    const m = r.month;
    if (m && monthlyMap[m]) {
      const amt = Number(r.amount || 0);
      const paid = Number(r.paid || 0);
      monthlyMap[m].collectedAmt += paid;
      monthlyMap[m].pendingAmt += Math.max(0, amt - paid);
    }
  });

  const monthlyOverview = Object.values(monthlyMap).map((m) => {
    const total = m.collectedAmt + m.pendingAmt;
    const rate = total > 0 ? Math.round((m.collectedAmt / total) * 100) : 0;
    return {
      month: m.month,
      // Values in Lakhs or Thousands formatted cleanly
      collected: Number((m.collectedAmt / 100000).toFixed(2)),
      pending: Number((m.pendingAmt / 100000).toFixed(2)),
      rate,
    };
  });

  // 5. Extract Recent Collections directly from FeeRecord.payments array
  const recentCollections = [];
  feeRecords.forEach((r) => {
    const sName = r.student?.name || 'Student';
    const cName = r.student?.course?.name || r.student?.batch?.name || 'Class';
    if (Array.isArray(r.payments) && r.payments.length > 0) {
      r.payments.forEach((p) => {
        recentCollections.push({
          receiptNo: p.receiptNo || `RCP-${String(r._id).slice(-5).toUpperCase()}`,
          name: sName,
          class: cName,
          amount: p.amount || 0,
          mode: p.mode || 'Cash',
          date: p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          rawDate: p.date ? new Date(p.date).getTime() : 0,
        });
      });
    } else if (r.paid > 0) {
      recentCollections.push({
        receiptNo: `RCP-${String(r._id).slice(-5).toUpperCase()}`,
        name: sName,
        class: cName,
        amount: r.paid,
        mode: 'Online',
        date: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
        rawDate: r.updatedAt ? new Date(r.updatedAt).getTime() : 0,
      });
    }
  });

  // Sort recent payments newest first and limit to top 8
  recentCollections.sort((a, b) => b.rawDate - a.rawDate);
  const topRecentCollections = recentCollections.slice(0, 8);

  // 6. Compute Real Due Alerts
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  let dueIn7Days = 0;
  let overdue = 0;
  let partiallyPaid = 0;

  feeRecords.forEach((r) => {
    const due = Math.max(0, (r.amount || 0) - (r.paid || 0));
    if (due > 0) {
      if (r.paid > 0) {
        partiallyPaid++;
      }
      if (r.dueDate) {
        const dDate = new Date(r.dueDate);
        if (dDate < now) {
          overdue++;
        } else if (dDate <= sevenDaysFromNow) {
          dueIn7Days++;
        }
      }
    }
  });

  const dueAlerts = {
    dueIn7Days,
    overdue,
    partiallyPaid,
  };

  // 7. Dynamic Fee Structures from Active Courses
  const feeStructures = courses.map((c) => {
    const primaryPlan = c.fees && c.fees.length > 0 ? c.fees[0] : null;
    const tuition = primaryPlan?.amount || 0;
    const exam = Math.round(tuition * 0.1);
    const lab = Math.round(tuition * 0.05);
    const total = tuition + exam + lab;

    return {
      class: c.name,
      tuition,
      exam,
      lab,
      total: total || tuition,
      frequency: primaryPlan?.plan ? primaryPlan.plan.replace('_', ' ') : 'Annual',
    };
  });

  return NextResponse.json({
    kpis: {
      totalFee,
      collectedFees,
      pendingFees,
    },
    monthlyOverview,
    recentCollections: topRecentCollections,
    dueAlerts,
    feeStructures,
  });
});

export const dynamic = 'force-dynamic';
