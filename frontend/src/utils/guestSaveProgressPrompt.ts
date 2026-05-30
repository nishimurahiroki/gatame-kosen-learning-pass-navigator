import { isGuestStorageId } from './guestDevice'

const PROMPT_PREFIX = 'gatame.guest-save-prompt.v1:'

export type GuestSavePromptTrigger = 'drawer' | 'todo'

function promptKey(storageId: string, fingerprint: string, trigger: GuestSavePromptTrigger): string {
  return `${PROMPT_PREFIX}${storageId}:${fingerprint}:${trigger}`
}

/**
 * Guest 向け Save progress 推薦を初回トリガーごとに 1 回だけ実行する。
 * @returns 推薦を表示した場合 true
 */
export function tryGuestSaveProgressPrompt(
  storageId: string,
  fingerprint: string,
  trigger: GuestSavePromptTrigger,
  onRecommend: () => void,
): boolean {
  if (!storageId || !fingerprint || !isGuestStorageId(storageId)) return false
  try {
    const key = promptKey(storageId, fingerprint, trigger)
    if (localStorage.getItem(key) === '1') return false
    localStorage.setItem(key, '1')
  } catch {
    /* private mode: still show once per session via caller if needed */
  }
  onRecommend()
  return true
}
