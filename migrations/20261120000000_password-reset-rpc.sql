-- ============================================================================
-- COVERLY Password Reset Stored Procedure
-- Allows secure password updates in auth.users via pgcrypto bcrypt
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_user_password(target_email text, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(target_email);
  RETURN FOUND;
END;
$$;
