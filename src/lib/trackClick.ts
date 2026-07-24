import { supabase } from '@/integrations/supabase/client';
import type { Enums } from '@/integrations/supabase/types';

type Faculty = Enums<'faculty_type'>;

/**
 * Records a click/view on a product. Best-effort, never throws.
 */
export async function trackProductClick(
  productId: string,
  opts: { userId?: string | null; faculty?: Faculty | null; source?: string } = {}
) {
  try {
    await supabase.from('product_clicks').insert({
      product_id: productId,
      user_id: opts.userId ?? null,
      faculty: opts.faculty ?? null,
      source: opts.source ?? 'recommendation',
    });
  } catch {
    // silent — analytics shouldn't break UX
  }
}
