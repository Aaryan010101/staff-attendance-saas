'use client';

import Link from 'next/link';
import { Phone, Calendar, IndianRupee, ChevronRight } from 'lucide-react';
import type { Staff } from '@/types/database';
import { format } from 'date-fns';

interface StaffCardProps {
  staff: Staff;
}

const ROLE_COLORS: Record<string, string> = {
  Cashier:  'bg-purple-100 text-purple-700',
  Cook:     'bg-orange-100 text-orange-700',
  Helper:   'bg-blue-100 text-blue-700',
  Manager:  'bg-green-100 text-green-700',
  Waiter:   'bg-yellow-100 text-yellow-700',
  Stylist:  'bg-pink-100 text-pink-700',
  Cleaner:  'bg-gray-100 text-gray-600',
};

export function StaffCard({ staff }: StaffCardProps) {
  const roleColor = ROLE_COLORS[staff.role] ?? 'bg-indigo-100 text-indigo-700';
  const salary = staff.salary_type === 'monthly'
    ? `₹${(staff.monthly_salary ?? 0).toLocaleString('en-IN')}/mo`
    : `₹${(staff.daily_wage ?? 0).toLocaleString('en-IN')}/day`;

  const initials = staff.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link href={`/staff/${staff.id}`} className="block">
      <div className="card hover:shadow-md hover:border-brand-blue/20 transition-all duration-200 active:scale-[0.99]">
        <div className="flex items-center gap-3">
          {/* Avatar new value added  */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{staff.name}</h3>
              {!staff.is_active && (
                <span className="badge-inactive text-[10px] py-0.5">Resigned</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleColor}`}>
                {staff.role}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <IndianRupee size={11} />
                {salary}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
              {staff.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={10} />
                  {staff.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                Since {format(new Date(staff.joining_date), 'd MMM yyyy')}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
