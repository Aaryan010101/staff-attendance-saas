'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';

const BUSINESS_TYPES = [
  { emoji: '🍽️', label: 'Restaurant / Dhaba' },
  { emoji: '💇', label: 'Salon / Parlour' },
  { emoji: '🏪', label: 'Kirana Store' },
  { emoji: '🏥', label: 'Clinic / Pharmacy' },
  { emoji: '🏗️', label: 'Construction' },
  { emoji: '🏢', label: 'Other Business' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [businessName, setBusinessName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return toast.error('Please enter your business name');

    setLoading(true);
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create business');
      }

      toast.success('Business created! Welcome to StaffTrack 🎉');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue-dark to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 size={32} className="text-brand-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user?.firstName || 'there'}! 👋</h1>
          <p className="text-blue-200 mt-2 text-sm">Let&apos;s set up your business in under a minute.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="label">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sharma Ji Ka Dhaba"
                className="input-field text-base"
                maxLength={80}
                required
                autoFocus
              />
            </div>

            {/* Business Type (cosmetic only for now) */}
            <div>
              <label className="label">Business Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUSINESS_TYPES.map(({ emoji, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedType(label)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 min-h-[70px] ${
                      selectedType === label
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-100 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-center text-xs leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !businessName.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Setting up…</>
              ) : (
                <>Get Started <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200 text-xs mt-4">
          Free plan • 5 staff • No credit card needed
        </p>
      </div>
    </div>
  );
}
