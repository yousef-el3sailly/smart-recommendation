DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.product_clicks;

CREATE POLICY "Users can insert own or anonymous clicks"
  ON public.product_clicks FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());