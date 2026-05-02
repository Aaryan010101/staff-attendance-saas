'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action && action}
        <button
          aria-label="Notifications"
          className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors relative"
        >
          <Bell size={18} className="text-gray-500" />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9 rounded-xl',
              userButtonPopoverCard: 'rounded-2xl shadow-xl',
            },
          }}
        />
      </div>
    </header>
  );
}
