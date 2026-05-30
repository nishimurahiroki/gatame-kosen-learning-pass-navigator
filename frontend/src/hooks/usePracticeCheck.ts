import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScoredModule } from '../types'
import { moduleTodoItemsFromModule, practiceHintsFromModule } from '../utils/modulePracticeTodos'
import { getTechniqueFocusPoints } from '../constants/techniqueFocusPoints'
import en from '../locales/en.json'
import {
  getAppLaunchCount,
  isPathGeneratedThisSession,
  isPracticeCheckAutoShownThisSession,
  loadPracticeCheckState,
  markPracticeCheckAutoShownThisSession,
  savePracticeCheckState,
  type SavedPracticeCheckState,
} from '../utils/practiceCheckPersistence'

const SNOOZE_MS = 6 * 60 * 60 * 1000
const UNDO_MS = 5_000

const EDU_MESSAGES = en.todaysFocus.notWorkingEduMessages

export type PracticeTechniqueTarget = {
  moduleId: string
  moduleName: string
  techniqueId: string
  techniqueName: string
  focusPoints: [string, string, string]
}

export type PracticeCheckStatus = 'focus' | 'bbsPromo'

function buildFocusPoints(module: ScoredModule, techniqueName: string): [string, string, string] {
  const fromMaster = getTechniqueFocusPoints(module.id, techniqueName)
  if (fromMaster) return fromMaster
  const base = practiceHintsFromModule(module)
  const p1 = base[0] ?? `Start with clean setup for ${techniqueName}.`
  const p2 = base[1] ?? 'Keep posture and pressure connected through the movement.'
  const p3 = base[2] ?? 'Finish with controlled timing before increasing speed.'
  return [p1, p2, p3]
}

function defaultState(): SavedPracticeCheckState {
  return { snoozeUntil: 0, updatedAt: 0 }
}

type UsePracticeCheckArgs = {
  storageId: string
  assessmentFingerprint: string
  modulesInUiOrder: ScoredModule[]
  checkedByModule: Record<string, Record<string, boolean>>
  onSetTechniqueChecked: (moduleId: string, techniqueId: string, checked: boolean) => void
}

export function usePracticeCheck({
  storageId,
  assessmentFingerprint,
  modulesInUiOrder,
  checkedByModule,
  onSetTechniqueChecked,
}: UsePracticeCheckArgs) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<PracticeCheckStatus>('focus')
  const [educationMessage, setEducationMessage] = useState(EDU_MESSAGES[0] ?? '')
  const [practiceState, setPracticeState] = useState<SavedPracticeCheckState>(defaultState)
  const [undoUntil, setUndoUntil] = useState(0)
  const undoTargetRef = useRef<PracticeTechniqueTarget | null>(null)
  const undoTimerRef = useRef<number | null>(null)
  const autoShownRef = useRef(false)

  useEffect(() => {
    if (!storageId || !assessmentFingerprint) {
      setPracticeState(defaultState())
      return
    }
    setPracticeState(loadPracticeCheckState(storageId, assessmentFingerprint) ?? defaultState())
  }, [storageId, assessmentFingerprint])

  useEffect(() => {
    return () => {
      if (undoTimerRef.current != null) window.clearTimeout(undoTimerRef.current)
    }
  }, [])

  const currentTarget = useMemo<PracticeTechniqueTarget | null>(() => {
    for (const module of modulesInUiOrder) {
      const items = moduleTodoItemsFromModule(module)
      if (!items.length) continue
      const checkedMap = checkedByModule[module.id] ?? {}
      for (const item of items) {
        const completed = checkedMap[item.id]
        if (completed) continue
        return {
          moduleId: module.id,
          moduleName: module.name,
          techniqueId: item.id,
          techniqueName: item.label,
          focusPoints: buildFocusPoints(module, item.label),
        }
      }
    }
    return null
  }, [modulesInUiOrder, checkedByModule])

  const hasPendingTechnique = Boolean(currentTarget)

  useEffect(() => {
    if (autoShownRef.current) return
    if (!storageId || !assessmentFingerprint) return
    if (isPracticeCheckAutoShownThisSession(storageId)) return
    if (isPathGeneratedThisSession(storageId)) return
    if (!hasPendingTechnique) return
    if (getAppLaunchCount(storageId) < 2) return
    if (Date.now() < practiceState.snoozeUntil) return

    autoShownRef.current = true
    markPracticeCheckAutoShownThisSession(storageId)
    setStatus('focus')
    setOpen(true)
  }, [
    assessmentFingerprint,
    hasPendingTechnique,
    practiceState.snoozeUntil,
    storageId,
  ])

  const commitState = useCallback(
    (updater: (prev: SavedPracticeCheckState) => SavedPracticeCheckState) => {
      setPracticeState((prev) => {
        const next = updater(prev)
        savePracticeCheckState(storageId, assessmentFingerprint, next)
        return next
      })
    },
    [storageId, assessmentFingerprint],
  )

  const openManually = useCallback(() => {
    if (!hasPendingTechnique) return
    setStatus('focus')
    setOpen(true)
  }, [hasPendingTechnique])

  const handleNotNow = useCallback(() => {
    commitState((prev) => ({
      ...prev,
      snoozeUntil: Date.now() + SNOOZE_MS,
      updatedAt: Date.now(),
    }))
    setOpen(false)
    setStatus('focus')
  }, [commitState])

  const handleBackToFocus = useCallback(() => {
    setStatus('focus')
  }, [])

  const handleSuccess = useCallback(() => {
    if (!currentTarget) return
    onSetTechniqueChecked(currentTarget.moduleId, currentTarget.techniqueId, true)
    commitState((prev) => ({ ...prev, updatedAt: Date.now() }))
    undoTargetRef.current = currentTarget
    setUndoUntil(Date.now() + UNDO_MS)
    if (undoTimerRef.current != null) window.clearTimeout(undoTimerRef.current)
    undoTimerRef.current = window.setTimeout(() => {
      setUndoUntil(0)
      undoTargetRef.current = null
      setStatus('focus')
      if (!currentTarget) {
        setOpen(false)
      }
    }, UNDO_MS)
  }, [commitState, currentTarget, onSetTechniqueChecked])

  const handleUndo = useCallback(() => {
    const target = undoTargetRef.current
    if (!target) return
    onSetTechniqueChecked(target.moduleId, target.techniqueId, false)
    commitState((prev) => ({ ...prev, updatedAt: Date.now() }))
    if (undoTimerRef.current != null) window.clearTimeout(undoTimerRef.current)
    undoTimerRef.current = null
    undoTargetRef.current = null
    setUndoUntil(0)
  }, [commitState, onSetTechniqueChecked])

  useEffect(() => {
    if (!hasPendingTechnique && open) {
      setOpen(false)
    }
  }, [hasPendingTechnique, open])

  const handleNotWorking = useCallback(() => {
    setStatus('bbsPromo')
    const messages = EDU_MESSAGES
    setEducationMessage(messages[Math.floor(Math.random() * messages.length)] ?? messages[0] ?? '')
  }, [])

  return {
    open,
    status,
    educationMessage,
    currentTarget,
    hasPendingTechnique,
    undoUntil,
    setOpen,
    openManually,
    handleNotNow,
    handleBackToFocus,
    handleSuccess,
    handleUndo,
    handleNotWorking,
  }
}
