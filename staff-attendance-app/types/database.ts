// ─── Database Types ────────────────────────────────────────────────────────────

export type Plan = 'free' | 'basic' | 'pro';
export type SalaryType = 'monthly' | 'daily';
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'holiday';

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  plan: Plan;
  created_at: string;
}

export interface Staff {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  role: string;
  salary_type: SalaryType;
  monthly_salary: number | null;
  daily_wage: number | null;
  joining_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  staff_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
}

export interface Advance {
  id: string;
  staff_id: string;
  amount: number;
  given_date: string;
  month_to_deduct: string;
  is_deducted: boolean;
}

export interface SalaryRecord {
  id: string;
  staff_id: string;
  month: string;
  total_days: number;
  present_days: number;
  base_salary: number;
  advance_deduction: number;
  overtime_amount: number;
  bonus: number;
  final_salary: number;
  is_paid: boolean;
  paid_date: string | null;
  slip_url: string | null;
}

// ─── Extended / Joined Types ───────────────────────────────────────────────────

export interface StaffWithAttendance extends Staff {
  today_status?: AttendanceStatus | null;
}

export interface SalaryRecordWithStaff extends SalaryRecord {
  staff: Pick<Staff, 'name' | 'role' | 'phone'>;
}
