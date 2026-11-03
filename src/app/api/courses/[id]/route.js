import { item } from '@/lib/crud';
import Course from '@/models/Course';

export const { GET, PUT, DELETE } = item(Course);

export const dynamic = 'force-dynamic';
