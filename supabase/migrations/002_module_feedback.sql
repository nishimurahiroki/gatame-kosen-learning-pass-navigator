-- ============================================================
-- Gatame Learning Pass: Module Feedback Table
-- ============================================================
-- Run this SQL in the Supabase Dashboard > SQL Editor
-- このスクリプトは何度実行しても安全（冪等）です。
-- ============================================================

-- --------------------------------------------------------
-- Table: module_feedback
--   ユーザーが完了時に送信した難易度・満足度フィードバック
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.module_feedback (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
  module_id       text        NOT NULL,
  difficulty      text        NOT NULL CHECK (difficulty IN ('TOO_EASY', 'JUST_RIGHT', 'TOO_HARD')),
  satisfaction    smallint    NOT NULL CHECK (satisfaction BETWEEN 1 AND 5),
  comment         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.module_feedback ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のフィードバックのみ INSERT・SELECT 可能
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.module_feedback;
CREATE POLICY "Users can insert their own feedback"
  ON public.module_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own feedback" ON public.module_feedback;
CREATE POLICY "Users can read their own feedback"
  ON public.module_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- Index（読み取りパフォーマンス用）
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_module_feedback_module
  ON public.module_feedback (module_id);

CREATE INDEX IF NOT EXISTS idx_module_feedback_user
  ON public.module_feedback (user_id);
