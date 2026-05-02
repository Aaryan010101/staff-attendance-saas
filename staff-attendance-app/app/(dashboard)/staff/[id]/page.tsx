import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Header } from '@/components/ui/Header';
import {
  Phone, Calendar, IndianRupee, Pencil,
  CheckCircle2, XCircle, Clock, Minus,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { Attendance } from '@/types/database';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, { bg: string; label: string; icon: React.ReactNode }> = {
  present:  { bg: 'bg-success',  label: 'P',  icon: <CheckCircle2 size={12} /> },
  absent:   { bg: 'bg-danger',   label: 'A',  icon: <XCircle size={12} /> },
  half_day: { bg: 'bg-warning',  label: 'H',  icon: <Clock size={12} /> },
  holiday:  { bg: 'bg-gray-400', label: 'Ho', icon: <Minus size={12} /> },
};

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;

  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('*, businesses!inner(owner_id, name)')
    .eq('id', id)
    .single();

  if (!staff) notFound();
  const biz = staff.businesses as unknown as { owner_id: string; name: string };
  if (biz.owner_id !== userId) notFound();

  // Fetch this month's attendance
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: attendanceRaw } = await supabaseAdmin
    .from('attendance')
    .select('*')
    .eq('staff_id', id)
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'));

  const attendanceMap = new Map<string, Attendance['status']>(
    (attendanceRaw ?? []).map((a: Attendance) => [a.date, a.status])
  );

  // Calendar days
  const days = eachDayOfInterval({ start: monthStart, end: today });
  const presentDays = (attendanceRaw ?? []).reduce((acc: number, a: Attendance) => {
    return acc + (a.status === 'present' ? 1 : a.status === 'half_day' ? 0.5 : 0);
  }, 0);

  // Fetch pending advances
  const { data: advances } = await supabaseAdmin
    .from('advances')
    .select('*')
    .eq('staff_id', id)
    .order('given_date', { ascending: false });

  // Salary history
  const { data: salaryHistory } = await supabaseAdmin
    .from('salary_records')
    .select('*')
    .eq('staff_id', id)
    .order('month', { ascending: false })
    .limit(6);

  const salary = staff.salary_type === 'monthly'
    ? `₹${(staff.monthly_salary ?? 0).toLocaleString('en-IN')}/mo`
    : `₹${(staff.daily_wage ?? 0).toLocaleString('en-IN')}/day`;

  const initials = staff.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="page-enter">
      <Header
        title="Staff Profile"
        action={
          <Link href={`/staff/${id}/edit`}>
            <button className="btn-primary text-sm py-2 px-3 flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </button>
          </Link>
        }
      />

      <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center text-white font-bold text-xl shadow-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{staff.name}</h2>
              {staff.is_active
                ? <span className="badge-active">Active</span>
                : <span className="badge-inactive">Resigned</span>}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{staff.role}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
              {staff.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {staff.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Joined {format(new Date(staff.joining_date), 'd MMM yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <IndianRupee size={12} /> {salary}
              </span>
            </div>
          </div>
        </div>

        {/* This Month Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Present', value: presentDays, color: 'text-success' },
            { label: 'Absent', value: (attendanceRaw ?? []).filter((a: Attendance) => a.status === 'absent').length, color: 'text-danger' },
            { label: 'Half Day', value: (attendanceRaw ?? []).filter((a: Attendance) => a.status === 'half_day').length, color: 'text-warning' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Attendance Calendar */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">
            {format(today, 'MMMM yyyy')} Attendance
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
            ))}
            {/* Offset for month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={i} />)}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const status = attendanceMap.get(dateStr);
              const isToday = dateStr === format(today, 'yyyy-MM-dd');
              const styleMap: Record<string, string> = {
                present: 'bg-success text-white',
                absent: 'bg-danger text-white',
                half_day: 'bg-warning text-white',
                holiday: 'bg-gray-300 text-gray-600',
              };
              return (
                <div
                  key={dateStr}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all
                    ${status ? styleMap[status] : 'bg-gray-50 text-gray-300'}
                    ${isToday ? 'ring-2 ring-brand-blue ring-offset-1' : ''}
                  `}
                  title={`${format(day, 'd MMM')} - ${status ?? 'not marked'}`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-500 flex-wrap">
            {Object.entries(STATUS_STYLE).map(([key, { bg, label }]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded ${bg} inline-block`} />
                {label === 'P' ? 'Present' : label === 'A' ? 'Absent' : label === 'H' ? 'Half Day' : 'Holiday'}
              </span>
            ))}
          </div>
        </div>

        {/* Advance History */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Advance History</h3>
            <Link href="/advances" className="text-xs text-brand-blue font-medium">Manage →</Link>
          </div>
          {(advances ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No advances recorded</p>
          ) : (
            <div className="space-y-2">
              {(advances ?? []).map((adv: { id: string; amount: number; given_date: string; month_to_deduct: string; is_deducted: boolean }) => (
                <div key={adv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">₹{adv.amount.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-gray-400">{format(new Date(adv.given_date), 'd MMM yyyy')} · Deduct: {adv.month_to_deduct}</p>
                  </div>
                  <span className={adv.is_deducted ? 'badge-inactive' : 'badge-absent'}>
                    {adv.is_deducted ? '✓ Deducted' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Salary History */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Salary History</h3>
            <Link href="/salary" className="text-xs text-brand-blue font-medium">Calculate →</Link>
          </div>
          {(salaryHistory ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No salary records yet</p>
          ) : (
            <div className="space-y-2">
              {(salaryHistory ?? []).map((rec: { id: string; month: string; final_salary: number; is_paid: boolean; paid_date: string | null }) => (
                <div key={rec.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{rec.month}</p>
                    {rec.paid_date && <p className="text-[11px] text-gray-400">Paid on {format(new Date(rec.paid_date), 'd MMM yyyy')}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{rec.final_salary.toLocaleString('en-IN')}</p>
                    <span className={rec.is_paid ? 'badge-present' : 'badge-absent'}>
                      {rec.is_paid ? '✓ Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
