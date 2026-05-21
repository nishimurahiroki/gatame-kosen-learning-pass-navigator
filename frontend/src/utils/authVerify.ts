import { supabase } from './supabaseClient'

/** DB の user_id FK 違反（auth.users に行が無い＝古いセッション等） */
export function isInvalidAuthUserDbError(message: string): boolean {
  return /user_id_fkey|foreign key constraint/i.test(message)
}

/**
 * 有効な認証ユーザーを取得。JWT が古い・ユーザー削除済みのときは signOut して null。
 */
export async function resolveAuthenticatedUserId(): Promise<string | null> {
  if (!supabase) return null

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    if (error) {
      await supabase.auth.signOut()
    }
    return null
  }
  return user.id
}
