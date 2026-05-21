import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

/** 環境変数が両方揃っていない場合は false。App.tsx が EnvErrorScreen に切替える。 */
export const isSupabaseConfigured: boolean = Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

/** 未設定でも throw せず null を返し、上位で graceful にエラー画面へ倒す。 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const missingSupabaseEnvKeys: string[] = [
  ...(supabaseUrl ? [] : ['NEXT_PUBLIC_SUPABASE_URL']),
  ...(supabaseAnonKey ? [] : ['NEXT_PUBLIC_SUPABASE_ANON_KEY']),
]
