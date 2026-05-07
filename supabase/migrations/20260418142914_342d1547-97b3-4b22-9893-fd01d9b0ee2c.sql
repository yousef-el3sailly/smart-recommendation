-- Add new faculty values
ALTER TYPE public.faculty_type ADD VALUE IF NOT EXISTS 'Medicine';
ALTER TYPE public.faculty_type ADD VALUE IF NOT EXISTS 'Business';

-- Product clicks/views tracking table
CREATE TABLE IF NOT EXISTS public.product_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  faculty public.faculty_type,
  source text NOT NULL DEFAULT 'recommendation',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_clicks_product ON public.product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_faculty ON public.product_clicks(faculty);
CREATE INDEX IF NOT EXISTS idx_product_clicks_created ON public.product_clicks(created_at DESC);

ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clicks"
  ON public.product_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all clicks"
  ON public.product_clicks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own clicks"
  ON public.product_clicks FOR SELECT
  USING (auth.uid() = user_id);