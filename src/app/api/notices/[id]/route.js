import { item } from '@/lib/crud';
import Notice from '@/models/Notice';

export const { GET, PUT, DELETE } = item(Notice);

export const dynamic = 'force-dynamic';
