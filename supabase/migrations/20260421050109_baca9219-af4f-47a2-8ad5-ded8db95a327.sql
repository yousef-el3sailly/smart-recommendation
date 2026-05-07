-- New enums for structured profile fields
CREATE TYPE public.budget_range AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.usage_type AS ENUM ('gaming', 'programming', 'design', 'study', 'general');
CREATE TYPE public.performance_priority AS ENUM ('battery', 'performance', 'portability', 'balanced');

-- Extend profiles with richer preference data
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS study_year smallint CHECK (study_year IS NULL OR (study_year BETWEEN 1 AND 7)),
  ADD COLUMN IF NOT EXISTS budget_range public.budget_range,
  ADD COLUMN IF NOT EXISTS preferred_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS usage_type public.usage_type,
  ADD COLUMN IF NOT EXISTS brand_preference text,
  ADD COLUMN IF NOT EXISTS performance_priority public.performance_priority;

-- Behavior tracking: add-to-cart events
CREATE TABLE IF NOT EXISTS public.cart_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_events_user ON public.cart_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_events_product ON public.cart_events(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_events_created ON public.cart_events(created_at DESC);

ALTER TABLE public.cart_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own or anonymous cart events"
  ON public.cart_events FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view own cart events"
  ON public.cart_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cart events"
  ON public.cart_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));