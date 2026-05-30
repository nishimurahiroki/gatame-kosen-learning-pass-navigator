const STORAGE_KEY = 'gatame.member-self-declare.v1' as const
const MEMBER_VALUE = '1'

/** Kajabi 会員ログイン（Bottom Bar・テクニック詳細の Login 導線で使用） */
export const KAJABI_MEMBER_LOGIN_URL = 'https://www.kosenjudoonline.com/login'

export function loadMemberSelfDeclared(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === MEMBER_VALUE
  } catch {
    return false
  }
}
