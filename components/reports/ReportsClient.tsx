'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { Header } from '@/components/ui/Header';
import {
  BarChart3, Loader2, Download, FileSpreadsheet,
  Users, CalendarDays, IndianRupee,
} from 'lucide-react';

interface StaffReport {
  id: string;
  name: string;
  role: string;
  salary_type: 'monthly' | 'daily';
}

interface AttendanceRecord {
  staff_id: string;
  date: string;
  status: string;
}

interface SalaryRecord {
  staff_id: string;
  month: string;
  present_days: number;
  final_salary: number;
  is_paid: boolean;
}

interface ReportsClientProps {
  initialStaff: StaffReport[];
  initialAttendance: AttendanceRecord[];
  initialSalary: SalaryRecord[];
  initialMonth: string;
}

export function ReportsClient({ initialStaff, initialAttendance, initialSalary, initialMonth }: ReportsClientProps) {
  const [month, setMonth] = useState(initialMonth);
  const [staffList, setStaffList] = useState<StaffReport[]>(initialStaff);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(initialSalary);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, attRes, salRes] = await Promise.all([
        fetch('/api/staff?active=false'),
        fetch(`/api/attendance?month=${month}`),
        fetch(`/api/salary?month=${month}`),
      ]);
      const { staff } = await staffRes.json();
      const { attendance: att } = await attRes.json();
      const { records: sal } = await salRes.json();
      setStaffList(staff ?? []);
      setAttendance(att ?? []);
      setSalaryRecords(sal ?? []);
    } catch {
      toast.error('Failed to load report data');
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
    fetchData(); 
  }, [month, fetchData]);

  const monthStart = startOfMonth(new Date(month + '-01'));
  const monthEnd = endOfMonth(new Date(month + '-01'));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const attMap = new Map<string, Map<string, string>>();
  for (const rec of attendance) {
    if (!attMap.has(rec.staff_id)) attMap.set(rec.staff_id, new Map());
    attMap.get(rec.staff_id)!.set(rec.date, rec.status);
  }

  const salMap = new Map(salaryRecords.map((r) => [r.staff_id, r]));

  const getStatusSymbol = (status?: string) => {
    if (!status) return '';
    return { present: 'P', absent: 'A', half_day: '½', holiday: 'H' }[status] ?? '';
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-50 text-gray-300';
    return {
      present: 'bg-success text-white',
      absent: 'bg-danger text-white',
      half_day: 'bg-warning text-white',
      holiday: 'bg-gray-300 text-gray-600',
    }[status] ?? 'bg-gray-50 text-gray-300';
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const monthLabel = format(new Date(month + '-01'), 'MMMM yyyy');

      const headers = [
        'Staff Name',
        'Role',
        ...days.map((d) => format(d, 'd')),
        'Present Days',
        'Final Salary',
        'Status',
      ];

      const rows = staffList.map((s) => {
        const staffAtt = attMap.get(s.id) ?? new Map();
        const salRec = salMap.get(s.id);
        const dayStatuses = days.map((d) => {
          const ds = format(d, 'yyyy-MM-dd');
          const status = staffAtt.get(ds);
          return getStatusSymbol(status) || '-';
        });
        return [
          s.name,
          s.role,
          ...dayStatuses,
          salRec?.present_days ?? '-',
          salRec ? `₹${salRec.final_salary.toLocaleString('en-IN')}` : '-',
          salRec ? (salRec.is_paid ? 'Paid' : 'Unpaid') : '-',
        ];
      });

      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 20 }, { wch: 14 },
        ...days.map(() => ({ wch: 4 })),
        { wch: 14 }, { wch: 14 }, { wch: 10 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Attendance ${monthLabel}`);

      XLSX.writeFile(wb, `attendance-report-${month}.xlsx`);
      toast.success('Excel report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  const totalPresent = attendance.filter((a) => a.status === 'present').length;
  const totalAbsent = attendance.filter((a) => a.status === 'absent').length;
  const totalPayroll = salaryRecords.reduce((sum, r) => sum + r.final_salary, 0);

  return (
    <div className="page-enter">
      <Header
        title="Reports"
        subtitle="Attendance & salary reports"
        action={
          <button
            onClick={handleExportExcel}
            disabled={exporting || staffList.length === 0}
            className="btn-primary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            {exporting
              ? <Loader2 size={16} className="animate-spin" />
              : <FileSpreadsheet size={16} />
            }
            Export Excel
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-field max-w-[200px]"
          />
          <p className="text-sm text-gray-500">
            {format(new Date(month + '-01'), 'MMMM yyyy')} — {staffList.length} staff
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card bg-green-50 border-0">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={16} className="text-success" />
              <p className="text-xs text-gray-500 font-medium">Total Present</p>
            </div>
            <p className="text-2xl font-bold text-success">{totalPresent}</p>
          </div>
          <div className="card bg-red-50 border-0">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-danger" />
              <p className="text-xs text-gray-500 font-medium">Total Absent</p>
            </div>
            <p className="text-2xl font-bold text-danger">{totalAbsent}</p>
          </div>
          <div className="card bg-blue-50 border-0">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee size={16} className="text-brand-blue" />
              <p className="text-xs text-gray-500 font-medium">Total Payroll</p>
            </div>
            <p className="text-xl font-bold text-brand-blue">₹{totalPayroll.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-blue mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Loading report…</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="card text-center py-14">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={26} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No data for {format(new Date(month + '-01'), 'MMMM yyyy')}</h3>
            <p className="text-sm text-gray-400 mt-2">Add staff and mark attendance to see reports.</p>
          </div>
        ) : (
          <>
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDays size={16} className="text-brand-blue" />
                  Monthly Attendance Matrix
                </h3>
                <div className="flex items-center gap-3 text-[10px]">
                  {[
                    { color: 'bg-success', label: 'Present' },
                    { color: 'bg-danger', label: 'Absent' },
                    { color: 'bg-warning', label: 'Half Day' },
                    { color: 'bg-gray-300', label: 'Holiday' },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1 text-gray-500">
                      <span className={`w-2.5 h-2.5 rounded ${color} inline-block`} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 bg-gray-50 z-10 text-left px-4 py-2 font-semibold text-gray-600 whitespace-nowrap min-w-[140px]">
                        Staff
                      </th>
                      {days.map((d) => (
                        <th key={d.toISOString()} className={`px-1 py-2 text-center font-semibold w-7 ${
                          d.getDay() === 0 ? 'text-danger' : 'text-gray-400'
                        }`}>
                          {format(d, 'd')}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Days</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Salary</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {staffList.map((s, idx) => {
                      const staffAtt = attMap.get(s.id) ?? new Map();
                      const salRec = salMap.get(s.id);
                      return (
                        <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className={`sticky left-0 z-10 px-4 py-2 whitespace-nowrap ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <p className="font-semibold text-gray-900 text-xs">{s.name}</p>
                            <p className="text-[10px] text-gray-400">{s.role}</p>
                          </td>
                          {days.map((d) => {
                            const ds = format(d, 'yyyy-MM-dd');
                            const status = staffAtt.get(ds);
                            return (
                              <td key={ds} className="px-0.5 py-1 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[9px] font-bold ${getStatusColor(status)}`}>
                                  {getStatusSymbol(status) || (d.getDay() === 0 ? '·' : '')}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center font-semibold text-gray-700">
                            {salRec ? salRec.present_days : '—'}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-900 whitespace-nowrap">
                            {salRec ? `₹${salRec.final_salary.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {salRec ? (
                              <span className={salRec.is_paid ? 'badge-present text-[10px]' : 'badge-absent text-[10px]'}>
                                {salRec.is_paid ? '✓ Paid' : 'Unpaid'}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="w-full card border-dashed border-2 border-gray-200 hover:border-brand-blue/40 transition-colors text-center py-4 group cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2 text-gray-400 group-hover:text-brand-blue transition-colors">
                <Download size={18} />
                <p className="text-sm font-medium">Download Full Report as Excel (.xlsx)</p>
              </div>
              <p className="text-xs text-gray-300 mt-1">All staff · All days · Salary summary included</p>
            </button>
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
