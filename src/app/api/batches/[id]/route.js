import { item } from '@/lib/crud';
import Batch from '@/models/Batch';

export const { GET, PUT, DELETE } = item(Batch);

export const dynamic = 'force-dynamic';
