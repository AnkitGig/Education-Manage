import FeeRecord from '@/models/FeeRecord';
import Salary from '@/models/Salary';
import Expense from '@/models/Expense';
import { monthRange, lastMonths, monthLabel } from './utils';

export async function monthFinance(m) {
  const [a, b] = monthRange(m);
  const [inc, sal, exp] = await Promise.all([
    FeeRecord.aggregate([
      { $unwind: '$payments' },
      { $match: { 'payments.date': { $gte: a, $lt: b } } },
      { $group: { _id: null, t: { $sum: '$payments.amount' } } },
    ]),
    Salary.aggregate([{ $match: { month: m } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
    Expense.aggregate([{ $match: { date: { $gte: a, $lt: b } } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
  ]);
  const income = inc[0]?.t || 0, salary = sal[0]?.t || 0, expenses = exp[0]?.t || 0;
  const profit = income - salary - expenses;
  return { month: m, label: monthLabel(m), income, salary, expenses, profit, margin: income ? +((profit / income) * 100).toFixed(1) : 0 };
}

export const financeTrend = (n = 6) => Promise.all(lastMonths(n).map(monthFinance));
