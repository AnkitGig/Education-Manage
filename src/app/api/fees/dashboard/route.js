import { NextResponse } from 'next/server';
import { wrap } from '@/lib/crud';
import { connectDB } from '@/lib/db';
import FeeRecord from '@/models/FeeRecord';
import Student from '@/models/Student';

export const GET = wrap(async () => {
  await connectDB();

  // Aggregate stats or return standard financial structure matching design
  const [totalStudents] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
  ]);

  const totalFee = 12000000; // 1,20,00,000
  const collectedFees = 9650000; // 96,50,000 (80.4%)
  const pendingFees = 2350000; // 23,50,000 (19.6%)

  // Monthly collection timeline for dual bar & line chart
  const monthlyOverview = [
    { month: 'Apr', collected: 5.5, pending: 2.2, rate: 58 },
    { month: 'May', collected: 6.8, pending: 2.5, rate: 64 },
    { month: 'Jun', collected: 8.2, pending: 2.0, rate: 70 },
    { month: 'Jul', collected: 9.5, pending: 2.2, rate: 75 },
    { month: 'Aug', collected: 11.0, pending: 2.4, rate: 78 },
    { month: 'Sep', collected: 12.8, pending: 2.8, rate: 84 },
    { month: 'Oct', collected: 14.5, pending: 2.2, rate: 89 },
    { month: 'Nov', collected: 16.0, pending: 2.5, rate: 94 },
  ];

  // Recent Fee Collections
  const recentCollections = [
    { receiptNo: 'RCP10245', name: 'Aarav Sharma', class: 'VIII - A', amount: 12000, mode: 'Online', date: '07 Nov 2026' },
    { receiptNo: 'RCP10244', name: 'Ananya Verma', class: 'VII - B', amount: 12000, mode: 'Online', date: '07 Nov 2026' },
    { receiptNo: 'RCP10243', name: 'Rohan Mehta', class: 'IX - A', amount: 15000, mode: 'UPI', date: '06 Nov 2026' },
    { receiptNo: 'RCP10242', name: 'Kavya Singh', class: 'VI - A', amount: 10000, mode: 'Cash', date: '06 Nov 2026' },
    { receiptNo: 'RCP10241', name: 'Aditya Gupta', class: 'VIII - B', amount: 12000, mode: 'Online', date: '05 Nov 2026' },
  ];

  // Due fee alerts
  const dueAlerts = {
    dueIn7Days: 28,
    overdue: 46,
    partiallyPaid: 19,
  };

  // Fee Structure Plans
  const feeStructures = [
    { class: 'Class 6 - 8 (Middle School)', tuition: 25000, exam: 2500, lab: 1500, total: 29000, frequency: 'Quarterly' },
    { class: 'Class 9 - 10 (Secondary)', tuition: 32000, exam: 3500, lab: 2500, total: 38000, frequency: 'Quarterly' },
    { class: 'Class 11 - 12 (Science Stream)', tuition: 45000, exam: 4500, lab: 6000, total: 55500, frequency: 'Half-Yearly' },
    { class: 'Class 11 - 12 (Commerce Stream)', tuition: 40000, exam: 4000, lab: 2000, total: 46000, frequency: 'Half-Yearly' },
  ];

  return NextResponse.json({
    kpis: {
      totalFee,
      collectedFees,
      pendingFees,
    },
    monthlyOverview,
    recentCollections,
    dueAlerts,
    feeStructures,
  });
});

export const dynamic = 'force-dynamic';

