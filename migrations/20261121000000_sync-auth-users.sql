-- ============================================================================
-- COVERLY: Sync Auth Users to Public Users & Auto-Creation Trigger
-- Ensures every auth.users account has a matching public.users & user_roles record
-- ============================================================================

-- 1. Backfill any orphaned auth.users into public.users
INSERT INTO public.users (id, email, full_name, is_active, email_verified, auth_provider)
SELECT 
  a.id, 
  LOWER(a.email), 
  COALESCE(split_part(a.email, '@', 1), 'User'), 
  true, 
  COALESCE(a.email_verified, false), 
  'email'
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure every user has a primary role in public.user_roles
INSERT INTO public.user_roles (user_id, role, is_primary)
SELECT 
  u.id, 
  'buyer', 
  true
FROM public.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE r.id IS NULL
ON CONFLICT DO NOTHING;

-- 3. Trigger to automatically sync newly created auth.users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_active, email_verified, auth_provider)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(split_part(NEW.email, '@', 1), 'User'),
    true,
    COALESCE(NEW.email_verified, false),
    'email'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role, is_primary)
  VALUES (NEW.id, 'buyer', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
