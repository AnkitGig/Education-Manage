'use client';
import { useParams } from 'next/navigation';
import StudentForm from '@/components/StudentForm';
import { useApi } from '@/lib/client';
import { Spinner } from '@/components/ui';

export default function EditStudent() {
  const { id } = useParams();
  const { data } = useApi(`/api/students/${id}`);
  if (!data) return <div className="py-24"><Spinner /></div>;
  return <StudentForm initial={data} />;
}

