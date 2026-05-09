import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Sidebar } from '@/components/ui/Sidebar';
import { BottomNav } from '@/components/ui/BottomNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Check if user has completed onboarding (has a business)
  // Don't redirect if we're already on onboarding page
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Only show nav when business exists */}
      {business && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      {business && <BottomNav />}
    </div>
  );
}
