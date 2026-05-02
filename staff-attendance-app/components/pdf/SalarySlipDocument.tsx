import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// Register fonts (using built-in fonts for reliability)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 36,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1A56A0',
  },
  brandSection: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1A56A0',
    marginBottom: 2,
  },
  slipTitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  // Info section
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
  },
  infoLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A56A0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '7 8',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
  },
  // Earnings / Deductions
  earningsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  earningsBox: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  deductionsBox: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  earningsTitle: {
    color: '#15803d',
  },
  deductionsTitle: {
    color: '#c2410c',
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  lineLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  lineValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
  },
  // Net Payable Box
  netPayable: {
    backgroundColor: '#1A56A0',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  netLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netAmount: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signatureBox: {
    alignItems: 'center',
    width: 140,
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#9ca3af',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  generatedNote: {
    fontSize: 7,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  paidBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  unpaidBadge: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
});

interface SalarySlipProps {
  record: {
    month: string;
    total_days: number;
    present_days: number;
    base_salary: number;
    overtime_amount: number;
    bonus: number;
    advance_deduction: number;
    final_salary: number;
    is_paid: boolean;
    paid_date: string | null;
  };
  staff: {
    name: string;
    role: string;
    phone: string;
    salary_type: 'monthly' | 'daily';
    monthly_salary: number | null;
    daily_wage: number | null;
  };
  business: {
    name: string;
    logo_url: string | null;
  };
}

export const SalarySlipDocument: React.FC<SalarySlipProps> = ({ record, staff, business }) => {
  const monthLabel = (() => {
    const [y, m] = record.month.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  })();

  const totalEarnings = record.base_salary + record.overtime_amount + record.bonus;
  const totalDeductions = record.advance_deduction;
  const baseSalaryLabel = staff.salary_type === 'monthly'
    ? `₹${(staff.monthly_salary ?? 0).toLocaleString('en-IN')}/mo`
    : `₹${(staff.daily_wage ?? 0).toLocaleString('en-IN')}/day`;

  return (
    <Document title={`Salary Slip - ${staff.name} - ${record.month}`}>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.slipTitle}>SALARY SLIP — {monthLabel.toUpperCase()}</Text>
          </View>
          {business.logo_url && (
            <Image src={business.logo_url} style={styles.logo} />
          )}
        </View>

        {/* Employee Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Employee Name</Text>
            <Text style={styles.infoValue}>{staff.name}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Designation</Text>
            <Text style={styles.infoValue}>{staff.role}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Salary Type</Text>
            <Text style={styles.infoValue}>{baseSalaryLabel}</Text>
          </View>
          <View style={[styles.infoBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[
              styles.statusBadge,
              record.is_paid ? styles.paidBadge : styles.unpaidBadge,
            ]}>
              {record.is_paid ? '✓ PAID' : 'UNPAID'}
            </Text>
          </View>
        </View>

        {/* Attendance Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Month</Text>
            <Text style={styles.tableHeaderText}>Working Days</Text>
            <Text style={styles.tableHeaderText}>Days Present</Text>
            <Text style={styles.tableHeaderText}>Days Absent</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, styles.tableCellBold]}>{monthLabel}</Text>
            <Text style={styles.tableCell}>{record.total_days}</Text>
            <Text style={[styles.tableCell, { color: '#1D9E75' }]}>{record.present_days}</Text>
            <Text style={[styles.tableCell, { color: '#E24B4A' }]}>
              {Math.max(0, record.total_days - record.present_days).toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Earnings & Deductions */}
        <View style={styles.earningsSection}>
          <View style={styles.earningsBox}>
            <Text style={[styles.sectionTitle, styles.earningsTitle]}>Earnings</Text>
            <View style={styles.lineItem}>
              <Text style={styles.lineLabel}>Basic Pay</Text>
              <Text style={styles.lineValue}>₹{record.base_salary.toLocaleString('en-IN')}</Text>
            </View>
            {record.overtime_amount > 0 && (
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Overtime</Text>
                <Text style={styles.lineValue}>₹{record.overtime_amount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {record.bonus > 0 && (
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Bonus</Text>
                <Text style={styles.lineValue}>₹{record.bonus.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={[styles.lineItem, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#bbf7d0' }]}>
              <Text style={[styles.lineLabel, { fontFamily: 'Helvetica-Bold', color: '#15803d' }]}>Total Earnings</Text>
              <Text style={[styles.lineValue, { color: '#15803d' }]}>₹{totalEarnings.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.deductionsBox}>
            <Text style={[styles.sectionTitle, styles.deductionsTitle]}>Deductions</Text>
            {record.advance_deduction > 0 ? (
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Advance Deduction</Text>
                <Text style={styles.lineValue}>₹{record.advance_deduction.toLocaleString('en-IN')}</Text>
              </View>
            ) : (
              <Text style={[styles.lineLabel, { fontStyle: 'italic' }]}>No deductions</Text>
            )}
            <View style={[styles.lineItem, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#fed7aa' }]}>
              <Text style={[styles.lineLabel, { fontFamily: 'Helvetica-Bold', color: '#c2410c' }]}>Total Deductions</Text>
              <Text style={[styles.lineValue, { color: '#c2410c' }]}>₹{totalDeductions.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Net Payable */}
        <View style={styles.netPayable}>
          <View>
            <Text style={styles.netLabel}>Net Payable</Text>
            {record.paid_date && (
              <Text style={{ color: '#bfdbfe', fontSize: 8, marginTop: 2 }}>
                Paid on {new Date(record.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>
          <Text style={styles.netAmount}>₹{record.final_salary.toLocaleString('en-IN')}</Text>
        </View>

        {/* Signature Section */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Employee Signature</Text>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center' }}>
              {staff.phone ? `📞 ${staff.phone}` : ''}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Employer Signature</Text>
          </View>
        </View>

        <Text style={styles.generatedNote}>
          Generated by Staff Attendance & Salary Calculator · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

      </Page>
    </Document>
  );
};
