import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getBusinessForUser, getStaffIdsForBusiness } from '@/lib/supabase/queries';
import { SalaryClient } from '@/components/salary/SalaryClient';

export const dynamic = 'force-dynamic';

export default async function SalaryPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const business = await getBusinessForUser(userId);
  if (!business) redirect('/onboarding');

  const currentMonth = format(new Date(), 'yyyy-MM');
  const staffIds = await getStaffIdsForBusiness(business.id);

  const { data: records } = await supabaseAdmin
    .from('salary_records')
    .select('*, staff(name, role, phone, salary_type, monthly_salary, daily_wage)')
    .in('staff_id', staffIds)
    .eq('month', currentMonth)
    .order('month', { ascending: false });

  return (
    <SalaryClient 
      initialRecords={records ?? []} 
      initialMonth={currentMonth} 
    />
  );
}
