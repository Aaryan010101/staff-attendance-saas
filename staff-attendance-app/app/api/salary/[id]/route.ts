import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function verifyRecordOwnership(userId: string, recordId: string) {
  const { data } = await supabaseAdmin
    .from('salary_records')
    .select('id, staff(businesses!inner(owner_id))')
    .eq('id', recordId)
    .single();

  if (!data) return false;
  const staff = data.staff as unknown as { businesses: { owner_id: string } };
  return staff?.businesses?.owner_id === userId;
}

// PATCH — update individual salary record (overtime, bonus, is_paid, paid_date, slip_url)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = await verifyRecordOwnership(userId, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Allow specific fields to be updated
  const allowed = ['overtime_amount', 'bonus', 'is_paid', 'paid_date', 'slip_url', 'final_salary'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Recalculate final_salary if overtime/bonus changed
  if ('overtime_amount' in updates || 'bonus' in updates) {
    const { data: existing } = await supabaseAdmin
      .from('salary_records')
      .select('*')
      .eq('id', id)
      .single();

    if (existing) {
      const overtime = Number('overtime_amount' in updates ? updates.overtime_amount : existing.overtime_amount);
      const bonus = Number('bonus' in updates ? updates.bonus : existing.bonus);
      const basePart = existing.final_salary - existing.overtime_amount - existing.bonus + existing.advance_deduction;
      updates.final_salary = Math.max(0, basePart + overtime + bonus - existing.advance_deduction);
    }
  }

  // Mark advances as deducted when salary is paid
  if (body.is_paid && body.paid_date) {
    const { data: record } = await supabaseAdmin
      .from('salary_records')
      .select('staff_id, month')
      .eq('id', id)
      .single();

    if (record) {
      await supabaseAdmin
        .from('advances')
        .update({ is_deducted: true })
        .eq('staff_id', record.staff_id)
        .eq('month_to_deduct', record.month);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('salary_records')
    .update(updates)
    .eq('id', id)
    .select('*, staff(name, role, phone)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
