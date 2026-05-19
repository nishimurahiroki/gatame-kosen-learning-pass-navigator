/** Bottom Bar の Unlock と同一の Member / Join セレクターを開く（詳細は AppBottomBar が購読）。 */
export const GATAME_OPEN_UNLOCK_MENU_EVENT = 'gatame-open-unlock-menu'

export type OpenUnlockMenuEventDetail = {
  /** 学習パス完了モーダル等より前面に Unlock UI を出す */
  elevated?: boolean
}

export function openMembershipUnlockMenu(detail?: OpenUnlockMenuEventDetail): void {
  window.dispatchEvent(new CustomEvent(GATAME_OPEN_UNLOCK_MENU_EVENT, { detail: detail ?? {} }))
}
