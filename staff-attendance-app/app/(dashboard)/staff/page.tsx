import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { StaffListClient } from '@/components/staff/StaffListClient';
import { Header } from '@/components/ui/Header';
import { UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StaffListPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, plan')
    .eq('owner_id', userId)
    .single();

  if (!business) redirect('/onboarding');

  const { data: staffList } = await supabaseAdmin
    .from('staff')
    .select('*')
    .eq('business_id', business.id)
    .order('is_active', { ascending: false })
    .order('name');

  const active = (staffList ?? []).filter((s) => s.is_active);
  const inactive = (staffList ?? []).filter((s) => !s.is_active);

  const planLimits: Record<string, number> = { free: 5, basic: 15, pro: 999 };
  const limit = planLimits[business.plan] ?? 5;
  const atLimit = active.length >= limit;

  return (
    <div className="page-enter">
      <Header
        title="Staff"
        subtitle={`${active.length} active · ${inactive.length} resigned`}
        action={
          <Link href="/staff/new">
            <button
              disabled={atLimit}
              title={atLimit ? `Upgrade to add more than ${limit} staff` : 'Add Staff'}
              className={`btn-primary flex items-center gap-2 text-sm py-2 px-3 ${atLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Add Staff</span>
            </button>
          </Link>
        }
      />

      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <StaffListClient
          active={active}
          inactive={inactive}
          plan={business.plan}
          limit={limit}
        />
      </div>
    </div>
  );
}
