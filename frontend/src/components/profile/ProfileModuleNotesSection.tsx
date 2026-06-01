import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { moduleCategoryLabel } from '../../api/learningPathApi'
import { loadRemoteSessionMemoEntries, type RemoteModuleMemoEntry } from '../../api/supabaseProgressApi'
import { ghostGoldCtaSubtleClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'
import { ModuleMemoPersistError, persistModuleMemo } from '../../utils/persistModuleMemo'
import type { ScoredModule } from '../../types'
import { progressSessionId } from '../../utils/progressStorage'
import { GATAME_MODULE_MEMO_CHANGED_EVENT, requestOpenPathModule } from '../../utils/moduleMemoEvents'
import { GATAME_SYNC_CHANGED_EVENT } from '../../sync/syncTypes'
import { showToast } from '../common/Toast'
import ConfirmDialog from '../common/ConfirmDialog'
import type { AssessmentRequest } from '../../types'

const MEMO_PREVIEW_LENGTH = 140

function scrollToLearningPath() {
  const path = document.getElementById('gatame-learning-path')
  const fallback = document.getElementById('gatame-app-main')
  ;(path ?? fallback)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function formatMemoUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function previewMemo(memo: string): string {
  const text = memo.trim()
  if (text.length <= MEMO_PREVIEW_LENGTH) return text
  return `${text.slice(0, MEMO_PREVIEW_LENGTH).trimEnd()}…`
}

function resolveModuleTitle(moduleId: string, catalog: Map<string, ScoredModule>): string {
  const mod = catalog.get(moduleId)
  if (mod?.name?.trim()) return mod.name.trim()
  return moduleCategoryLabel(moduleId)
}

export interface ProfileModuleNotesSectionProps {
  profileOpen: boolean
  userId: string
  assessmentRequest: AssessmentRequest | null
  recommendedModules: ScoredModule[]
  onCloseProfile: () => void
}

export default function ProfileModuleNotesSection({
  profileOpen,
  userId,
  assessmentRequest,
  recommendedModules,
  onCloseProfile,
}: ProfileModuleNotesSectionProps) {
  const sessionKey = useMemo(
    () => (assessmentRequest ? progressSessionId(assessmentRequest) : ''),
    [assessmentRequest],
  )

  const moduleCatalog = useMemo(() => {
    const m = new Map<string, ScoredModule>()
    for (const mod of recommendedModules) m.set(mod.id, mod)
    return m
  }, [recommendedModules])

  const [entries, setEntries] = useState<RemoteModuleMemoEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draftByModule, setDraftByModule] = useState<Record<string, string>>({})
  const [savingModuleId, setSavingModuleId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RemoteModuleMemoEntry | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId || !sessionKey) {
      setEntries([])
      return
    }
    setLoading(true)
    try {
      const rows = await loadRemoteSessionMemoEntries(userId, sessionKey)
      setEntries(rows)
    } finally {
      setLoading(false)
    }
  }, [userId, sessionKey])

  useEffect(() => {
    if (!profileOpen) {
      setExpandedId(null)
      setDeleteTarget(null)
      setNotice(null)
      return
    }
    void reload()
  }, [profileOpen, reload])

  useEffect(() => {
    if (!profileOpen) return
    const onRefresh = () => void reload()
    window.addEventListener(GATAME_MODULE_MEMO_CHANGED_EVENT, onRefresh)
    window.addEventListener(GATAME_SYNC_CHANGED_EVENT, onRefresh)
    return () => {
      window.removeEventListener(GATAME_MODULE_MEMO_CHANGED_EVENT, onRefresh)
      window.removeEventListener(GATAME_SYNC_CHANGED_EVENT, onRefresh)
    }
  }, [profileOpen, reload])

  useEffect(() => {
    if (!expandedId) return
    const entry = entries.find((e) => e.moduleId === expandedId)
    if (!entry) return
    setDraftByModule((prev) => ({ ...prev, [expandedId]: entry.memo }))
  }, [entries, expandedId])

  const beginEdit = useCallback((entry: RemoteModuleMemoEntry) => {
    setExpandedId(entry.moduleId)
    setDraftByModule((prev) => ({ ...prev, [entry.moduleId]: entry.memo }))
    setNotice(null)
  }, [])

  const handleSave = useCallback(
    async (entry: RemoteModuleMemoEntry) => {
      const nextMemo = (draftByModule[entry.moduleId] ?? entry.memo).trim()
      if (!nextMemo) {
        setDeleteTarget(entry)
        return
      }
      if (!sessionKey) return
      setSavingModuleId(entry.moduleId)
      setNotice(null)
      try {
        await persistModuleMemo(userId, sessionKey, entry.moduleId, {
          checkedItems: entry.checkedItems,
          memo: nextMemo,
        })
        setNotice(en.profileNotes.saved)
        await reload()
        setExpandedId(entry.moduleId)
      } catch (err) {
        if (err instanceof ModuleMemoPersistError) {
          showToast(en.toast.memoSaveFailed, 'error')
        }
      } finally {
        setSavingModuleId(null)
      }
    },
    [draftByModule, reload, sessionKey, userId],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || !sessionKey) return
    setSavingModuleId(deleteTarget.moduleId)
    setNotice(null)
    try {
      await persistModuleMemo(userId, sessionKey, deleteTarget.moduleId, {
        checkedItems: deleteTarget.checkedItems,
        memo: '',
      })
      setNotice(en.profileNotes.deleted)
      setExpandedId(null)
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      if (err instanceof ModuleMemoPersistError) {
        showToast(en.toast.memoSaveFailed, 'error')
      }
    } finally {
      setSavingModuleId(null)
    }
  }, [deleteTarget, reload, sessionKey, userId])

  const handleOpenInPath = useCallback(
    (moduleId: string) => {
      onCloseProfile()
      requestOpenPathModule(moduleId)
      window.setTimeout(scrollToLearningPath, 120)
    },
    [onCloseProfile],
  )

  if (!sessionKey) return null

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#060b14]/80 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/38">
        {en.profileNotes.heading}
      </p>

      {notice ? (
        <p className="mt-3 rounded-lg border border-gatame-goldHi/35 bg-gatame-gold/[0.06] px-3 py-2 text-xs text-gatame-goldHi">
          {notice}
        </p>
      ) : null}

      {loading && entries.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">{en.profileNotes.loading}</p>
      ) : null}

      {!loading && entries.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-white/55">{en.profileNotes.empty}</p>
      ) : null}

      {entries.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => {
            const expanded = expandedId === entry.moduleId
            const title = resolveModuleTitle(entry.moduleId, moduleCatalog)
            const draft = draftByModule[entry.moduleId] ?? entry.memo
            const busy = savingModuleId === entry.moduleId
            const updatedLabel = en.profileNotes.updated.replace(
              '{date}',
              formatMemoUpdated(entry.updatedAt),
            )

            return (
              <li
                key={entry.moduleId}
                className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-white">{title}</p>
                    <p className="mt-1 text-[11px] text-white/40">{updatedLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      expanded ? setExpandedId(null) : beginEdit(entry)
                    }
                    className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-gatame-gold/85 hover:text-gatame-goldHi"
                  >
                    {expanded ? en.profileNotes.collapse : en.profileNotes.expand}
                  </button>
                </div>

                {!expanded ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/72">
                    {previewMemo(entry.memo)}
                  </p>
                ) : null}

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-3">
                        <label className="sr-only" htmlFor={`profile-memo-${entry.moduleId}`}>
                          {en.profileNotes.editLabel}
                        </label>
                        <textarea
                          id={`profile-memo-${entry.moduleId}`}
                          value={draft}
                          onChange={(e) =>
                            setDraftByModule((prev) => ({
                              ...prev,
                              [entry.moduleId]: e.target.value,
                            }))
                          }
                          rows={5}
                          className="w-full resize-y rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-gatame-gold/50 focus:outline-none focus:ring-1 focus:ring-gatame-gold/30"
                          placeholder={en.pathDrawer.memoPlaceholder}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleSave(entry)}
                            className={`${ghostGoldCtaSubtleClass} px-5 py-2.5 text-[10px]`}
                          >
                            {busy ? en.profileNotes.saving : en.profileNotes.save}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setDeleteTarget(entry)}
                            className="rounded-xl px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-rose-300/90"
                          >
                            {en.profileNotes.delete}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenInPath(entry.moduleId)}
                            className="rounded-xl px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 transition-colors hover:text-gatame-goldHi"
                          >
                            {en.profileNotes.openInPath}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={en.profileNotes.deleteTitle}
        description={en.profileNotes.deleteDescription}
        confirmLabel={en.profileNotes.deleteConfirm}
        cancelLabel={en.profileNotes.deleteCancel}
        tone="destructive"
        busy={Boolean(savingModuleId)}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}
