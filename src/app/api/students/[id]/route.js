import { item, wrap } from '@/lib/crud';
import Student from '@/models/Student';
import { syncStudentFeeRecords } from '@/lib/feeRecords';

const crud = item(Student, { populate: [{ path: 'course', select: 'name fees' }, { path: 'batch', select: 'name startTime endTime' }] });

export const GET = crud.GET;
export const DELETE = crud.DELETE;
export const PUT = wrap(async (req, ctx) => {
  const res = await crud.PUT(req, ctx);
  if (res.status === 200) {
    await syncStudentFeeRecords(ctx.params.id);
  }
  return res;
});

export const dynamic = 'force-dynamic';
