import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getBusinessForUser } from '@/lib/supabase/queries';
import { Sidebar } from '@/components/ui/Sidebar';
import { BottomNav } from '@/components/ui/BottomNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Cached — won't re-query if child page also calls getBusinessForUser(userId)
  const business = await getBusinessForUser(userId);

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

