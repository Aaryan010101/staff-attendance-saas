import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getBusinessForUser, getStaffIdsForBusiness } from '@/lib/supabase/queries';
import { AttendanceClient } from '@/components/attendance/AttendanceClient';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const business = await getBusinessForUser(userId);
  if (!business) redirect('/onboarding');

  const today = format(new Date(), 'yyyy-MM-dd');
  const staffIds = await getStaffIdsForBusiness(business.id);

  // Fetch staff and today's attendance in parallel
  const [staffResult, attendanceResult] = await Promise.all([
    supabaseAdmin
      .from('staff')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('name'),
    supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('date', today)
      .in('staff_id', staffIds)
  ]);

  return (
    <AttendanceClient 
      initialStaff={staffResult.data ?? []} 
      initialAttendance={(attendanceResult.data as any[]) ?? []}
      initialDate={today}
    />
  );
}
