import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getBusinessForUser, getStaffIdsForBusiness } from '@/lib/supabase/queries';
import { ReportsClient } from '@/components/reports/ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const business = await getBusinessForUser(userId);
  if (!business) redirect('/onboarding');

  const currentMonth = format(new Date(), 'yyyy-MM');
  const staffIds = await getStaffIdsForBusiness(business.id);

  // Fetch all report data in parallel
  const [staffResult, attendanceResult, salaryResult] = await Promise.all([
    supabaseAdmin
      .from('staff')
      .select('id, name, role, salary_type')
      .eq('business_id', business.id)
      .order('name'),
    supabaseAdmin
      .from('attendance')
      .select('staff_id, date, status')
      .in('staff_id', staffIds)
      .gte('date', `${currentMonth}-01`)
      .lte('date', `${currentMonth}-31`),
    supabaseAdmin
      .from('salary_records')
      .select('staff_id, month, present_days, final_salary, is_paid')
      .in('staff_id', staffIds)
      .eq('month', currentMonth)
  ]);
  return (
    <ReportsClient 
      initialStaff={staffResult.data ?? []} 
      initialAttendance={attendanceResult.data ?? []}
      initialSalary={salaryResult.data ?? []}
      initialMonth={currentMonth}
    />
  );
}
