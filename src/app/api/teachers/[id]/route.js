import { item } from '@/lib/crud';
import Teacher from '@/models/Teacher';

export const { GET, PUT, DELETE } = item(Teacher);

export const dynamic = 'force-dynamic';
