CREATE OR REPLACE FUNCTION convert_guest_to_user(p_user_id UUID, p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  credits_balance INTEGER,
  is_guest BOOLEAN,
  subscription_tier TEXT,
  display_name TEXT,
  avatar_url TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  UPDATE users
  SET
    email = p_email,
    is_guest = false,
    updated_at = NOW()
  WHERE users.user_id = p_user_id
  RETURNING
    users.user_id,
    users.email,
    users.credits_balance,
    users.is_guest,
    users.subscription_tier,
    users.display_name,
    users.avatar_url,
    users.device_fingerprint,
    users.created_at,
    users.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
