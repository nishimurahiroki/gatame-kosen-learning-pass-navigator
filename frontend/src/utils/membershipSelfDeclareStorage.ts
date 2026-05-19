const STORAGE_KEY = 'gatame.member-self-declare.v1' as const
export const MEMBER_SELF_DECLARE_STORAGE_KEY = STORAGE_KEY
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

export function saveMemberSelfDeclared(): void {
  try {
    localStorage.setItem(STORAGE_KEY, MEMBER_VALUE)
  } catch {
    /* プライベートモード等 */
  }
}
