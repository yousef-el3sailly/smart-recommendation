
-- Function: place order atomically with stock validation & decrement
CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id uuid,
  p_total numeric,
  p_shipping_address text,
  p_payment_method text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price numeric;
  v_stock int;
  v_name text;
BEGIN
  -- Validate stock for every item first (lock rows)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;

    SELECT stock, name INTO v_stock, v_name
    FROM public.products WHERE id = v_product_id FOR UPDATE;

    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %: only % available', v_name, v_stock;
    END IF;
  END LOOP;

  -- Create order
  INSERT INTO public.orders (user_id, total_price, status, shipping_address, payment_method)
  VALUES (p_user_id, p_total, 'pending', p_shipping_address, p_payment_method)
  RETURNING id INTO v_order_id;

  -- Insert items + decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    v_price := (v_item->>'price')::numeric;

    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (v_order_id, v_product_id, v_qty, v_price);

    UPDATE public.products
    SET stock = stock - v_qty,
        popularity_score = COALESCE(popularity_score, 0) + v_qty
    WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Function: cancel order (restores stock, marks cancelled)
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_status text;
  v_item record;
BEGIN
  SELECT user_id, status INTO v_user_id, v_status
  FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Authorization: owner or admin
  IF v_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to cancel this order';
  END IF;

  IF v_status = 'cancelled' THEN
    RETURN;
  END IF;
  IF v_status = 'delivered' THEN
    RAISE EXCEPTION 'Cannot cancel a delivered order';
  END IF;

  -- Restore stock
  FOR v_item IN
    SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products
    SET stock = COALESCE(stock, 0) + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id;
END;
$$;

-- Allow users to update their own orders (needed only as fallback; cancel_order handles auth)
-- No new policy needed since cancel_order is SECURITY DEFINER.
