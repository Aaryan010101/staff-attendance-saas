import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function verifyAdvanceOwnership(userId: string, advanceId: string) {
  const { data } = await supabaseAdmin
    .from('advances')
    .select('id, staff(businesses!inner(owner_id))')
    .eq('id', advanceId)
    .single();

  if (!data) return false;
  const staff = data.staff as unknown as { businesses: { owner_id: string } };
  return staff?.businesses?.owner_id === userId;
}

// PATCH — update is_deducted status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = await verifyAdvanceOwnership(userId, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { is_deducted } = body;

  const { data, error } = await supabaseAdmin
    .from('advances')
    .update({ is_deducted })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ advance: data });
}

// DELETE — remove an advance (only if not yet deducted)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = await verifyAdvanceOwnership(userId, id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabaseAdmin
    .from('advances')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
