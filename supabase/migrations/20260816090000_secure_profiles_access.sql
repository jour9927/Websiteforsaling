-- Keep private/account fields on profiles while exposing only the fields used by
-- public member pages. RLS cannot hide columns, so cross-user reads must go
-- through this explicitly allow-listed view.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pokemon_first_game TEXT;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT public.current_user_is_admin()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Supabase normally grants table privileges to API roles. Replace the broad
-- grants with the exact operations that an end user is allowed to perform.
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.profiles FROM authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (
  full_name,
  avatar_url,
  bio,
  pokemon_first_year,
  pokemon_first_game,
  username,
  featured_items,
  invitation_code,
  notification_preference,
  notification_email,
  discord_webhook_url,
  last_read_announcements_at,
  last_read_backpack_items_at
) ON TABLE public.profiles TO authenticated;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_barrier = true)
AS
SELECT
  id,
  full_name,
  avatar_url,
  bio,
  pokemon_first_year,
  pokemon_first_game,
  featured_items,
  username,
  created_at,
  total_views,
  today_views,
  popularity_score,
  followers_count,
  following_count
FROM public.profiles;

REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC;
GRANT SELECT ON TABLE public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS
  'Allow-listed public member data. Private account, economy, real-name, notification target, role, and AI fields remain on profiles.';

-- Invitation codes must remain private, but registration still needs an exact
-- code lookup. Return only the matching user id and require an authenticated
-- caller instead of exposing the code column through PostgREST.
CREATE OR REPLACE FUNCTION public.resolve_invitation_code(submitted_code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id
  FROM public.profiles
  WHERE invitation_code = UPPER(BTRIM(submitted_code))
    AND id <> (SELECT auth.uid())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_invitation_code(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_invitation_code(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_invitation_code(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_profile_view(target_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  today_in_taipei DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Taipei')::DATE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR target_profile_id = (SELECT auth.uid()) THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    total_views = COALESCE(total_views, 0) + 1,
    today_views = CASE
      WHEN last_view_reset = today_in_taipei THEN COALESCE(today_views, 0) + 1
      ELSE 1
    END,
    last_view_reset = today_in_taipei
  WHERE id = target_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_profile_view(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_profile_view(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_profile_view(UUID) TO authenticated;
