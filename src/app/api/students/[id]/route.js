import { item } from '@/lib/crud';
import Student from '@/models/Student';

export const { GET, PUT, DELETE } = item(Student, { populate: [{ path: 'course', select: 'name fees' }, { path: 'batch', select: 'name startTime endTime' }] });

export const dynamic = 'force-dynamic';
