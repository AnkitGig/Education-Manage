import FeeRecord from '@/models/FeeRecord';
import FeeStructure from '@/models/FeeStructure';
import Batch from '@/models/Batch';
import Student from '@/models/Student';
import { curMonth } from './utils';

/**
 * Ensures a student has fee records generated.
 * If the student already has fee records, does nothing.
 * If none exist, finds matching FeeStructure or student.feeAmount and creates the records.
 */
export async function syncStudentFeeRecords(studentInput) {
  let student = studentInput;
  if (typeof studentInput === 'string' || (studentInput && !studentInput._id && studentInput.id)) {
    student = await Student.findById(studentInput).lean();
  } else if (studentInput && studentInput._id && (!studentInput.course || !studentInput.batch)) {
    student = await Student.findById(studentInput._id).lean();
  }

  if (!student || !student._id) return [];

  // Check if fee records already exist for this student
  const existingRecords = await FeeRecord.find({ student: student._id }).sort({ dueDate: 1 }).lean();
  if (existingRecords.length > 0) {
    return existingRecords;
  }

  // Find batch to match section
  let batchName = '';
  if (student.batch) {
    if (typeof student.batch === 'object' && student.batch.name) {
      batchName = student.batch.name;
    } else {
      const b = await Batch.findById(student.batch).lean();
      if (b) batchName = b.name;
    }
  }

  // Look up matching Fee Structure created for this class & section
  let feeStructure = null;
  if (student.feeStructureId) {
    feeStructure = await FeeStructure.findById(student.feeStructureId).lean();
  }
  if (!feeStructure && student.course && batchName) {
    feeStructure = await FeeStructure.findOne({
      course: student.course,
      section: batchName,
      isActive: { $ne: false },
    }).lean();
  }
  if (!feeStructure && student.course) {
    feeStructure = await FeeStructure.findOne({
      course: student.course,
      section: { $in: ['All', '', null] },
      isActive: { $ne: false },
    }).lean();
  }
  if (!feeStructure && student.course) {
    feeStructure = await FeeStructure.findOne({
      course: student.course,
      isActive: { $ne: false },
    }).sort({ createdAt: -1 }).lean();
  }

  const adm = student.admissionDate ? new Date(student.admissionDate) : new Date();
  const createdRecords = [];

  // If the fee structure defines installments, generate a record for each installment
  if (feeStructure?.enableInstallments && Array.isArray(feeStructure.installments) && feeStructure.installments.length > 0) {
    for (const inst of feeStructure.installments) {
      const dueDate = inst.dueDate ? new Date(inst.dueDate) : new Date(adm.getTime() + 7 * 864e5);
      const rec = await FeeRecord.create({
        student: student._id,
        month: curMonth(dueDate),
        plan: inst.name || 'Installment',
        amount: Number(inst.amount) || 0,
        dueDate,
      });
      createdRecords.push(rec);
    }
    await Student.findByIdAndUpdate(student._id, {
      feeAmount: feeStructure.total,
      feePlan: feeStructure.frequency || 'yearly',
    });
  } else {
    const feeAmount = feeStructure ? feeStructure.total : Number(student.feeAmount) || 0;
    const feePlan = feeStructure ? (feeStructure.frequency || 'yearly') : (student.feePlan || 'yearly');

    if (feeAmount > 0) {
      const rec = await FeeRecord.create({
        student: student._id,
        month: curMonth(adm),
        plan: feePlan,
        amount: feeAmount,
        dueDate: new Date(adm.getTime() + 7 * 864e5),
      });
      createdRecords.push(rec);
      await Student.findByIdAndUpdate(student._id, { feeAmount, feePlan });
    }
  }

  return createdRecords;
}

/**
 * Ensures all students who currently have 0 fee records get synced
 */
export async function syncAllMissingFeeRecords(courseId = null) {
  const distinctStudentsWithFees = await FeeRecord.distinct('student');
  const query = {
    status: { $ne: 'inactive' },
    _id: { $nin: distinctStudentsWithFees },
  };
  if (courseId) {
    query.course = courseId;
  }
  const students = await Student.find(query).lean();
  for (const s of students) {
    await syncStudentFeeRecords(s);
  }
}

