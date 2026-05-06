'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Header } from '@/components/ui/Header';
import {
  Calculator, Loader2, CheckCircle2,
  RefreshCw, FileText, MessageCircle,
  Edit3, Check, X,
} from 'lucide-react';

interface SalaryRecord {
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
  staff: {
    name: string;
    role: string;
    phone: string;
    salary_type: 'monthly' | 'daily';
    monthly_salary: number | null;
    daily_wage: number | null;
  };
}

interface SalaryClientProps {
  initialRecords: SalaryRecord[];
  initialMonth: string;
}

export function SalaryClient({ initialRecords, initialMonth }: SalaryClientProps) {
  const [month, setMonth] = useState(initialMonth);
  const [records, setRecords] = useState<SalaryRecord[]>(initialRecords);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ overtime_amount: 0, bonus: 0 });
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    // Only fetch if month changed from what was initially loaded
    // Since we have initialRecords, we don't need to fetch on the first render for initialMonth
    setLoading(true);
    try {
      const res = await fetch(`/api/salary?month=${month}`);
      const { records: recs } = await res.json();
      setRecords(recs ?? []);
    } catch {
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  }, [month]);

  const isInitialMount = useRef(true);

  useEffect(() => { 
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchRecords(); 
  }, [month, fetchRecords]);

  const handleCalculateAll = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const { records: recs } = await res.json();
      setRecords(recs ?? []);
      toast.success(`Salary calculated for ${format(new Date(month + '-01'), 'MMMM yyyy')}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleMarkPaid = async (record: SalaryRecord) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/salary/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_paid: true,
          paid_date: today,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setRecords((prev) =>
        prev.map((r) => r.id === record.id ? { ...r, is_paid: true, paid_date: today } : r)
      );
      toast.success(`${record.staff.name} marked as paid ✓`);
    } catch {
      toast.error('Failed to mark as paid');
    }
  };

  const handleSaveEdits = async (id: string) => {
    try {
      const res = await fetch(`/api/salary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) throw new Error('Failed to save');
      const { record } = await res.json();
      setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ...record } : r));
      setEditingId(null);
      toast.success('Updated successfully');
    } catch {
      toast.error('Failed to save changes');
    }
  };

  const handleGeneratePdf = async (record: SalaryRecord) => {
    setGeneratingPdf(record.id);
    try {
      const res = await fetch('/api/salary/slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: record.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const { slip_url } = await res.json();
      setRecords((prev) =>
        prev.map((r) => r.id === record.id ? { ...r, slip_url } : r)
      );
      window.open(slip_url, '_blank');
      toast.success('Salary slip generated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleWhatsApp = (record: SalaryRecord) => {
    if (!record.staff.phone) return toast.error('No phone number on record');
    if (!record.slip_url) return toast.error('Generate salary slip first');
    const phone = record.staff.phone.replace(/\D/g, '');
    const monthLabel = format(new Date(month + '-01'), 'MMMM yyyy');
    const msg = `Your salary slip for ${monthLabel}: ${record.slip_url}`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const totalPayroll = records.reduce((sum, r) => sum + r.final_salary, 0);
  const paidCount = records.filter((r) => r.is_paid).length;

  return (
    <div className="page-enter">
      <Header title="Salary" subtitle="Calculate & pay monthly salaries" />

      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
        {/* Month Selector + Calculate Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={handleCalculateAll}
            disabled={calculating}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {calculating
              ? <><Loader2 size={16} className="animate-spin" /> Calculating…</>
              : <><Calculator size={16} /> Calculate All</>
            }
          </button>
        </div>

        {/* Summary Bar */}
        {records.length > 0 && (
          <div className="card bg-gradient-to-r from-brand-blue to-brand-blue-light text-white border-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-blue-200 text-xs font-medium">Total Payroll — {format(new Date(month + '-01'), 'MMMM yyyy')}</p>
                <p className="text-3xl font-bold mt-0.5">₹{totalPayroll.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs">{paidCount} / {records.length} paid</p>
                <div className="mt-1 h-2 w-32 bg-blue-800/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${records.length ? (paidCount / records.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && (
          <div className="card text-center py-14">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calculator size={26} className="text-purple-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No salary records for {format(new Date(month + '-01'), 'MMMM yyyy')}</h3>
            <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
              Click <strong>Calculate All</strong> to auto-compute salaries based on attendance and advances.
            </p>
            <button
              onClick={handleCalculateAll}
              disabled={calculating}
              className="btn-primary mt-4 mx-auto flex items-center gap-2"
            >
              {calculating ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
              Calculate Salaries
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-blue mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Loading salary data…</p>
          </div>
        )}

        {/* Salary Table / Cards */}
        {!loading && records.length > 0 && (
          <div className="space-y-3">
            {records.map((record) => {
              const isEditing = editingId === record.id;
              const initials = record.staff.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

              return (
                <div
                  key={record.id}
                  className={`card transition-all duration-200 ${record.is_paid ? 'border-green-200 bg-green-50/30' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">{record.staff.name}</p>
                        {record.is_paid
                          ? <span className="badge-present text-xs">✓ Paid</span>
                          : <span className="badge-absent text-xs">Unpaid</span>
                        }
                      </div>
                      <p className="text-xs text-gray-400">{record.staff.role}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">₹{record.final_salary.toLocaleString('en-IN')}</p>
                      {record.paid_date && (
                        <p className="text-[10px] text-green-600">Paid {format(new Date(record.paid_date), 'd MMM')}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-gray-50 rounded-xl p-2.5 mb-3">
                    {[
                      { label: 'Working Days', value: record.total_days },
                      { label: 'Present Days', value: record.present_days },
                      { label: 'Base Pay', value: `₹${record.base_salary.toLocaleString('en-IN')}` },
                      { label: 'Overtime', value: isEditing ? null : `₹${record.overtime_amount.toLocaleString('en-IN')}` },
                      { label: 'Bonus', value: isEditing ? null : `₹${record.bonus.toLocaleString('en-IN')}` },
                      { label: 'Advance Deduct', value: `-₹${record.advance_deduction.toLocaleString('en-IN')}`, className: record.advance_deduction > 0 ? 'text-danger' : '' },
                    ].map(({ label, value, className }) => (
                      <div key={label} className="text-center">
                        <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
                        {value !== null && (
                          <p className={`text-xs font-semibold text-gray-700 mt-0.5 ${className ?? ''}`}>{value}</p>
                        )}
                      </div>
                    ))}

                    {isEditing && (
                      <>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400">Overtime</p>
                          <input
                            type="number"
                            min="0"
                            value={editValues.overtime_amount}
                            onChange={(e) => setEditValues((v) => ({ ...v, overtime_amount: Number(e.target.value) }))}
                            className="w-full text-center text-xs border border-brand-blue/40 rounded-lg px-1 py-0.5 mt-0.5 bg-white"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400">Bonus</p>
                          <input
                            type="number"
                            min="0"
                            value={editValues.bonus}
                            onChange={(e) => setEditValues((v) => ({ ...v, bonus: Number(e.target.value) }))}
                            className="w-full text-center text-xs border border-brand-blue/40 rounded-lg px-1 py-0.5 mt-0.5 bg-white"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {!record.is_paid && (
                      <>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdits(record.id)}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                            >
                              <Check size={13} /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                            >
                              <X size={13} /> Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(record.id);
                              setEditValues({ overtime_amount: record.overtime_amount, bonus: record.bonus });
                            }}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                        )}

                        <button
                          onClick={() => handleMarkPaid(record)}
                          className="text-xs py-1.5 px-3 bg-success text-white rounded-xl font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                        >
                          <CheckCircle2 size={13} /> Mark Paid
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleGeneratePdf(record)}
                      disabled={generatingPdf === record.id}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto"
                    >
                      {generatingPdf === record.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <FileText size={13} />
                      }
                      {record.slip_url ? 'View Slip' : 'Generate Slip'}
                    </button>

                    {record.slip_url && (
                      <button
                        onClick={() => handleWhatsApp(record)}
                        className="text-xs py-1.5 px-3 bg-green-500 text-white rounded-xl font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {records.length > 0 && (
          <button
            onClick={handleCalculateAll}
            disabled={calculating}
            className="text-xs text-gray-400 flex items-center gap-1.5 mx-auto hover:text-brand-blue transition-colors"
          >
            <RefreshCw size={11} /> Recalculate all salaries for {format(new Date(month + '-01'), 'MMMM yyyy')}
          </button>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
