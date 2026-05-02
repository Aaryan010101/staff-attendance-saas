import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StaffTrack — Attendance & Salary for Indian Businesses',
  description:
    'Easily manage staff attendance, calculate salaries, track advances, and generate payslips for your restaurant, salon, or kirana store.',
  keywords: 'staff attendance, salary calculator, Indian business, payroll, kirana, restaurant',
  openGraph: {
    title: 'StaffTrack',
    description: 'Staff Attendance & Salary Calculator for Indian Small Businesses',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#1A56A0',
          colorText: '#111827',
          borderRadius: '12px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    >
      <html lang="en" className={inter.variable}>
        <body className="font-inter antialiased bg-surface min-h-screen">
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#1D9E75', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#E24B4A', secondary: '#fff' },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
