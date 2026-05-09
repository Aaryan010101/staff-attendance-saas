'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Users, X } from 'lucide-react';
import { StaffCard } from '@/components/staff/StaffCard';
import type { Staff } from '@/types/database';

interface StaffListClientProps {
  active: Staff[];
  inactive: Staff[];
  plan: string;
  limit: number;
}

export function StaffListClient({ active, inactive, plan, limit }: StaffListClientProps) {
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();
  const filteredActive = q
    ? active.filter((s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
    : active;
  const filteredInactive = q
    ? inactive.filter((s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
    : inactive;

  const atLimit = active.length >= limit;
  const noResults = q && filteredActive.length === 0 && filteredInactive.length === 0;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      {(active.length + inactive.length) > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or role…"
            className="input-field pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <X size={11} className="text-gray-600" />
            </button>
          )}
        </div>
      )}

      {/* Plan limit warning */}
      {atLimit && !q && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-amber-800">
            You&apos;ve reached the <strong>{limit} staff limit</strong> on your {plan} plan.{' '}
            <Link href="/settings" className="font-semibold underline">Upgrade to add more →</Link>
          </p>
        </div>
      )}

      {/* Empty state — no staff at all */}
      {active.length === 0 && inactive.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-brand-blue" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No staff yet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-5">Add your first team member to get started</p>
          <Link href="/staff/new" className="btn-primary inline-flex items-center gap-2">
            <UserPlus size={16} /> Add First Staff
          </Link>
        </div>
      )}

      {/* No search results */}
      {noResults && (
        <div className="text-center py-10 card">
          <Search size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No results for &quot;{query}&quot;</p>
          <p className="text-xs text-gray-400 mt-1">Try a different name or role</p>
        </div>
      )}

      {/* Active Staff */}
      {filteredActive.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {q ? `Active — ${filteredActive.length} match${filteredActive.length !== 1 ? 'es' : ''}` : `Active Staff (${active.length}/${limit})`}
          </h2>
          <div className="space-y-2.5">
            {filteredActive.map((s) => <StaffCard key={s.id} staff={s} />)}
          </div>
        </section>
      )}

      {/* Resigned Staff */}
      {filteredInactive.length > 0 && (
        <section className="pt-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {q ? `Resigned — ${filteredInactive.length} match${filteredInactive.length !== 1 ? 'es' : ''}` : `Resigned (${inactive.length})`}
          </h2>
          <div className="space-y-2.5">
            {filteredInactive.map((s) => <StaffCard key={s.id} staff={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}
