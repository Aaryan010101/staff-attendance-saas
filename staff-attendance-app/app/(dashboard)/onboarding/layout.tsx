import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';

// Separate layout for onboarding — no sidebar/bottom nav
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // If already onboarded, skip
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) redirect('/dashboard');

  return <>{children}</>;
}
