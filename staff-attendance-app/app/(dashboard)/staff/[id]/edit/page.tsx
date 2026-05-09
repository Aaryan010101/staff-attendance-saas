import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Header } from '@/components/ui/Header';
import { StaffForm } from '@/components/staff/StaffForm';
import { Pencil } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;

  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('*, businesses!inner(owner_id)')
    .eq('id', id)
    .single();

  if (!staff) notFound();
  const biz = staff.businesses as unknown as { owner_id: string };
  if (biz.owner_id !== userId) notFound();

  return (
    <div className="page-enter">
      <Header
        title="Edit Staff"
        subtitle={staff.name}
        action={
          <Link href={`/staff/${id}`}>
            <button className="btn-ghost text-sm flex items-center gap-1.5">
              <Pencil size={14} /> View Profile
            </button>
          </Link>
        }
      />
      <div className="p-4 lg:p-6 max-w-xl mx-auto">
        <div className="card">
          <StaffForm initialData={staff} isEdit />
        </div>
      </div>
    </div>
  );
}
