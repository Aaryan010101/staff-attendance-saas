import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getBusinessForUser, getStaffIdsForBusiness } from '@/lib/supabase/queries';
import { AdvancesClient } from '@/components/advances/AdvancesClient';

export const dynamic = 'force-dynamic';

export default async function AdvancesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const business = await getBusinessForUser(userId);
  if (!business) redirect('/onboarding');

  const staffIds = await getStaffIdsForBusiness(business.id);

  const [advancesResult, staffResult] = await Promise.all([
    supabaseAdmin
      .from('advances')
      .select('*, staff(name, role)')
      .in('staff_id', staffIds)
      .order('given_date', { ascending: false }),
    supabaseAdmin
      .from('staff')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('name')
  ]);

  return (
    <AdvancesClient 
      initialAdvances={advancesResult.data ?? []} 
      initialStaff={staffResult.data ?? []} 
    />
  );
}
