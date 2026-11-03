import { collection } from '@/lib/crud';
import Expense from '@/models/Expense';

export const { GET, POST } = collection(Expense, { search: ['category'], dateField: 'date', sort: { date: -1 } });

export const dynamic = 'force-dynamic';
