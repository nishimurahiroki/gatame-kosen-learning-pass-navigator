const DEVICE_ID_KEY = 'gatame.guest-device-id.v1'

/** Guest 用 localStorage スコープ ID（specification.md §10.3） */
export function getGuestStorageId(): string {
  if (typeof window === 'undefined') return 'guest:ssr'
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return `guest:${id}`
  } catch {
    return 'guest:ephemeral'
  }
}

export function isGuestStorageId(storageId: string): boolean {
  return storageId.startsWith('guest:')
}
