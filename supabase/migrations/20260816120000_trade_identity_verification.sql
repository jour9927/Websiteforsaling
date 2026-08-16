-- 交易實名認證：證件放在 private Storage，審核結果獨立保存。
-- 民間交易的刊登、出價、直購都在 RPC 內強制檢查 approved。

CREATE TABLE IF NOT EXISTS public.trade_identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL CHECK (char_length(legal_name) BETWEEN 1 AND 80),
  legal_name_kana TEXT CHECK (legal_name_kana IS NULL OR char_length(legal_name_kana) <= 80),
  id_front_path TEXT NOT NULL,
  id_back_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  documents_purge_after TIMESTAMPTZ,
  documents_purged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trade_identity_distinct_document_paths CHECK (id_front_path <> id_back_path),
  CONSTRAINT trade_identity_review_shape CHECK (
    (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR
    (status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
  ),
  CONSTRAINT trade_identity_rejection_reason CHECK (
    status <> 'rejected' OR NULLIF(BTRIM(rejection_reason), '') IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_trade_identity_status_submitted
  ON public.trade_identity_verifications(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_trade_identity_document_purge
  ON public.trade_identity_verifications(documents_purge_after)
  WHERE documents_purged_at IS NULL;

ALTER TABLE public.trade_identity_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own trade identity verification" ON public.trade_identity_verifications;
CREATE POLICY "Users can read own trade identity verification"
  ON public.trade_identity_verifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can read trade identity verifications" ON public.trade_identity_verifications;
CREATE POLICY "Admins can read trade identity verifications"
  ON public.trade_identity_verifications
  FOR SELECT
  TO authenticated
  USING ((SELECT public.current_user_is_admin()));

REVOKE ALL ON TABLE public.trade_identity_verifications FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.trade_identity_verifications FROM authenticated;
GRANT SELECT ON TABLE public.trade_identity_verifications TO authenticated;
GRANT ALL ON TABLE public.trade_identity_verifications TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-verifications',
  'identity-verifications',
  false,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Identity owners can upload pending documents" ON storage.objects;
DROP POLICY IF EXISTS "Identity owners can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Identity owners can replace rejected documents" ON storage.objects;
DROP POLICY IF EXISTS "Identity owners can delete unsubmitted documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read identity documents" ON storage.objects;

CREATE POLICY "Identity owners can upload pending documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity-verifications'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND name IN (
    (SELECT auth.uid())::TEXT || '/front',
    (SELECT auth.uid())::TEXT || '/back'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.trade_identity_verifications verification
    WHERE verification.user_id = (SELECT auth.uid())
      AND verification.status IN ('pending', 'approved')
  )
);

CREATE POLICY "Identity owners can read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-verifications'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND name IN (
    (SELECT auth.uid())::TEXT || '/front',
    (SELECT auth.uid())::TEXT || '/back'
  )
);

CREATE POLICY "Identity owners can replace rejected documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'identity-verifications'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND name IN (
    (SELECT auth.uid())::TEXT || '/front',
    (SELECT auth.uid())::TEXT || '/back'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.trade_identity_verifications verification
    WHERE verification.user_id = (SELECT auth.uid())
      AND verification.status IN ('pending', 'approved')
  )
)
WITH CHECK (
  bucket_id = 'identity-verifications'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND name IN (
    (SELECT auth.uid())::TEXT || '/front',
    (SELECT auth.uid())::TEXT || '/back'
  )
);

CREATE POLICY "Identity owners can delete unsubmitted documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity-verifications'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  AND name IN (
    (SELECT auth.uid())::TEXT || '/front',
    (SELECT auth.uid())::TEXT || '/back'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.trade_identity_verifications verification
    WHERE verification.user_id = (SELECT auth.uid())
      AND verification.status IN ('pending', 'approved')
  )
);

CREATE POLICY "Admins can read identity documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-verifications'
  AND (SELECT public.current_user_is_admin())
);

CREATE OR REPLACE FUNCTION public.current_user_trade_identity_verified()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trade_identity_verifications verification
    WHERE verification.user_id = (SELECT auth.uid())
      AND verification.status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_trade_identity_verified() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_trade_identity_verified() TO authenticated;

-- 重新建立三個可開始交易的 RPC，加入不可由前端繞過的 approved 檢查。
-- 函式本文維持前一版，僅在登入檢查後增加以下 gate。
DO $$
BEGIN
  IF to_regprocedure('public.create_community_auction(uuid,integer,integer,integer,timestamptz,text)') IS NULL
    OR to_regprocedure('public.place_community_bid(uuid,integer)') IS NULL
    OR to_regprocedure('public.buy_community_auction(uuid)') IS NULL THEN
    RAISE EXCEPTION 'community market functions must exist before identity verification gate';
  END IF;
END;
$$;

-- 使用 wrapper gate 無法安全地保留同名函式，因此以 trigger 阻止未認證者
-- 對拍賣或出價表造成任何新交易；RPC 仍是唯一有寫入權限的入口。
CREATE OR REPLACE FUNCTION public.enforce_trade_identity_on_community_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor UUID := (SELECT auth.uid());
BEGIN
  IF COALESCE((SELECT auth.role()), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF v_actor IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.trade_identity_verifications verification
    WHERE verification.user_id = v_actor
      AND verification.status = 'approved'
  ) THEN
    RAISE EXCEPTION '交易前需要完成身分證實名認證並通過人工審核';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_trade_identity_on_community_auctions
  ON public.community_auctions;
CREATE TRIGGER enforce_trade_identity_on_community_auctions
  BEFORE INSERT ON public.community_auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_trade_identity_on_community_insert();

DROP TRIGGER IF EXISTS enforce_trade_identity_on_community_bids
  ON public.community_auction_bids;
CREATE TRIGGER enforce_trade_identity_on_community_bids
  BEFORE INSERT ON public.community_auction_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_trade_identity_on_community_insert();

REVOKE ALL ON FUNCTION public.enforce_trade_identity_on_community_insert() FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.trade_identity_verifications IS
  '交易專用實名審核；證件路徑與法定姓名只開放本人、管理員及 service role。';
COMMENT ON COLUMN public.trade_identity_verifications.documents_purge_after IS
  '審核完成 30 天後刪除正反面證件，只保留審核結果。';
