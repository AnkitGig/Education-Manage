import { item } from '@/lib/crud';
import Template from '@/models/Template';

export const { GET, PUT, DELETE } = item(Template);

export const dynamic = 'force-dynamic';
