'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  DollarSign,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/staff',       icon: Users,           label: 'Staff' },
  { href: '/attendance',  icon: CalendarCheck,   label: 'Attendance' },
  { href: '/advances',    icon: Wallet,          label: 'Advances' },
  { href: '/salary',      icon: DollarSign,      label: 'Salary' },
  { href: '/reports',     icon: BarChart3,       label: 'Reports' },
  { href: '/settings',    icon: Settings,        label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-brand-blue rounded-xl flex items-center justify-center text-lg shadow-sm">
          📋
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">StaffTrack</span>
          <p className="text-xs text-gray-400 -mt-0.5">Business Dashboard</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
                isActive
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">StaffTrack v1.0 • Phase 1</p>
      </div>
    </aside>
  );
}
