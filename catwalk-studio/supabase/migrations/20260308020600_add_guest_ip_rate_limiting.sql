-- =====================================================
-- GUEST IP RATE LIMITING
-- Prevents abuse of free credits by tracking IPs
-- Max 2 guest accounts per IP receive credits
-- =====================================================

-- 1. Create tracking table for guest IPs
CREATE TABLE IF NOT EXISTS public.guest_ip_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_id UUID REFERENCES public.users(user_id),
  credits_granted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_ip_tracking_ip ON public.guest_ip_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_guest_ip_tracking_created_at ON public.guest_ip_tracking(created_at DESC);

-- 2. Replace get_or_create_guest function with IP checking
CREATE OR REPLACE FUNCTION public.get_or_create_guest(
  p_user_id uuid,
  p_fingerprint text
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.users;
  v_client_ip text;
  v_ip_guest_count integer;
  v_credits integer;
BEGIN
  -- Get client IP from request headers
  BEGIN
    v_client_ip := coalesce(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      current_setting('request.headers', true)::json->>'x-real-ip',
      'unknown'
    );
    -- x-forwarded-for may contain multiple IPs (client, proxy1, proxy2...)
    -- Take the first one (original client IP)
    IF v_client_ip LIKE '%,%' THEN
      v_client_ip := trim(split_part(v_client_ip, ',', 1));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_client_ip := 'unknown';
  END;

  -- Check if a guest with this fingerprint already exists
  IF p_fingerprint IS NOT NULL AND p_fingerprint != '' AND p_fingerprint != 'fp_unavailable' THEN
    SELECT * INTO v_existing
    FROM public.users
    WHERE device_fingerprint = p_fingerprint AND is_guest = true
    LIMIT 1;

    IF FOUND THEN
      -- Reuse existing profile: update user_id to new auth user
      UPDATE public.users
      SET user_id = p_user_id, updated_at = now()
      WHERE device_fingerprint = p_fingerprint AND is_guest = true;

      RETURN QUERY SELECT * FROM public.users WHERE user_id = p_user_id;
      RETURN;
    END IF;
  END IF;

  -- Count how many guest accounts this IP has already created (in last 30 days)
  SELECT count(*) INTO v_ip_guest_count
  FROM public.guest_ip_tracking
  WHERE ip_address = v_client_ip
    AND v_client_ip != 'unknown'
    AND created_at > now() - interval '30 days';

  -- If IP has created 2 or more guests already, give 0 credits
  -- Otherwise give 100 credits (normal welcome bonus)
  IF v_ip_guest_count >= 2 THEN
    v_credits := 0;
  ELSE
    v_credits := 100;
  END IF;

  -- Create new guest user
  INSERT INTO public.users (user_id, email, credits_balance, is_guest, device_fingerprint)
  VALUES (p_user_id, NULL, v_credits, true, p_fingerprint)
  ON CONFLICT (user_id) DO NOTHING;

  -- Track this IP for rate limiting
  INSERT INTO public.guest_ip_tracking (ip_address, user_id, credits_granted)
  VALUES (v_client_ip, p_user_id, v_credits);

  RETURN QUERY SELECT * FROM public.users WHERE user_id = p_user_id;
END;
$$;
