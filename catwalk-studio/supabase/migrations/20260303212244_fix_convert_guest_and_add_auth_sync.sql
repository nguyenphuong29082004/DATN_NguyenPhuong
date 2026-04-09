
-- 1. Drop old function and recreate with correct columns
DROP FUNCTION IF EXISTS convert_guest_to_user(UUID, TEXT);

CREATE FUNCTION convert_guest_to_user(p_user_id UUID, p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  user_type TEXT,
  status TEXT,
  business_name TEXT,
  business_details JSONB,
  credits_balance INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  is_guest BOOLEAN,
  device_fingerprint TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.users
  SET
    email = p_email,
    is_guest = false,
    updated_at = NOW()
  WHERE public.users.user_id = p_user_id
  RETURNING
    public.users.user_id,
    public.users.email,
    public.users.username,
    public.users.user_type,
    public.users.status,
    public.users.business_name,
    public.users.business_details,
    public.users.credits_balance,
    public.users.created_at,
    public.users.updated_at,
    public.users.last_login_at,
    public.users.is_guest,
    public.users.device_fingerprint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 2. Trigger: auto-sync auth.users email → public.users
CREATE OR REPLACE FUNCTION sync_auth_email_to_public_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
    UPDATE public.users
    SET
      email = NEW.email,
      is_guest = false,
      updated_at = NOW()
    WHERE public.users.user_id = NEW.id;
  END IF;

  IF OLD.is_anonymous = true AND NEW.is_anonymous = false THEN
    UPDATE public.users
    SET
      is_guest = false,
      updated_at = NOW()
    WHERE public.users.user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_email_to_public_users();
