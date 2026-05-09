import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST — upload business logo to Supabase Storage
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('logo') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP or GIF allowed' }, { status: 400 });
  }

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 2MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'png';
  const fileName = `logos/${userId}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from('business-assets')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Logo upload error:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('business-assets')
    .getPublicUrl(fileName);

  const logo_url = `${urlData.publicUrl}?t=${Date.now()}`;

  // Update business record
  const { error: dbError } = await supabaseAdmin
    .from('businesses')
    .update({ logo_url })
    .eq('owner_id', userId);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ logo_url });
}
