/**
 * Supabase クライアントのエントリポイント。
 * 実体は `lib/supabase.ts`。認証画面からはここを import する。
 */
export {
  isSupabaseConfigured,
  missingSupabaseEnvKeys,
  supabase,
} from '../lib/supabase'
