import { cache } from 'react';
import { supabaseAdmin } from './server';

// ─── Cached Business Lookup ──────────────────────────────────────────────────
// Uses React's `cache()` to deduplicate this call within a single server request.
// Multiple components/layouts calling this in the same render will only hit DB once.

export const getBusinessForUser = cache(async (userId: string) => {
  const { data } = await supabaseAdmin
    .from('businesses')
    .select('id, name, plan, logo_url')
    .eq('owner_id', userId)
    .maybeSingle();
  return data;
});

// ─── Cached Staff IDs Lookup ─────────────────────────────────────────────────
// Returns all staff IDs for a business — used by multiple API routes.

export const getStaffIdsForBusiness = cache(async (businessId: string) => {
  const { data } = await supabaseAdmin
    .from('staff')
    .select('id')
    .eq('business_id', businessId);
  return (data ?? []).map((s) => s.id);
});

// ─── Combined helper for API routes ──────────────────────────────────────────
// Returns { business, staffIds } in a single call chain, or null if not found.

export async function getBusinessContext(userId: string) {
  const business = await getBusinessForUser(userId);
  if (!business) return null;
  const staffIds = await getStaffIdsForBusiness(business.id);
  return { business, staffIds };
}
