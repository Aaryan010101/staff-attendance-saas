import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { record_id } = body;
  if (!record_id) return NextResponse.json({ error: 'record_id is required' }, { status: 400 });

  // Fetch the salary record with staff + business info
  const { data: record, error: recErr } = await supabaseAdmin
    .from('salary_records')
    .select(`
      *,
      staff (
        name, role, phone, salary_type, monthly_salary, daily_wage,
        businesses ( name, logo_url, owner_id )
      )
    `)
    .eq('id', record_id)
    .single();

  if (recErr || !record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

  const staffData = record.staff as {
    name: string;
    role: string;
    phone: string;
    salary_type: 'monthly' | 'daily';
    monthly_salary: number | null;
    daily_wage: number | null;
    businesses: { name: string; logo_url: string | null; owner_id: string };
  };

  // Security: ensure this business belongs to the caller
  if (staffData.businesses.owner_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check plan — PDF only for basic/pro
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('plan')
    .eq('owner_id', userId)
    .single();

  if (business?.plan === 'free') {
    return NextResponse.json(
      { error: 'PDF salary slips require Basic or Pro plan. Please upgrade.' },
      { status: 403 }
    );
  }

  // Generate PDF buffer using dynamic import to avoid SSR issues
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const React = (await import('react')).default;
  const { SalarySlipDocument } = await import('@/components/pdf/SalarySlipDocument');

  const element = React.createElement(SalarySlipDocument, {
    record: {
      month: record.month,
      total_days: record.total_days,
      present_days: record.present_days,
      base_salary: record.base_salary,
      overtime_amount: record.overtime_amount,
      bonus: record.bonus,
      advance_deduction: record.advance_deduction,
      final_salary: record.final_salary,
      is_paid: record.is_paid,
      paid_date: record.paid_date,
    },
    staff: {
      name: staffData.name,
      role: staffData.role,
      phone: staffData.phone,
      salary_type: staffData.salary_type,
      monthly_salary: staffData.monthly_salary,
      daily_wage: staffData.daily_wage,
    },
    business: {
      name: staffData.businesses.name,
      logo_url: staffData.businesses.logo_url,
    },
  });

  // renderToBuffer accepts ReactElement — cast needed due to @react-pdf/renderer's internal typings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(element as any);

  // Upload to Supabase Storage
  const fileName = `slips/${userId}/${record.staff_id}/${record.month}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('business-assets')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('business-assets')
    .getPublicUrl(fileName);

  const slip_url = urlData.publicUrl;

  // Save slip_url to salary_records
  await supabaseAdmin
    .from('salary_records')
    .update({ slip_url })
    .eq('id', record_id);

  return NextResponse.json({ slip_url });
}
