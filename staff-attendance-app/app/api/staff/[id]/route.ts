import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// helper: verify staff belongs to this user's business
async function verifyOwnership(userId: string, staffId: string) {
  const { data } = await supabaseAdmin
    .from('staff')
    .select('id, businesses!inner(owner_id)')
    .eq('id', staffId)
    .single();

  if (!data) return false;
  const biz = data.businesses as unknown as { owner_id: string };
  return biz.owner_id === userId;
}

// GET — single staff member
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = await verifyOwnership(userId, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('staff')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

// PUT — full update
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = await verifyOwnership(userId, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { name, phone, role, salary_type, monthly_salary, daily_wage, joining_date } = body;

  const { data, error } = await supabaseAdmin
    .from('staff')
    .update({
      name: name?.trim(),
      phone: phone?.trim() ?? '',
      role: role?.trim(),
      salary_type,
      monthly_salary: salary_type === 'monthly' ? Number(monthly_salary) : null,
      daily_wage: salary_type === 'daily' ? Number(daily_wage) : null,
      joining_date,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

// PATCH — partial update (e.g., deactivate)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = await verifyOwnership(userId, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const allowed = ['is_active', 'phone', 'role'];
  const filtered = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabaseAdmin
    .from('staff')
    .update(filtered)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}
