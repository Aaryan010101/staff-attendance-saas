import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
// GET — list advances for this business (with staff name)
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const staffId = searchParams.get('staff_id');
  const month = searchParams.get('month');

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  // Get all staff IDs for ownership check
  const { data: staffList } = await supabaseAdmin
    .from('staff')
    .select('id')
    .eq('business_id', business.id);

  const staffIds = (staffList ?? []).map((s) => s.id);
  if (staffIds.length === 0) return NextResponse.json({ advances: [] });

  let query = supabaseAdmin
    .from('advances')
    .select('*, staff(name, role)')
    .in('staff_id', staffIds)
    .order('given_date', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (month) query = query.eq('month_to_deduct', month);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ advances: data });
}

// POST — create a new advance
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { staff_id, amount, given_date, month_to_deduct } = body;

  if (!staff_id) return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
  if (!amount || Number(amount) <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  if (!month_to_deduct) return NextResponse.json({ error: 'month_to_deduct is required' }, { status: 400 });

  // Verify ownership
  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('id, businesses!inner(owner_id)')
    .eq('id', staff_id)
    .single();

  if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
  const biz = staff.businesses as unknown as { owner_id: string };
  if (biz.owner_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('advances')
    .insert({
      staff_id,
      amount: Number(amount),
      given_date: given_date ?? new Date().toISOString().substring(0, 10),
      month_to_deduct,
      is_deducted: false,
    })
    .select('*, staff(name, role)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ advance: data }, { status: 201 });
}
