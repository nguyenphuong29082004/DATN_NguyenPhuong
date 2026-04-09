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
BEGIN
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

  -- No existing guest found, create new one
  INSERT INTO public.users (user_id, email, credits_balance, is_guest, device_fingerprint)
  VALUES (p_user_id, NULL, 100, true, p_fingerprint)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY SELECT * FROM public.users WHERE user_id = p_user_id;
END;
$$;
