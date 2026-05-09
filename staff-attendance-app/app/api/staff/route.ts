import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET — list all staff for current business
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const activeOnly = searchParams.get('active') !== 'false';

  // Get business id for this user
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  let query = supabaseAdmin
    .from('staff')
    .select('*')
    .eq('business_id', business.id)
    .order('name');

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ staff: data });
}

// POST — create new staff member
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, phone, role, salary_type, monthly_salary, daily_wage, joining_date } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!role?.trim()) return NextResponse.json({ error: 'Role is required' }, { status: 400 });

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, plan')
    .eq('owner_id', userId)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  // Plan limits
  const { count } = await supabaseAdmin
    .from('staff')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('is_active', true);

  const limits: Record<string, number> = { free: 5, basic: 15, pro: Infinity };
  const limit = limits[business.plan] ?? 5;

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Your ${business.plan} plan supports up to ${limit} active staff. Upgrade to add more.` },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert({
      business_id: business.id,
      name: name.trim(),
      phone: phone?.trim() ?? '',
      role: role.trim(),
      salary_type: salary_type ?? 'monthly',
      monthly_salary: salary_type === 'monthly' ? Number(monthly_salary) : null,
      daily_wage: salary_type === 'daily' ? Number(daily_wage) : null,
      joining_date: joining_date ?? new Date().toISOString().split('T')[0],
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data }, { status: 201 });
}
