import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getBusinessForUser } from '@/lib/supabase/queries';
import { Header } from '@/components/ui/Header';
import {
  Users, IndianRupee,
  UserPlus, CalendarDays, DollarSign,
  TrendingUp, AlertCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { AttendanceStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Cached — shared with layout, no extra DB call
  const business = await getBusinessForUser(userId);
  if (!business) redirect('/onboarding');

  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');

  // Fetch active staff (needed for IDs)
  const { data: staffList } = await supabaseAdmin
    .from('staff')
    .select('id, salary_type, monthly_salary, daily_wage')
    .eq('business_id', business.id)
    .eq('is_active', true);

  const activeStaff = staffList ?? [];
  const staffIds = activeStaff.map((s) => s.id);

  // ── Parallelize all independent queries ──────────────────────────────────
  const [todayAttResult, monthlyAttResult, salaryResult] = await Promise.all([
    // Today's attendance
    staffIds.length > 0
      ? supabaseAdmin
          .from('attendance')
          .select('staff_id, status')
          .in('staff_id', staffIds)
          .eq('date', today)
      : Promise.resolve({ data: [] }),

    // Monthly attendance (for payroll estimate)
    staffIds.length > 0
      ? supabaseAdmin
          .from('attendance')
          .select('staff_id, status')
          .in('staff_id', staffIds)
          .gte('date', monthStart)
          .lte('date', monthEnd)
      : Promise.resolve({ data: [] }),

    // Pending salary payments
    staffIds.length > 0
      ? supabaseAdmin
          .from('salary_records')
          .select('id, staff_id, final_salary, staff!inner(name, role)')
          .in('staff_id', staffIds)
          .eq('month', currentMonth)
          .eq('is_paid', false)
      : Promise.resolve({ data: [] }),
  ]);

  const todayAtt = todayAttResult.data ?? [];
  const monthlyAtt = monthlyAttResult.data ?? [];
  const salaryRecords = salaryResult.data ?? [];

  type AttRow = { staff_id: string; status: AttendanceStatus };
  const presentToday = (todayAtt as AttRow[]).filter((a) => a.status === 'present').length;
  const absentToday = (todayAtt as AttRow[]).filter((a) => a.status === 'absent').length;
  const halfToday = (todayAtt as AttRow[]).filter((a) => a.status === 'half_day').length;
  const notMarked = activeStaff.length - todayAtt.length;

  // Monthly payroll estimate
  let payrollEstimate = 0;
  for (const s of activeStaff) {
    if (s.salary_type === 'monthly') {
      payrollEstimate += s.monthly_salary ?? 0;
    } else {
      const presenceDays = (monthlyAtt as AttRow[])
        .filter((a) => a.staff_id === s.id)
        .reduce((acc: number, a) => acc + (a.status === 'present' ? 1 : a.status === 'half_day' ? 0.5 : 0), 0);
      payrollEstimate += (s.daily_wage ?? 0) * presenceDays;
    }
  }

  return (
    <div className="page-enter">
      <Header
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋`}
        subtitle={business.name}
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Date strip */}
        <p className="text-xs text-gray-400 font-medium">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>

        {/* Today's Summary Cards */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today&apos;s Attendance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Present',    value: presentToday, color: 'text-success', bg: 'bg-green-50',  icon: '✅' },
              { label: 'Absent',     value: absentToday,  color: 'text-danger',  bg: 'bg-red-50',    icon: '❌' },
              { label: 'Half Day',   value: halfToday,    color: 'text-warning', bg: 'bg-amber-50',  icon: '⏰' },
              { label: 'Not Marked', value: notMarked,    color: 'text-gray-500',bg: 'bg-gray-50',   icon: '❓' },
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} className={`card ${bg} border-0`}>
                <div className="text-xl mb-1">{icon}</div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Payroll Estimate */}
        <div className="card bg-gradient-to-r from-brand-blue to-brand-blue-light text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Monthly Payroll Estimate</p>
              <p className="text-3xl font-bold mt-1">₹{payrollEstimate.toLocaleString('en-IN')}</p>
              <p className="text-blue-200 text-xs mt-1">{format(new Date(), 'MMMM yyyy')} · {activeStaff.length} staff</p>
            </div>
            <TrendingUp size={40} className="text-blue-300 opacity-60" />
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/attendance', icon: CalendarDays, label: 'Mark Attendance', color: 'bg-green-50 text-success' },
              { href: '/staff/new',  icon: UserPlus,    label: 'Add Staff',        color: 'bg-blue-50 text-brand-blue' },
              { href: '/salary',     icon: DollarSign,  label: 'Calculate Salary', color: 'bg-purple-50 text-purple-600' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}>
                <div className={`card ${color} border-0 text-center py-4 hover:shadow-md active:scale-95 transition-all duration-150 cursor-pointer`}>
                  <Icon size={24} className="mx-auto mb-2" />
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Pending Payments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pending Payments</h2>
            <Link href="/salary" className="text-xs text-brand-blue font-medium">View All →</Link>
          </div>

          {salaryRecords.length === 0 ? (
            <div className="card text-center py-6">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <IndianRupee size={20} className="text-success" />
              </div>
              <p className="text-sm font-medium text-gray-600">All staff paid for {format(new Date(), 'MMMM')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(salaryRecords as unknown as { id: string; final_salary: number; staff: { name: string; role: string } }[]).map((rec) => (
                <div key={rec.id} className="card flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={18} className="text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{rec.staff.name}</p>
                    <p className="text-xs text-gray-400">{rec.staff.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{rec.final_salary.toLocaleString('en-IN')}</p>
                    <Link href="/salary" className="text-xs text-brand-blue font-medium">Pay →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Staff count footer */}
        <div className="card flex items-center gap-3 bg-gray-50 border-0">
          <Users size={18} className="text-gray-400" />
          <p className="text-sm text-gray-500">
            <strong className="text-gray-800">{activeStaff.length}</strong> active staff ·{' '}
            <span className="capitalize">{business.plan}</span> plan
          </p>
          {business.plan === 'free' && (
            <Link href="/settings" className="ml-auto text-xs text-brand-blue font-medium">Upgrade →</Link>
          )}
        </div>

        {/* Bottom padding for mobile nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}
