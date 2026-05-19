import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { moduleCategoryLabel } from '../../api/learningPathApi'
import en from '../../locales/en.json'
import type { ScoredModule } from '../../types'
import {
  allTodosChecked,
  countCheckedTodos,
  type ModuleTodoItem,
} from '../../utils/modulePracticeTodos'
import { TodoCheckboxBurst } from './TodoCheckboxBurst'
import ReferenceVideoAccessPromo from './ReferenceVideoAccessPromo'

export interface VerticalPathDrawerPanelProps {
  drawerModule: ScoredModule
  compact: boolean
  closeDrawer: () => void
  completedIds: Set<string>
  drawerPrereqOk: boolean
  todoItems: ModuleTodoItem[]
  checkedMap: Record<string, boolean>
  memoText: string
  onToggleTodo: (moduleId: string, itemId: string, checked: boolean) => void | Promise<void>
  onMemoSave: (moduleId: string, memo: string) => void | Promise<void>
  onRequestCompleteFeedback: (moduleId: string) => void
  onToggleCompleteUndo: (moduleId: string) => void
}

function useCountUpPercent(target: number) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const from = Math.round(mv.get())
    mv.set(from)
    const c = animate(mv, target, {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => c.stop()
  }, [target, mv])

  return display
}

export default function VerticalPathDrawerPanel({
  drawerModule,
  compact,
  closeDrawer,
  completedIds,
  drawerPrereqOk,
  todoItems,
  checkedMap,
  memoText,
  onToggleTodo,
  onMemoSave,
  onRequestCompleteFeedback,
  onToggleCompleteUndo,
}: VerticalPathDrawerPanelProps) {
  const moduleId = drawerModule.id
  const total = todoItems.length
  const checkedCount = useMemo(() => countCheckedTodos(todoItems, checkedMap), [todoItems, checkedMap])
  const pct = total === 0 ? 100 : Math.round((checkedCount / total) * 100)
  const displayPct = useCountUpPercent(pct)

  const todoHead = total > 5 ? todoItems.slice(0, 5) : todoItems
  const todoTail = total > 5 ? todoItems.slice(5) : []
  const tailCount = todoTail.length

  const [memoLocal, setMemoLocal] = useState(memoText)
  const [memoSavedAt, setMemoSavedAt] = useState<number>(0)
  const [savingMemo, setSavingMemo] = useState(false)
  const [learnNudge, setLearnNudge] = useState(false)
  const [burstByItem, setBurstByItem] = useState<Record<string, number>>({})
  const prevCheckedRef = useRef<number | null>(null)
  const savedMemoRef = useRef(memoText)

  useEffect(() => {
    setMemoLocal(memoText)
    savedMemoRef.current = memoText
  }, [memoText, moduleId])

  useEffect(() => {
    if (prevCheckedRef.current === null) {
      prevCheckedRef.current = checkedCount
      return
    }
    if (checkedCount > prevCheckedRef.current) {
      setLearnNudge(true)
      const t = window.setTimeout(() => setLearnNudge(false), 4200)
      prevCheckedRef.current = checkedCount
      return () => window.clearTimeout(t)
    }
    prevCheckedRef.current = checkedCount
  }, [checkedCount])

  const completed = completedIds.has(moduleId)
  const allChecked = allTodosChecked(todoItems, checkedMap)
  const canComplete =
    !drawerModule.locked && drawerPrereqOk && !completed && allChecked && total > 0

  const handleTodoChange = useCallback(
    async (itemId: string, next: boolean) => {
      await onToggleTodo(moduleId, itemId, next)
      if (next) {
        setBurstByItem((prev) => ({
          ...prev,
          [itemId]: (prev[itemId] ?? 0) + 1,
        }))
      }
    },
    [moduleId, onToggleTodo],
  )

  const flushMemo = useCallback(async () => {
    if (memoLocal === savedMemoRef.current) return
    setSavingMemo(true)
    try {
      await onMemoSave(moduleId, memoLocal)
      savedMemoRef.current = memoLocal
      setMemoSavedAt(Date.now())
    } catch {
      /* 失敗時は memoSavedAt を更新せず、Unsaved 表示を維持。トーストは onMemoSave 側で発火済み */
    } finally {
      setSavingMemo(false)
    }
  }, [memoLocal, moduleId, onMemoSave])

  const handleMemoBlur = useCallback(() => {
    void flushMemo()
  }, [flushMemo])

  /** Drawer のアンマウント／moduleId 切替時に未保存メモを flush（フォーカスを当てたまま閉じる事故対策） */
  useEffect(() => {
    return () => {
      if (memoLocal !== savedMemoRef.current) {
        void onMemoSave(moduleId, memoLocal)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  const memoDirty = memoLocal !== savedMemoRef.current

  const renderTodoRow = useCallback(
    (item: ModuleTodoItem) => {
      const checked = Boolean(checkedMap[item.id])
      return (
        <li key={item.id} className="flex gap-3 rounded-xl border border-slate-700/60 bg-slate-950/40 p-3">
          <label className="relative flex cursor-pointer items-start gap-3">
            <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
              <TodoCheckboxBurst fire={burstByItem[item.id] ?? 0} />
              <input
                type="checkbox"
                checked={checked}
                disabled={completed}
                onChange={(e) => void handleTodoChange(item.id, e.target.checked)}
                className="peer relative z-10 h-5 w-5 cursor-pointer rounded border-2 border-slate-500 bg-slate-900 text-yellow-600 accent-yellow-600 focus:ring-2 focus:ring-yellow-600/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </span>
            <span className={`text-sm leading-snug ${checked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
              {item.label}
            </span>
          </label>
        </li>
      )
    },
    [burstByItem, checkedMap, completed, handleTodoChange],
  )

  return (
    <div
      className={`flex h-full flex-col bg-slate-900 ${compact ? 'max-h-[min(72vh,520px)]' : 'max-h-screen'}`}
    >
      <div
        className={`overflow-y-auto px-5 pb-8 pt-2 text-slate-200 ${compact ? '' : 'pt-6'} min-h-0 flex-1`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-yellow-600/95">
              {moduleCategoryLabel(drawerModule.id)}
            </p>
            <h3
              className={`mt-1 font-bold leading-tight text-slate-200 ${compact ? 'text-lg' : 'text-2xl'}`}
            >
              {drawerModule.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            {en.common.close}
          </button>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{en.pathDrawer.progress}</p>
            <p className="text-2xl font-black tabular-nums text-yellow-500">
              {displayPct}
              <span className="text-lg">%</span>
            </p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-amber-300 transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <p className={`mt-5 leading-relaxed text-slate-300 ${compact ? 'text-sm' : 'text-base'}`}>
          {drawerModule.description}
        </p>

        <div className="mt-6 border-t border-slate-700/80 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {en.pathDrawer.practiceChecklist}
          </p>
          <ul className="mt-3 space-y-3">{todoHead.map(renderTodoRow)}</ul>
          {tailCount > 0 ? (
            <details
              key={`todo-more-${moduleId}`}
              className="mt-3 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/25 open:border-yellow-600/35"
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-yellow-500/95 outline-none ring-inset hover:bg-slate-800/50 [&::-webkit-details-marker]:hidden">
                {en.pathDrawer.showMore.replace('{n}', String(tailCount))}
              </summary>
              <ul className="space-y-3 border-t border-slate-700/50 px-1 py-3">{todoTail.map(renderTodoRow)}</ul>
            </details>
          ) : null}
        </div>

        <div className="mt-6 border-t border-slate-700/80 pt-5">
          <ReferenceVideoAccessPromo videoUrl={drawerModule.videoUrl ?? ''} />
        </div>

        <div className="relative mt-8 border-t border-slate-700/80 pt-5">
          <AnimatePresence>
            {learnNudge ? (
              <motion.div
                key="learn-nudge"
                className="pointer-events-none absolute -top-3 left-0 right-0 z-10 flex justify-center"
                aria-live="polite"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <span className="rounded-full border border-yellow-600/50 bg-yellow-600/15 px-4 py-1.5 text-xs font-bold text-yellow-200 shadow-lg">
                  {en.pathDrawer.recordInsights}
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`module-memo-${moduleId}`}>
              {en.pathDrawer.moduleMemoLabel}
            </label>
            <span
              aria-live="polite"
              className={`text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                savingMemo
                  ? 'text-slate-400'
                  : memoDirty
                    ? 'text-amber-300/85'
                    : memoSavedAt
                      ? 'text-emerald-400/85'
                      : 'text-transparent'
              }`}
            >
              {savingMemo
                ? en.pathDrawer.memoSaving
                : memoDirty
                  ? en.pathDrawer.memoUnsaved
                  : memoSavedAt
                    ? en.pathDrawer.memoSaved
                    : ''}
            </span>
          </div>
          <textarea
            id={`module-memo-${moduleId}`}
            rows={compact ? 5 : 7}
            value={memoLocal}
            onChange={(e) => setMemoLocal(e.target.value)}
            onBlur={handleMemoBlur}
            placeholder={en.pathDrawer.memoPlaceholder}
            className="mt-2 w-full resize-y rounded-xl border border-slate-600/80 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600/40"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!memoDirty || savingMemo}
              onClick={() => void flushMemo()}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                memoDirty && !savingMemo
                  ? 'border-yellow-600/80 bg-yellow-600/10 text-yellow-200 hover:bg-yellow-600/20'
                  : 'cursor-not-allowed border-slate-700/70 bg-slate-900/40 text-slate-500'
              }`}
            >
              {savingMemo ? en.pathDrawer.memoSaving : en.pathDrawer.memoSave}
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-700/80 pt-5">
          {!drawerPrereqOk && !completed ? (
            <p className="text-center text-xs text-amber-200/90">{en.pathDrawer.prereqForComplete}</p>
          ) : null}
          {drawerModule.locked && !completed ? (
            <p className="text-center text-xs text-slate-500">{en.pathDrawer.lockedByAssessment}</p>
          ) : null}
          {!completed && drawerPrereqOk && !drawerModule.locked && !allChecked ? (
            <p className="text-center text-xs text-slate-400">{en.pathDrawer.allTodosForComplete}</p>
          ) : null}

          {completed ? (
            <button
              type="button"
              onClick={() => onToggleCompleteUndo(moduleId)}
              className="w-full rounded-xl border border-emerald-500/50 bg-emerald-600/20 py-3 text-sm font-bold text-emerald-100 transition-colors hover:bg-emerald-600/30"
            >
              {en.pathDrawer.undoCompletion}
            </button>
          ) : (
            <button
              type="button"
              disabled={drawerModule.locked || !drawerPrereqOk || !canComplete}
              onClick={() => onRequestCompleteFeedback(moduleId)}
              className={`w-full rounded-xl py-3 text-sm font-bold transition-colors ${
                canComplete
                  ? 'bg-yellow-600 text-slate-950 hover:brightness-110'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              {en.pathDrawer.markStepCompleted}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
