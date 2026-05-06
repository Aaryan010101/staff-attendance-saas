'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Save, CheckCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/ui/Header';
import type { Staff, AttendanceStatus } from '@/types/database';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; activeColor: string }[] = [
  { value: 'present',  label: 'P',    color: 'bg-gray-100 text-gray-500', activeColor: 'bg-success text-white' },
  { value: 'absent',   label: 'A',    color: 'bg-gray-100 text-gray-500', activeColor: 'bg-danger text-white' },
  { value: 'half_day', label: '½',    color: 'bg-gray-100 text-gray-500', activeColor: 'bg-warning text-white' },
  { value: 'holiday',  label: 'Ho',   color: 'bg-gray-100 text-gray-500', activeColor: 'bg-gray-400 text-white' },
];

interface AttendanceRecord {
  staff_id: string;
  date: string;
  status: AttendanceStatus;
}

interface AttendanceClientProps {
  initialStaff: Staff[];
  initialAttendance: AttendanceRecord[];
  initialDate: string;
}

export function AttendanceClient({ initialStaff, initialAttendance, initialDate }: AttendanceClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff);
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(() => {
    const map = new Map<string, AttendanceStatus>();
    initialAttendance.forEach((a) => map.set(a.staff_id, a.status));
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch attendance whenever date changes
  useEffect(() => {
    if (selectedDate === initialDate && staffList === initialStaff) return;
    
    setLoading(true);
    fetch(`/api/attendance?date=${selectedDate}`)
      .then((r) => r.json())
      .then(({ attendance: att }) => {
        const map = new Map<string, AttendanceStatus>();
        (att ?? []).forEach((a: AttendanceRecord) => map.set(a.staff_id, a.status));
        setAttendance(map);
      })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [selectedDate, initialDate, initialStaff, staffList]);

  const setStatus = (staffId: string, status: AttendanceStatus) => {
    setAttendance((prev) => new Map(prev).set(staffId, status));
  };

  const markAllPresent = () => {
    const map = new Map<string, AttendanceStatus>();
    staffList.forEach((s) => map.set(s.id, 'present'));
    setAttendance(map);
    toast.success('All marked as Present');
  };

  const handleSave = async () => {
    const records = staffList.map((s) => ({
      staff_id: s.id,
      date: selectedDate,
      status: attendance.get(s.id) ?? 'absent',
    }));

    setSaving(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(`Attendance saved for ${format(new Date(selectedDate), 'd MMM yyyy')} ✓`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const presentCount = Array.from(attendance.values()).filter((v) => v === 'present').length;
  const absentCount = Array.from(attendance.values()).filter((v) => v === 'absent').length;
  const halfCount = Array.from(attendance.values()).filter((v) => v === 'half_day').length;

  return (
    <div className="page-enter">
      <Header title="Attendance" subtitle="Mark daily attendance" />

      <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
        {/* Date Picker */}
        <div className="card">
          <div className="flex items-center gap-3">
            <button onClick={() => changeDate(-1)} className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex-1 text-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="input-field text-center font-semibold text-gray-900 cursor-pointer"
              />
            </div>
            <button
              onClick={() => changeDate(1)}
              disabled={selectedDate >= format(new Date(), 'yyyy-MM-dd')}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Summary chips */}
          {!loading && staffList.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="badge-present">✓ {presentCount} Present</span>
              <span className="badge-absent">✗ {absentCount} Absent</span>
              {halfCount > 0 && <span className="badge-halfday">½ {halfCount} Half</span>}
              <span className="text-xs text-gray-400 self-center">
                {staffList.length - attendance.size} not marked
              </span>
            </div>
          )}
        </div>

        {/* Bulk Action */}
        {!loading && staffList.length > 0 && (
          <button
            onClick={markAllPresent}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <CheckCheck size={18} /> Mark All Present
          </button>
        )}

        {/* Staff Rows */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-blue mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Loading staff…</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-500 font-medium">No active staff found</p>
            <p className="text-sm text-gray-400 mt-1">Add staff first to mark attendance</p>
          </div>
        ) : (
          <div className="card space-y-0 divide-y divide-gray-50">
            {staffList.map((s) => {
              const current = attendance.get(s.id);
              const initials = s.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <p className="text-[11px] text-gray-400">{s.role}</p>
                  </div>
                  {/* Status Buttons */}
                  <div className="flex gap-1.5">
                    {STATUS_OPTIONS.map(({ value, label, color, activeColor }) => (
                      <button
                        key={value}
                        onClick={() => setStatus(s.id, value)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all duration-150 ${
                          current === value ? activeColor : color
                        } hover:opacity-80 active:scale-95`}
                        title={value.replace('_', ' ')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Save Button */}
        {!loading && staffList.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4 sticky bottom-24 lg:bottom-6 shadow-lg"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <><Save size={18} /> Save Attendance</>}
          </button>
        )}
      </div>
    </div>
  );
}
