import { item } from '@/lib/crud';
import Expense from '@/models/Expense';

export const { GET, PUT, DELETE } = item(Expense);

export const dynamic = 'force-dynamic';
