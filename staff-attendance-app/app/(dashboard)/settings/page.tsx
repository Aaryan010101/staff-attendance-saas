'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserButton } from '@clerk/nextjs';
import {
  Building2, Crown, Check, Camera, Loader2,
  Save, X, Pencil, ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/ui/Header';
import Image from 'next/image';

interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  plan: 'free' | 'basic' | 'pro';
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['Up to 5 staff', 'Daily attendance', 'Basic dashboard', 'Staff profiles'],
    cta: 'Current Plan',
    color: 'gray',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹599',
    period: '/month',
    features: ['Up to 15 staff', 'PDF salary slips', 'WhatsApp share', 'Advance tracking'],
    cta: 'Upgrade to Basic',
    color: 'blue',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹1,299',
    period: '/month',
    features: ['Unlimited staff', 'Excel export', 'Multiple branches', 'Priority support'],
    cta: 'Upgrade to Pro',
    color: 'purple',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetch('/api/business')
      .then((r) => r.json())
      .then(({ business: biz }) => {
        setBusiness(biz);
        setNameValue(biz?.name ?? '');
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveName = async () => {
    if (!nameValue.trim()) return toast.error('Business name cannot be empty');
    setSavingName(true);
    try {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const { business: updated } = await res.json();
      setBusiness(updated);
      setEditingName(false);
      toast.success('Business name updated ✓');
      router.refresh();
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Image must be under 2MB');
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/business/logo', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const { logo_url } = await res.json();
      setBusiness((prev) => prev ? { ...prev, logo_url } : prev);
      toast.success('Logo updated ✓');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="page-enter">
        <Header title="Settings" subtitle="Account & billing" />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-blue" />
        </div>
      </div>
    );
  }

  const planBadgeClass =
    business?.plan === 'pro' ? 'bg-purple-100 text-purple-700' :
    business?.plan === 'basic' ? 'bg-blue-100 text-brand-blue' :
    'bg-gray-100 text-gray-600';

  return (
    <div className="page-enter">
      <Header title="Settings" subtitle="Account & billing" />

      <div className="p-4 lg:p-6 space-y-5 max-w-xl mx-auto">

        {/* ── Account ────────────────────────────────── */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{ elements: { avatarBox: 'w-12 h-12 rounded-xl' } }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Clerk Account</p>
              <p className="text-xs text-gray-400">Manage profile, email & password</p>
            </div>
          </div>
        </div>

        {/* ── Business Info ───────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={18} className="text-brand-blue" /> Business
          </h2>

          {/* Logo Upload */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              {business?.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt="Business logo"
                  fill
                  className="rounded-2xl object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center text-white font-bold text-2xl">
                  {business?.name?.charAt(0)?.toUpperCase() ?? 'B'}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-md hover:opacity-90 transition-opacity"
              >
                {uploadingLogo
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Camera size={14} />
                }
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Business Logo</p>
              <p className="text-xs text-gray-500">JPG, PNG, WebP · Max 2MB</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs text-brand-blue font-medium hover:underline flex items-center gap-1"
              >
                <Camera size={12} /> {business?.logo_url ? 'Change logo' : 'Upload logo'}
              </button>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Business Name</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="input-field flex-1 text-sm font-semibold"
                  autoFocus
                  placeholder="Your business name"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="w-9 h-9 bg-success text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  {savingName ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameValue(business?.name ?? ''); }}
                  className="w-9 h-9 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-gray-900 flex-1">{business?.name}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="w-8 h-8 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Current Plan Badge */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Current Plan</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${planBadgeClass}`}>
              {business?.plan === 'pro' && <Crown size={13} />}
              {business?.plan?.charAt(0).toUpperCase()}{business?.plan?.slice(1)} Plan
            </span>
          </div>
        </div>

        {/* ── Subscription Plans ──────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Subscription Plans</h2>
          <div className="space-y-3">
            {PLANS.map((plan) => {
              const isCurrent = business?.plan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`card transition-all duration-200 ${
                    plan.highlight ? 'border-2 border-brand-blue shadow-md' : ''
                  } ${isCurrent ? 'bg-blue-50/50 border-brand-blue/20' : ''}`}
                >
                  {plan.highlight && (
                    <div className="text-xs font-bold text-brand-blue bg-blue-100 inline-block px-2.5 py-0.5 rounded-full mb-2">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xl font-bold text-brand-blue mt-0.5">
                        {plan.price}
                        <span className="text-sm font-normal text-gray-400">{plan.period}</span>
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="badge-present text-xs mt-1">✓ Active</span>
                    ) : (
                      <button
                        onClick={() => toast('Razorpay integration coming soon!', { icon: '💳' })}
                        className="btn-primary text-xs py-2 px-3 mt-1 flex items-center gap-1.5"
                      >
                        {plan.cta} <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check size={14} className="text-success flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            14-day free trial on all plans · No credit card required
          </p>
        </div>

        {/* ── Danger Zone ─────────────────────────────── */}
        <div className="card border-red-100">
          <h2 className="font-semibold text-red-600 mb-3">Danger Zone</h2>
          <p className="text-xs text-gray-500 mb-3">
            Contact support to delete your account and all associated data.
          </p>
          <a
            href="mailto:support@staffattendance.app?subject=Account Deletion Request"
            className="text-xs text-danger font-medium hover:underline flex items-center gap-1"
          >
            <ExternalLink size={13} /> Request account deletion
          </a>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
