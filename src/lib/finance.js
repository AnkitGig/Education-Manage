import FeeRecord from '@/models/FeeRecord';
import Salary from '@/models/Salary';
import Expense from '@/models/Expense';
import Staff from '@/models/Staff';
import { monthRange, lastMonths, monthLabel } from './utils';

export async function monthFinance(m) {
  const [a, b] = monthRange(m);
  const [inc, sal, exp, allStaff] = await Promise.all([
    FeeRecord.aggregate([
      { $unwind: '$payments' },
      { $match: { 'payments.date': { $gte: a, $lt: b } } },
      { $group: { _id: null, t: { $sum: '$payments.amount' } } },
    ]),
    Salary.aggregate([
      { $match: { month: m } },
      { $group: { _id: null, t: { $sum: '$netAmount' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: a, $lt: b } } },
      { $group: { _id: null, t: { $sum: '$amount' } } },
    ]),
    Staff.find({ status: { $ne: 'Inactive' } }).select('salary').lean(),
  ]);

  const income = inc[0]?.t || 0;
  // If no salary processed yet for this month, fallback to total baseline staff salaries
  const staffSalaryBaseline = allStaff.reduce((sum, s) => sum + (s.salary || 0), 0);
  const salary = sal[0]?.t || (sal.length === 0 ? staffSalaryBaseline : 0);
  const expenses = exp[0]?.t || 0;
  const profit = income - salary - expenses;

  return {
    month: m,
    label: monthLabel(m),
    income,
    salary,
    expenses,
    profit,
    margin: income ? +((profit / income) * 100).toFixed(1) : 0,
  };
}

export const financeTrend = (n = 6) => Promise.all(lastMonths(n).map(monthFinance));
