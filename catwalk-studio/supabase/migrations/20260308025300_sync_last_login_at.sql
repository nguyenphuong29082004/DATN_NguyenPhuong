-- =====================================================
-- SYNC last_login_at FROM auth.users TO public.users
-- Updates last_login_at whenever a user signs in
-- (Google, Email, Anonymous - all auth methods)
-- =====================================================

-- Replace the existing trigger function to also sync last_sign_in_at
CREATE OR REPLACE FUNCTION sync_auth_email_to_public_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync email change (guest → registered)
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
    UPDATE public.users
    SET
      email = NEW.email,
      is_guest = false,
      updated_at = NOW()
    WHERE public.users.user_id = NEW.id;
  END IF;

  -- Sync anonymous → registered
  IF OLD.is_anonymous = true AND NEW.is_anonymous = false THEN
    UPDATE public.users
    SET
      is_guest = false,
      updated_at = NOW()
    WHERE public.users.user_id = NEW.id;
  END IF;

  -- Sync last_sign_in_at → last_login_at
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.users
    SET
      last_login_at = NEW.last_sign_in_at,
      updated_at = NOW()
    WHERE public.users.user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- The trigger on_auth_user_updated already exists and points to this function,
-- so no need to recreate it. The function replacement takes effect immediately.
