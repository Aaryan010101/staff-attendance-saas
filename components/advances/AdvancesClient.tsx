'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Header } from '@/components/ui/Header';
import {
  Wallet, Plus, X, Loader2, Trash2, CheckCircle2, Clock,
  ChevronDown,
} from 'lucide-react';
import type { Staff } from '@/types/database';

interface Advance {
  id: string;
  staff_id: string;
  amount: number;
  given_date: string;
  month_to_deduct: string;
  is_deducted: boolean;
  staff: { name: string; role: string };
}

interface AdvancesClientProps {
  initialAdvances: Advance[];
  initialStaff: Staff[];
}

const currentMonth = format(new Date(), 'yyyy-MM');

export function AdvancesClient({ initialAdvances, initialStaff }: AdvancesClientProps) {
  const [advances, setAdvances] = useState<Advance[]>(initialAdvances);
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');

  const [form, setForm] = useState({
    staff_id: '',
    amount: '',
    given_date: format(new Date(), 'yyyy-MM-dd'),
    month_to_deduct: currentMonth,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/advances${filterMonth ? `?month=${filterMonth}` : ''}`);
      const { advances: adv } = await res.json();
      setAdvances(adv ?? []);
    } catch {
      toast.error('Failed to load advances');
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    if (filterMonth) fetchData();
    else if (!initialAdvances.length && !advances.length) fetchData();
  }, [filterMonth, fetchData, initialAdvances.length, advances.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staff_id) return toast.error('Select a staff member');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');

    setSaving(true);
    try {
      const res = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Advance recorded successfully');
      setShowForm(false);
      setForm({ staff_id: '', amount: '', given_date: format(new Date(), 'yyyy-MM-dd'), month_to_deduct: currentMonth });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this advance record?')) return;
    try {
      const res = await fetch(`/api/advances/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Advance deleted');
      setAdvances((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error('Failed to delete advance');
    }
  };

  const handleToggleDeduct = async (adv: Advance) => {
    try {
      const res = await fetch(`/api/advances/${adv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_deducted: !adv.is_deducted }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(adv.is_deducted ? 'Marked as pending' : 'Marked as deducted');
      fetchData();
    } catch {
      toast.error('Failed to update advance');
    }
  };

  const totalPending = advances
    .filter((a) => !a.is_deducted)
    .reduce((sum, a) => sum + a.amount, 0);

  const totalDeducted = advances
    .filter((a) => a.is_deducted)
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="page-enter">
      <Header
        title="Advances"
        subtitle="Track advance payments"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Advance
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="card bg-amber-50 border-0">
            <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
            <p className="text-xs text-amber-500 mt-0.5">{advances.filter((a) => !a.is_deducted).length} advances</p>
          </div>
          <div className="card bg-green-50 border-0">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Deducted</p>
            <p className="text-2xl font-bold text-green-700 mt-1">₹{totalDeducted.toLocaleString('en-IN')}</p>
            <p className="text-xs text-green-500 mt-0.5">{advances.filter((a) => a.is_deducted).length} advances</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input-field pr-8"
              placeholder="Filter by month"
            />
          </div>
          {filterMonth && (
            <button
              onClick={() => setFilterMonth('')}
              className="text-xs text-gray-500 hover:text-danger flex items-center gap-1 transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {showForm && (
          <div className="card border-2 border-brand-blue/20 bg-blue-50/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Wallet size={18} className="text-brand-blue" /> New Advance
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Staff Member *</label>
                <div className="relative">
                  <select
                    value={form.staff_id}
                    onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                    className="input-field appearance-none pr-8"
                    required
                  >
                    <option value="">Select staff…</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Given Date *</label>
                  <input
                    type="date"
                    value={form.given_date}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setForm({ ...form, given_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Deduct from Month *</label>
                <input
                  type="month"
                  value={form.month_to_deduct}
                  onChange={(e) => setForm({ ...form, month_to_deduct: e.target.value })}
                  className="input-field"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">This amount will be deducted from this month&apos;s salary</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Plus size={16} /> Record Advance</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-blue mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Loading advances…</p>
          </div>
        ) : advances.length === 0 ? (
          <div className="card text-center py-14">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet size={26} className="text-amber-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No advances recorded</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
              {filterMonth ? `No advances for ${filterMonth}` : 'Record an advance to get started'}
            </p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">
                <Plus size={16} className="inline mr-1" /> Add First Advance
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {advances.map((adv) => (
              <div
                key={adv.id}
                className={`card flex items-center gap-3 transition-all ${adv.is_deducted ? 'opacity-70' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${adv.is_deducted ? 'bg-green-50' : 'bg-amber-50'}`}>
                  {adv.is_deducted
                    ? <CheckCircle2 size={20} className="text-success" />
                    : <Clock size={20} className="text-warning" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{adv.staff?.name}</p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{adv.staff?.role}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Given: {format(new Date(adv.given_date), 'd MMM yyyy')} · Deduct: <span className="font-medium text-gray-600">{adv.month_to_deduct}</span>
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-gray-900">₹{adv.amount.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => handleToggleDeduct(adv)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors ${
                        adv.is_deducted
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {adv.is_deducted ? 'Undo' : 'Deduct'}
                    </button>
                    {!adv.is_deducted && (
                      <button
                        onClick={() => handleDelete(adv.id)}
                        className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={12} className="text-danger" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
