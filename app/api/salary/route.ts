import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getBusinessForUser, getBusinessContext } from '@/lib/supabase/queries';
import {
  getDay,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

// ─── Salary Calculation Helper ─────────────────────────────────────────────────
// Formula: (BaseSalary / TotalWorkingDays) × PresentDays + Overtime + Bonus - AdvanceDeduction
// TotalWorkingDays = CalendarDays - Sundays - Holidays
// HalfDay = 0.5 present days
// Daily workers: DailyWage × PresentDays

function calculateSalary({
  staff,
  attendanceRecords,
  advances,
  month,
  overtimeAmount = 0,
  bonus = 0,
}: {
  staff: {
    salary_type: 'monthly' | 'daily';
    monthly_salary: number | null;
    daily_wage: number | null;
  };
  attendanceRecords: Array<{ date: string; status: string }>;
  advances: Array<{ amount: number }>;
  month: string; // YYYY-MM
  overtimeAmount?: number;
  bonus?: number;
}) {
  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, monthNum - 1));
  const monthEnd = endOfMonth(new Date(year, monthNum - 1));

  // All days in month
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Count holiday-status days from attendance
  const holidayDates = new Set(
    attendanceRecords
      .filter((a) => a.status === 'holiday')
      .map((a) => a.date)
  );

  // Total working days = all days - Sundays - marked holidays
  const totalWorkingDays = allDays.filter((d) => {
    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return getDay(d) !== 0 && !holidayDates.has(dayStr); // 0 = Sunday
  }).length;

  // Present days calculation
  let presentDays = 0;
  for (const rec of attendanceRecords) {
    if (rec.status === 'present') presentDays += 1;
    else if (rec.status === 'half_day') presentDays += 0.5;
  }

  // Advance deduction total
  const advanceDeduction = advances.reduce((sum, adv) => sum + adv.amount, 0);

  let baseSalary = 0;
  let finalSalary = 0;

  if (staff.salary_type === 'monthly') {
    baseSalary = staff.monthly_salary ?? 0;
    const perDaySalary = totalWorkingDays > 0 ? baseSalary / totalWorkingDays : 0;
    finalSalary = perDaySalary * presentDays + overtimeAmount + bonus - advanceDeduction;
  } else {
    // Daily wage worker
    baseSalary = (staff.daily_wage ?? 0) * presentDays;
    finalSalary = baseSalary + overtimeAmount + bonus - advanceDeduction;
  }

  finalSalary = Math.max(0, Math.round(finalSalary * 100) / 100);

  return {
    total_days: totalWorkingDays,
    present_days: presentDays,
    base_salary: baseSalary,
    advance_deduction: advanceDeduction,
    overtime_amount: overtimeAmount,
    bonus,
    final_salary: finalSalary,
  };
}

// GET — fetch salary records for a month
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const month = searchParams.get('month');

  const ctx = await getBusinessContext(userId);
  if (!ctx) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { staffIds } = ctx;
  if (staffIds.length === 0) return NextResponse.json({ records: [] });

  let query = supabaseAdmin
    .from('salary_records')
    .select('*, staff(name, role, phone, salary_type, monthly_salary, daily_wage)')
    .in('staff_id', staffIds)
    .order('month', { ascending: false });

  if (month) query = query.eq('month', month);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ records: data });
}

// POST — calculate & upsert salary records for a month
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { month, staff_ids } = body as { month: string; staff_ids?: string[] };

  if (!month) return NextResponse.json({ error: 'month is required (YYYY-MM)' }, { status: 400 });

  const business = await getBusinessForUser(userId);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  // Fetch all active staff (or specific ones)
  let staffQuery = supabaseAdmin
    .from('staff')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true);

  if (staff_ids?.length) staffQuery = staffQuery.in('id', staff_ids);

  const { data: staffList } = await staffQuery;
  if (!staffList?.length) return NextResponse.json({ error: 'No active staff found' }, { status: 404 });

  const staffIds = staffList.map((s) => s.id);

  // Fetch attendance for the month
  const { data: allAttendance } = await supabaseAdmin
    .from('attendance')
    .select('staff_id, date, status')
    .in('staff_id', staffIds)
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`);

  // Fetch pending advances for the month
  const { data: allAdvances } = await supabaseAdmin
    .from('advances')
    .select('staff_id, amount, is_deducted')
    .in('staff_id', staffIds)
    .eq('month_to_deduct', month)
    .eq('is_deducted', false);

  // Get existing salary records (to preserve overtime/bonus overrides)
  const { data: existingRecords } = await supabaseAdmin
    .from('salary_records')
    .select('staff_id, overtime_amount, bonus')
    .in('staff_id', staffIds)
    .eq('month', month);

  const existingMap = new Map(
    (existingRecords ?? []).map((r) => [r.staff_id, r])
  );

  // Calculate salary for each staff member
  const upsertData = staffList.map((staff) => {
    const staffAttendance = (allAttendance ?? []).filter((a) => a.staff_id === staff.id);
    const staffAdvances = (allAdvances ?? []).filter((a) => a.staff_id === staff.id);
    const existing = existingMap.get(staff.id);

    const result = calculateSalary({
      staff,
      attendanceRecords: staffAttendance,
      advances: staffAdvances,
      month,
      overtimeAmount: existing?.overtime_amount ?? 0,
      bonus: existing?.bonus ?? 0,
    });

    return {
      staff_id: staff.id,
      month,
      ...result,
      is_paid: false, // don't override paid status
    };
  });

  const { data, error } = await supabaseAdmin
    .from('salary_records')
    .upsert(upsertData, { onConflict: 'staff_id,month', ignoreDuplicates: false })
    .select('*, staff(name, role, phone, salary_type, monthly_salary, daily_wage)');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ records: data });
}
