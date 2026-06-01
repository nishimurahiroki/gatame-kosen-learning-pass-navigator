export const GATAME_MODULE_MEMO_CHANGED_EVENT = 'gatame-module-memo-changed' as const

export const GATAME_OPEN_PATH_MODULE_EVENT = 'gatame-open-path-module' as const

export type OpenPathModuleEventDetail = { moduleId: string }

/** Profile など他画面からの更新。学習パスは detail をそのまま state に反映する */
export type ModuleMemoChangedDetail = {
  moduleId: string
  memo: string
  checkedItems?: Record<string, boolean>
}

type ModuleMemoListener = (detail: ModuleMemoChangedDetail) => void

const moduleMemoListeners = new Set<ModuleMemoListener>()

/** CustomEvent と併用し、確実に学習パスへメモ変更を伝える */
export function subscribeModuleMemoChanged(listener: ModuleMemoListener): () => void {
  moduleMemoListeners.add(listener)
  return () => moduleMemoListeners.delete(listener)
}

export function notifyModuleMemoChanged(detail?: ModuleMemoChangedDetail): void {
  if (typeof window === 'undefined') return
  if (detail) {
    for (const listener of moduleMemoListeners) {
      listener(detail)
    }
  }
  window.dispatchEvent(
    new CustomEvent<ModuleMemoChangedDetail | undefined>(GATAME_MODULE_MEMO_CHANGED_EVENT, {
      detail,
    }),
  )
}

export function requestOpenPathModule(moduleId: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<OpenPathModuleEventDetail>(GATAME_OPEN_PATH_MODULE_EVENT, {
      detail: { moduleId },
    }),
  )
}
