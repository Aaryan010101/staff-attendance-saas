'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  Settings,
} from 'lucide-react';
/* new value change */

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Home' },
  { href: '/staff',       icon: Users,           label: 'Staff' },
  { href: '/attendance',  icon: CalendarCheck,   label: 'Attend' },
  { href: '/salary',      icon: DollarSign,      label: 'Salary' },
  { href: '/settings',    icon: Settings,        label: 'Settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex items-stretch">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-150 ${
                isActive ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-brand-blue' : ''}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-blue rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
