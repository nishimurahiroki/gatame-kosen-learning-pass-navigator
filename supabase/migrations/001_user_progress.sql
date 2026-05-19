-- ============================================================
-- Gatame Learning Pass: User Progress Persistence
-- ============================================================
-- Run this SQL in the Supabase Dashboard > SQL Editor, or via
-- the Supabase CLI: supabase db push
-- ============================================================

-- --------------------------------------------------------
-- Table 1: user_learning_paths
--   学習パス（診断リクエスト + 推奨モジュール一覧）
--   ユーザー 1 名につき 1 行（ON CONFLICT で upsert）。
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_learning_paths (
  user_id         uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  assessment_req  jsonb       NOT NULL,
  response        jsonb       NOT NULL,
  saved_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE public.user_learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own learning path" ON public.user_learning_paths;
CREATE POLICY "Users can manage their own learning path"
  ON public.user_learning_paths
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------
-- Table 2: user_module_progress
--   完了状態（セッション完了 / 生涯マスター / BBS 宣言）
--   (user_id, assessment_fingerprint) の複合 PK。
--   診断内容が同じなら同一行に蓄積される。
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_module_progress (
  user_id                     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  assessment_fingerprint      text        NOT NULL,
  session_completed_ids       text[]      NOT NULL DEFAULT '{}',
  lifetime_mastered_ids       text[]      NOT NULL DEFAULT '{}',
  bbs_declared_mastered_levels text[]     NOT NULL DEFAULT '{}',
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, assessment_fingerprint)
);

ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own module progress" ON public.user_module_progress;
CREATE POLICY "Users can manage their own module progress"
  ON public.user_module_progress
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------
-- Table 3: user_module_details
--   TODO チェック状態・Memo（モジュール単位）
--   (user_id, session_key, module_id) の複合 PK。
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_module_details (
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_key text        NOT NULL,
  module_id   text        NOT NULL,
  checked_items jsonb     NOT NULL DEFAULT '{}',
  memo        text        NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, session_key, module_id)
);

ALTER TABLE public.user_module_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own module details" ON public.user_module_details;
CREATE POLICY "Users can manage their own module details"
  ON public.user_module_details
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------
-- Indexes（読み取りパフォーマンス用）
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_module_progress_user
  ON public.user_module_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_user_module_details_session
  ON public.user_module_details (user_id, session_key);
