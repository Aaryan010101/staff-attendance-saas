'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, UserX } from 'lucide-react';
import type { Staff } from '@/types/database';

const ROLES = ['Cashier', 'Cook', 'Helper', 'Manager', 'Waiter', 'Stylist', 'Cleaner', 'Driver', 'Guard', 'Other'];

interface StaffFormProps {
  initialData?: Partial<Staff>;
  isEdit?: boolean;
}

export function StaffForm({ initialData, isEdit = false }: StaffFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [form, setForm] = useState({
    name:           initialData?.name ?? '',
    phone:          initialData?.phone ?? '',
    role:           initialData?.role ?? 'Helper',
    salary_type:    (initialData?.salary_type ?? 'monthly') as 'monthly' | 'daily',
    monthly_salary: initialData?.monthly_salary?.toString() ?? '',
    daily_wage:     initialData?.daily_wage?.toString() ?? '',
    joining_date:   initialData?.joining_date ?? new Date().toISOString().split('T')[0],
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (form.salary_type === 'monthly' && !form.monthly_salary) return toast.error('Monthly salary is required');
    if (form.salary_type === 'daily' && !form.daily_wage) return toast.error('Daily wage is required');

    setLoading(true);
    try {
      const url = isEdit ? `/api/staff/${initialData?.id}` : '/api/staff';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');

      toast.success(isEdit ? 'Staff updated!' : 'Staff added!');
      router.push('/staff');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Mark ${initialData?.name} as resigned? They won't be deleted.`)) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/staff/${initialData?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) throw new Error('Failed to deactivate');
      toast.success(`${initialData?.name} marked as resigned`);
      router.push('/staff');
      router.refresh();
    } catch {
      toast.error('Failed to deactivate staff');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="label">Full Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Ravi Kumar"
          className="input-field"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label className="label">WhatsApp Number</label>
        <div className="flex">
          <span className="flex items-center px-3 bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl text-sm text-gray-500 font-medium">+91</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            className="input-field rounded-l-none"
            maxLength={10}
          />
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="label">Role *</label>
        <select
          value={form.role}
          onChange={(e) => set('role', e.target.value)}
          className="input-field"
          required
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Salary Type Toggle */}
      <div>
        <label className="label">Salary Type</label>
        <div className="flex gap-2">
          {(['monthly', 'daily'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set('salary_type', type)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-150 min-h-[44px] ${
                form.salary_type === type
                  ? 'border-brand-blue bg-brand-blue text-white shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {type === 'monthly' ? '📅 Monthly' : '📆 Daily'}
            </button>
          ))}
        </div>
      </div>

      {/* Salary Amount */}
      {form.salary_type === 'monthly' ? (
        <div>
          <label className="label">Monthly Salary (₹) *</label>
          <input
            type="number"
            value={form.monthly_salary}
            onChange={(e) => set('monthly_salary', e.target.value)}
            placeholder="e.g. 12000"
            className="input-field"
            min={0}
            required
          />
        </div>
      ) : (
        <div>
          <label className="label">Daily Wage (₹) *</label>
          <input
            type="number"
            value={form.daily_wage}
            onChange={(e) => set('daily_wage', e.target.value)}
            placeholder="e.g. 500"
            className="input-field"
            min={0}
            required
          />
        </div>
      )}

      {/* Joining Date */}
      <div>
        <label className="label">Joining Date *</label>
        <input
          type="date"
          value={form.joining_date}
          onChange={(e) => set('joining_date', e.target.value)}
          className="input-field"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : isEdit ? 'Update Staff' : 'Add Staff Member'}
        </button>

        {isEdit && initialData?.is_active && (
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={deactivating}
            className="btn-danger flex items-center justify-center gap-2"
          >
            {deactivating ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
            Mark as Resigned
          </button>
        )}

        <button type="button" onClick={() => router.back()} className="btn-ghost text-center">
          Cancel
        </button>
      </div>
    </form>
  );
}
