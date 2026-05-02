import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET — fetch attendance for a date (whole business) or staff_id
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const staffId = searchParams.get('staff_id');
  const month = searchParams.get('month'); // YYYY-MM

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  // All staff IDs for this business
  const { data: staffList } = await supabaseAdmin
    .from('staff')
    .select('id')
    .eq('business_id', business.id);

  const staffIds = (staffList ?? []).map((s) => s.id);
  if (staffIds.length === 0) return NextResponse.json({ attendance: [] });

  let query = supabaseAdmin
    .from('attendance')
    .select('*')
    .in('staff_id', staffIds);

  if (date) query = query.eq('date', date);
  if (staffId) query = query.eq('staff_id', staffId);
  if (month) query = query.gte('date', `${month}-01`).lte('date', `${month}-31`);

  query = query.order('date', { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ attendance: data });
}

// POST — upsert attendance records (bulk save for a date)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  // body.records = [{ staff_id, date, status, note? }, ...]
  const { records } = body as {
    records: Array<{ staff_id: string; date: string; status: string; note?: string }>;
  };

  if (!records?.length) return NextResponse.json({ error: 'No records provided' }, { status: 400 });

  // Verify ownership of all staff_ids
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { data: staffList } = await supabaseAdmin
    .from('staff')
    .select('id')
    .eq('business_id', business.id);

  const ownedIds = new Set((staffList ?? []).map((s) => s.id));
  const invalid = records.some((r) => !ownedIds.has(r.staff_id));
  if (invalid) return NextResponse.json({ error: 'Invalid staff_id in records' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('attendance')
    .upsert(records, { onConflict: 'staff_id,date' })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attendance: data });
}
