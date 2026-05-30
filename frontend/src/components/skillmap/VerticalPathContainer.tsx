import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { ReactFlowProvider, useEdgesState, useNodesState } from 'reactflow'
import type { Edge, Node } from 'reactflow'
import { isNoviceUser, moduleCategoryLabel } from '../../api/learningPathApi'
import {
  buildFourPlusOnePath,
  extractGeneratedPathModules,
  prerequisitesMetOnLearningPath,
  trailEdgeCleared,
} from '../../api/streetPathWithBbs'
import {
  postModuleFeedback,
  type DifficultyFeedbackApi,
} from '../../api/progressApi'
import {
  loadLifetimeMasteredModuleIds,
  loadBbsDeclaredMasteredLevels,
  mergeLifetimeMasteredModuleIds,
  removeLifetimeMasteredModuleIds,
  canGenerateNextPath,
  ensurePathSessionAligned,
  GATAME_MODULE_PROGRESS_CHANGED_EVENT,
  loadPathSessionCompletedIds,
  savePathSessionCompletedIds,
  progressSessionId,
  addCompletedBbsLevel,
} from '../../utils/progressStorage'
import {
  isPathStageCompleteDismissed,
  markPathStageCompleteDismissed,
} from '../../utils/pathStageCompleteStorage'
import { allTodosChecked, moduleTodoItemsFromModule } from '../../utils/modulePracticeTodos'
import {
  loadHasAnnualMembership,
  saveAnnualMembershipAccess,
} from '../../utils/annualMembershipAccess'
import {
  isAnnualMembershipPromoOnCooldown,
  markAnnualMembershipPromoDismissed,
} from '../../utils/annualMembershipPromoStorage'
import en from '../../locales/en.json'
import {
  loadRemoteModuleProgress,
  loadRemoteSessionDetails,
  saveRemoteModuleFeedback,
} from '../../api/supabaseProgressApi'
import { syncModuleDetail, syncModuleProgress } from '../../sync/syncService'
import { showToast } from '../common/Toast'
import ModuleCompleteFeedbackDialog from './ModuleCompleteFeedbackDialog'
import VerticalPathDrawerPanel from './VerticalPathDrawerPanel'
import type { AssessmentRequest, LearningPathResponse, ScoredModule } from '../../types'
import { usePracticeCheck } from '../../hooks/usePracticeCheck'
import BbsPathStepNode, { type BbsPathStepNodeData } from './BbsPathStepNode'
import BbsOfferDrawerPanel from './BbsOfferDrawerPanel'
import PathStepNode, { type PathStepNodeData, type PathStepVisualState } from './PathStepNode'
import ProgressTrailEdge, { type ProgressTrailEdgeData } from './ProgressTrailEdge'
import { computePathLayout, PATH_BREAKPOINT_LG } from './verticalPathLayout'
import { resolveTrailHandles } from './pathTrailHandles'
import AnnualMembershipPromoOverlay from './AnnualMembershipPromoOverlay'
import PathStageCompleteOverlay from './PathStageCompleteOverlay'
import PracticeCheckCard from '../practice/PracticeCheckCard'

const nodeTypes = { pathStep: PathStepNode, bbsStep: BbsPathStepNode }
const edgeTypes = { progressTrail: ProgressTrailEdge }

export type GuestEngagementKind = 'drawer_open' | 'todo_check'

export interface VerticalPathContainerProps {
  response: LearningPathResponse
  assessmentRequest?: AssessmentRequest | null
  /** ログイン中のユーザー ID（Supabase 同期用） */
  userId?: string
  /** Guest: guest:deviceId / Member: userId */
  storageId: string
  /** Guest: 初回ドロワー開封・初回 TODO チェック時の Save progress 推薦 */
  onGuestEngagement?: (kind: GuestEngagementKind) => void
  /** 4 モジュール完了後: 残モジュールから次パスを生成 */
  onGenerateNextPath?: () => Promise<void>
  /** 診断のやり直し（ConfirmDialog へ） */
  onRequestRetake?: () => void
  generatingNextPath?: boolean
}

function deriveVisualState(
  module: ScoredModule,
  completedIds: Set<string>,
  prerequisitesMet: boolean,
  activeId: string | null,
  pathEntryModuleId: string | null,
): PathStepVisualState {
  if (completedIds.has(module.id)) return 'completed'
  if (activeId === module.id) return 'active'
  if (
    pathEntryModuleId === module.id &&
    !module.locked &&
    !completedIds.has(module.id)
  ) {
    return 'active'
  }
  if (module.locked || !prerequisitesMet) return 'locked'
  return 'waiting'
}

function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(360)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (typeof w === 'number' && w > 0) setWidth(w)
    })
    ro.observe(el)
    setWidth(el.clientWidth || 360)
    return () => ro.disconnect()
  }, [])

  return { ref, width }
}

function useMediaWide() {
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= PATH_BREAKPOINT_LG,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${PATH_BREAKPOINT_LG}px)`)
    const fn = () => setWide(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return wide
}

function VerticalPathInner({
  response,
  assessmentRequest,
  userId,
  storageId,
  onGuestEngagement,
  onGenerateNextPath,
  onRequestRetake,
  generatingNextPath = false,
}: VerticalPathContainerProps) {
  const allRecommended = response.recommendedModules ?? []
  const pathUserAttribute = assessmentRequest?.userAttribute ?? response.userAttribute

  const assessmentRequestRef = useRef(assessmentRequest)
  assessmentRequestRef.current = assessmentRequest

  /** 診断内容が変わったときだけ変わる（completed のたびのオブジェクト差し替えでは変わらない） */
  const pathAssessmentKey = useMemo(
    () => (assessmentRequest ? progressSessionId(assessmentRequest) : ''),
    [assessmentRequest],
  )

  const apiPathModuleIds = useMemo(
    () => extractGeneratedPathModules(allRecommended).map((m) => m.id),
    [allRecommended],
  )

  /** 診断キー／Retake 時のみ再構築。完了のたびには組み直さない（4 モジュールを Pass 上に固定）。 */
  const pathItems = useMemo(() => {
    const pins = loadPathSessionCompletedIds(assessmentRequest ?? null, apiPathModuleIds)
    const pathModules = extractGeneratedPathModules(allRecommended)
    return buildFourPlusOnePath(allRecommended, {
      userAttribute: pathUserAttribute,
      recommendedBbsGrade: response.recommendedBbsGrade,
      pathModules,
      pinnedModuleIds: pins.size > 0 ? pins : undefined,
    })
  }, [
    allRecommended,
    pathUserAttribute,
    response.recommendedBbsGrade,
    pathAssessmentKey,
    assessmentRequest,
    apiPathModuleIds,
  ])

  const pathModuleIds = useMemo(
    () => pathItems.filter((it) => !it.isBbsModule).map((it) => it.module.id),
    [pathItems],
  )

  const pathEntryModuleId = pathModuleIds[0] ?? null

  const policyLockedModuleIds = useMemo(() => {
    if (isNoviceUser(pathUserAttribute)) return new Set<string>()
    const s = new Set<string>()
    for (const it of pathItems) {
      if (it.isBbsModule) continue
      if (it.module.locked) s.add(it.module.id)
    }
    return s
  }, [pathItems, pathUserAttribute])

  const sessionKey = useMemo(() => progressSessionId(assessmentRequest ?? null), [assessmentRequest])

  type ModuleProgressSlice = { checked: Record<string, boolean>; memo: string }
  const [progressByModule, setProgressByModule] = useState<Record<string, ModuleProgressSlice>>({})
  const [feedbackModuleId, setFeedbackModuleId] = useState<string | null>(null)

  const todoItemsByModule = useMemo(() => {
    const m = new Map<string, ReturnType<typeof moduleTodoItemsFromModule>>()
    for (const it of pathItems) {
      if (it.isBbsModule) continue
      m.set(it.module.id, moduleTodoItemsFromModule(it.module))
    }
    return m
  }, [pathItems])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      // Supabase からリモートデータをロード（ブラウザ間同期）
      const remote = await loadRemoteSessionDetails(userId, sessionKey)
      if (!cancelled && Object.keys(remote).length > 0) {
        const result: Record<string, ModuleProgressSlice> = {}
        for (const [mid, detail] of Object.entries(remote)) {
          result[mid] = {
            checked: detail.checkedItems ?? {},
            memo: detail.memo ?? '',
          }
        }
        setProgressByModule(result)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionKey, userId])

  const todosCompleteById = useMemo(() => {
    const out = new Map<string, boolean>()
    for (const it of pathItems) {
      if (it.isBbsModule) continue
      const mod = it.module
      const items = todoItemsByModule.get(mod.id) ?? []
      const checked = progressByModule[mod.id]?.checked ?? {}
      out.set(mod.id, allTodosChecked(items, checked))
    }
    return out
  }, [pathItems, todoItemsByModule, progressByModule])

  const { ref: widthRef, width: containerWidth } = useContainerWidth<HTMLDivElement>()
  const isWideLayout = useMediaWide()

  const [completedIds, setCompletedIds] = useState<Set<string>>(() =>
    loadPathSessionCompletedIds(assessmentRequest ?? null, pathModuleIds),
  )
  const [drawerModuleId, setDrawerModuleId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [parallaxY, setParallaxY] = useState(0)

  const assessmentFingerprint = useMemo(
    () => progressSessionId(assessmentRequest ?? null),
    [assessmentRequest],
  )

  /**
   * assessmentRequest が切り替わった際にローカルストレージから初期化し、
   * 並行して Supabase からリモートデータをマージする（新しい方を優先）。
   */
  useEffect(() => {
    if (!assessmentRequest || pathModuleIds.length === 0) return
    ensurePathSessionAligned(assessmentRequest, pathModuleIds)
    const localIds = loadPathSessionCompletedIds(assessmentRequest, pathModuleIds)
    setCompletedIds(localIds)

    if (!userId) return
    const fp = progressSessionId(assessmentRequest)
    const onPath = new Set(pathModuleIds)
    void loadRemoteModuleProgress(userId, fp).then((remote) => {
      if (!remote) return
      const merged = new Set(localIds)
      for (const id of remote.sessionCompletedIds) {
        if (onPath.has(id)) merged.add(id)
      }
      if (merged.size > localIds.size) {
        // クラウド側の古い全完了スナップショットを新パスに誤適用しない
        if (localIds.size === 0 && merged.size >= onPath.size) return
        setCompletedIds(merged)
        savePathSessionCompletedIds(assessmentRequest, pathModuleIds, merged)
      }
      // lifetime / BBS も localStorage に反映（ブラウザ間同期）
      for (const id of remote.lifetimeMasteredIds) {
        mergeLifetimeMasteredModuleIds(assessmentRequest, [id])
      }
      for (const lvl of remote.bbsDeclaredMasteredLevels) {
        addCompletedBbsLevel(assessmentRequest, lvl as import('../../constants/bbsOffers').BbsLevelKey)
      }
    })
  }, [assessmentRequest, pathAssessmentKey, pathModuleIds, userId])

  useEffect(() => {
    savePathSessionCompletedIds(assessmentRequest ?? null, pathModuleIds, completedIds)
    if (userId && assessmentRequest) {
      syncModuleProgress(userId, assessmentFingerprint, {
        sessionCompletedIds: [...completedIds],
        lifetimeMasteredIds: [...loadLifetimeMasteredModuleIds(assessmentRequest)],
        bbsDeclaredMasteredLevels: [...loadBbsDeclaredMasteredLevels(assessmentRequest)],
      })
    }
  }, [assessmentRequest, completedIds, pathModuleIds, userId, assessmentFingerprint])

  const techniqueIdsOnPath = useMemo(
    () => pathItems.filter((it) => !it.isBbsModule).map((it) => it.module.id),
    [pathItems],
  )

  const [lifetimeRevision, setLifetimeRevision] = useState(0)
  useEffect(() => {
    const onProgressChanged = () => setLifetimeRevision((n) => n + 1)
    window.addEventListener(GATAME_MODULE_PROGRESS_CHANGED_EVENT, onProgressChanged)
    return () => window.removeEventListener(GATAME_MODULE_PROGRESS_CHANGED_EVENT, onProgressChanged)
  }, [])

  const liveLifetime = useMemo(
    () => loadLifetimeMasteredModuleIds(assessmentRequest ?? null),
    [assessmentRequest, lifetimeRevision],
  )

  /** 前提・active・トレイル用: 現在パスのチェック＋過去ステージで習得済み（生涯） */
  const idsForPrerequisiteProgress = useMemo(() => {
    const s = new Set<string>()
    for (const id of completedIds) s.add(id)
    for (const id of liveLifetime) s.add(id)
    return s
  }, [completedIds, liveLifetime])

  const allTechniquesDone = useMemo(
    () => techniqueIdsOnPath.length > 0 && techniqueIdsOnPath.every((id) => completedIds.has(id)),
    [techniqueIdsOnPath, completedIds],
  )

  const pathCompleteOpen = allTechniquesDone

  const catalogModuleTotal = Math.max(1, response.totalModules ?? 1)
  const canGenerateNext = useMemo(
    () =>
      canGenerateNextPath(assessmentRequest ?? null, pathModuleIds, catalogModuleTotal),
    [assessmentRequest, pathModuleIds, catalogModuleTotal],
  )

  const [stageCompleteOpen, setStageCompleteOpen] = useState(false)

  useEffect(() => {
    if (!pathCompleteOpen || !assessmentRequest) {
      setStageCompleteOpen(false)
      return
    }
    if (isPathStageCompleteDismissed(assessmentRequest, pathModuleIds)) {
      setStageCompleteOpen(false)
      return
    }
    setStageCompleteOpen(true)
  }, [pathCompleteOpen, assessmentRequest, pathModuleIds])

  const dismissStageComplete = useCallback(() => {
    if (assessmentRequest) {
      markPathStageCompleteDismissed(assessmentRequest, pathModuleIds)
    }
    setStageCompleteOpen(false)
  }, [assessmentRequest, pathModuleIds])

  const handleGenerateNextPath = useCallback(async () => {
    if (!onGenerateNextPath || generatingNextPath) return
    await onGenerateNextPath()
    setStageCompleteOpen(false)
  }, [onGenerateNextPath, generatingNextPath])

  const [annualPromoOpen, setAnnualPromoOpen] = useState(false)
  const [annualPurchased, setAnnualPurchased] = useState(() => loadHasAnnualMembership())

  useEffect(() => {
    if (annualPurchased) return
    if (!pathCompleteOpen) return
    if (stageCompleteOpen) return
    if (isAnnualMembershipPromoOnCooldown()) return
    const t = window.setTimeout(() => setAnnualPromoOpen(true), 450)
    return () => window.clearTimeout(t)
  }, [pathCompleteOpen, stageCompleteOpen, annualPurchased])

  const prevPathCompleteOpen = useRef(false)
  useEffect(() => {
    if (prevPathCompleteOpen.current && !pathCompleteOpen) {
      setAnnualPromoOpen(false)
    }
    prevPathCompleteOpen.current = pathCompleteOpen
  }, [pathCompleteOpen])

  const closeAnnualPromoOnly = useCallback(() => {
    setAnnualPromoOpen(false)
    markAnnualMembershipPromoDismissed()
  }, [])

  const markAnnualMembershipPurchased = useCallback(() => {
    saveAnnualMembershipAccess(true)
    setAnnualPurchased(true)
    setAnnualPromoOpen(false)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setParallaxY(el.scrollTop)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [pathItems.length])

  const activeId = useMemo(() => {
    for (const it of pathItems) {
      if (it.isBbsModule) continue
      const m = it.module
      if (completedIds.has(m.id)) continue
      const ok = prerequisitesMetOnLearningPath(
        pathItems,
        m.id,
        completedIds,
        idsForPrerequisiteProgress,
        pathUserAttribute,
        policyLockedModuleIds,
      )
      if (ok && !m.locked) return m.id
    }
    const first = pathItems.find((it) => !it.isBbsModule)
    if (first && !completedIds.has(first.module.id) && !first.module.locked) {
      const ok = prerequisitesMetOnLearningPath(
        pathItems,
        first.module.id,
        completedIds,
        idsForPrerequisiteProgress,
        pathUserAttribute,
        policyLockedModuleIds,
      )
      if (ok) return first.module.id
    }
    return null
  }, [pathItems, completedIds, idsForPrerequisiteProgress, pathUserAttribute, policyLockedModuleIds])

  const layout = useMemo(
    () => computePathLayout(pathItems.length, containerWidth, isWideLayout),
    [pathItems.length, containerWidth, isWideLayout],
  )

  const onOpen = useCallback(
    (moduleId: string) => {
      setDrawerModuleId(moduleId)
      if (!userId) {
        const isBbs = pathItems.some((it) => it.isBbsModule && it.bbs.id === moduleId)
        if (!isBbs) onGuestEngagement?.('drawer_open')
      }
    },
    [pathItems, userId, onGuestEngagement],
  )

  const onToggleComplete = useCallback(
    (moduleId: string) => {
      setCompletedIds((prev) => {
        const wasCompleted = prev.has(moduleId)
        const next = new Set(prev)
        if (wasCompleted) {
          next.delete(moduleId)
          if (assessmentRequest) {
            removeLifetimeMasteredModuleIds(assessmentRequest, [moduleId])
          }
        } else {
          next.add(moduleId)
        }
        return next
      })
    },
    [assessmentRequest],
  )

  const beginCompleteFeedback = useCallback((moduleId: string) => {
    setFeedbackModuleId(moduleId)
  }, [])

  const handleToggleTodo = useCallback(
    (moduleId: string, itemId: string, checked: boolean) => {
      if (checked && !userId) onGuestEngagement?.('todo_check')
      setProgressByModule((p) => {
        const cur = p[moduleId] ?? { checked: {}, memo: '' }
        const currentChecked = { ...cur.checked, [itemId]: checked }
        if (!checked) delete currentChecked[itemId]
        if (userId) {
          syncModuleDetail(userId, sessionKey, moduleId, {
            checkedItems: currentChecked,
            memo: cur.memo,
          })
        }
        return { ...p, [moduleId]: { ...cur, checked: currentChecked } }
      })
    },
    [sessionKey, userId, onGuestEngagement],
  )

  const handleMemoSave = useCallback(
    (moduleId: string, memo: string) => {
      setProgressByModule((p) => {
        const cur = p[moduleId] ?? { checked: {}, memo: '' }
        if (userId) {
          syncModuleDetail(userId, sessionKey, moduleId, {
            checkedItems: cur.checked,
            memo,
          })
        }
        return { ...p, [moduleId]: { ...cur, memo } }
      })
    },
    [sessionKey, userId],
  )

  const submitModuleFeedback = useCallback(
    async (payload: {
      difficulty: DifficultyFeedbackApi
      satisfaction: number
      videoRequestNote?: string
    }) => {
      const mid = feedbackModuleId
      if (!mid) return
      // 楽観更新: 完了マークは即時反映し、API は fire-and-forget。
      // 失敗時は「フィードバックの保存に失敗（完了は反映済み）」トーストで知らせる。
      setCompletedIds((prev) => {
        const nx = new Set(prev)
        nx.add(mid)
        return nx
      })
      if (assessmentRequest) {
        mergeLifetimeMasteredModuleIds(assessmentRequest, [mid])
      }
      setFeedbackModuleId(null)
      setDrawerModuleId(null)
      try {
        if (userId) {
          const result = await saveRemoteModuleFeedback(userId, {
            moduleId: mid,
            difficulty: payload.difficulty,
            satisfaction: payload.satisfaction,
            comment: payload.videoRequestNote,
          })
          if (!result.ok) {
            showToast(en.toast.feedbackSaveFailed, 'error')
          }
        } else {
          await postModuleFeedback({
            sessionKey,
            moduleId: mid,
            difficulty: payload.difficulty,
            satisfaction: payload.satisfaction,
            videoRequestNote: payload.videoRequestNote,
          })
        }
      } catch {
        showToast(en.toast.feedbackSaveFailed, 'error')
      }
    },
    [feedbackModuleId, sessionKey, assessmentRequest, userId],
  )

  const feedbackModuleName = useMemo(() => {
    if (!feedbackModuleId) return ''
    for (const it of pathItems) {
      if (!it.isBbsModule && it.module.id === feedbackModuleId) return it.module.name
    }
    return ''
  }, [feedbackModuleId, pathItems])

  const closeDrawer = useCallback(() => setDrawerModuleId(null), [])

  /** RF の NodeWrapper は onClick が無いと pointer-events:none になり、子のボタンが押せない */
  const noopNodeClick = useCallback(() => {}, [])

  const [nodes, setNodes, onNodesChange] = useNodesState<PathStepNodeData | BbsPathStepNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const nextNodes: Node<PathStepNodeData | BbsPathStepNodeData>[] = pathItems.map((item, i) => {
      const pos = layout.positions[i] ?? { x: 0, y: 0 }
      if (!item.isBbsModule) {
        const module = item.module
        const prereqOk = prerequisitesMetOnLearningPath(
          pathItems,
          module.id,
          completedIds,
          idsForPrerequisiteProgress,
          pathUserAttribute,
          policyLockedModuleIds,
        )
        const visualState = deriveVisualState(
          module,
          completedIds,
          prereqOk,
          activeId,
          pathEntryModuleId,
        )
        return {
          id: module.id,
          type: 'pathStep',
          position: pos,
          draggable: false,
          selectable: false,
          data: {
            module,
            categoryLabel: moduleCategoryLabel(module.id),
            visualState,
            prerequisitesMet: prereqOk,
            todosComplete: todosCompleteById.get(module.id) ?? false,
            nodeBox: layout.nodeBox,
            outerWidth: layout.outerWidth,
            isWide: isWideLayout,
            onOpen,
            onToggleComplete,
            onRequestCompleteFeedback: beginCompleteFeedback,
          },
        }
      }
      const { bbs } = item
      return {
        id: bbs.id,
        type: 'bbsStep',
        position: pos,
        draggable: false,
        selectable: false,
        data: {
          bbs,
          gateLocked: false,
          nodeBox: layout.nodeBox,
          outerWidth: layout.outerWidth,
          isWide: isWideLayout,
          onOpen,
        },
      }
    })

    const nextEdges: Edge<ProgressTrailEdgeData>[] = []
    for (let i = 0; i < pathItems.length - 1; i++) {
      const a = pathItems[i]
      const b = pathItems[i + 1]
      const sourceId = a.isBbsModule ? a.bbs.id : a.module.id
      const targetId = b.isBbsModule ? b.bbs.id : b.module.id
      const variant: ProgressTrailEdgeData['variant'] = trailEdgeCleared(
        pathItems,
        completedIds,
        i,
      )
        ? 'cleared'
        : 'locked'
      const sourcePos = layout.positions[i] ?? { x: 0, y: 0 }
      const targetPos = layout.positions[i + 1] ?? { x: 0, y: 0 }
      const { sourceHandle, targetHandle } = resolveTrailHandles(
        sourcePos,
        targetPos,
        layout,
        isWideLayout,
      )
      nextEdges.push({
        id: `trail-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        sourceHandle,
        targetHandle,
        type: 'progressTrail',
        data: { variant },
      })
    }

    setNodes(nextNodes)
    setEdges(nextEdges)
  }, [
    pathItems,
    layout,
    completedIds,
    idsForPrerequisiteProgress,
    activeId,
    pathEntryModuleId,
    isWideLayout,
    todosCompleteById,
    onOpen,
    onToggleComplete,
    beginCompleteFeedback,
    pathUserAttribute,
    policyLockedModuleIds,
    setNodes,
    setEdges,
  ])

  const drawerModule = useMemo(() => {
    if (!drawerModuleId) return undefined
    for (const it of pathItems) {
      if (!it.isBbsModule && it.module.id === drawerModuleId) return it.module
    }
    return undefined
  }, [drawerModuleId, pathItems])

  const drawerBbs = useMemo(() => {
    if (!drawerModuleId) return undefined
    for (const it of pathItems) {
      if (it.isBbsModule && it.bbs.id === drawerModuleId) return it.bbs
    }
    return undefined
  }, [drawerModuleId, pathItems])

  const drawerPrereqOk = drawerModule
    ? prerequisitesMetOnLearningPath(
        pathItems,
        drawerModule.id,
        completedIds,
        idsForPrerequisiteProgress,
        pathUserAttribute,
        policyLockedModuleIds,
      )
    : false

  const drawerTodoItems = drawerModule ? todoItemsByModule.get(drawerModule.id) ?? [] : []
  const drawerProgress = drawerModule ? progressByModule[drawerModule.id] : undefined

  const modulesInUiOrder = useMemo(
    () => pathItems.filter((it) => !it.isBbsModule).map((it) => it.module),
    [pathItems],
  )

  const checkedByModule = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {}
    for (const [moduleId, progress] of Object.entries(progressByModule)) {
      out[moduleId] = progress.checked ?? {}
    }
    return out
  }, [progressByModule])

  const conversionGateUrl = useMemo(() => {
    const gate = pathItems.find((it) => it.isBbsModule)
    if (!gate || !gate.isBbsModule) return null
    return gate.bbs.oneTimeCheckoutUrl ?? gate.bbs.monthlyCheckoutUrl ?? gate.bbs.curriculumAccessUrl ?? null
  }, [pathItems])

  const handleSetTechniqueChecked = useCallback(
    (moduleId: string, techniqueId: string, checked: boolean) => {
      setProgressByModule((p) => {
        const cur = p[moduleId] ?? { checked: {}, memo: '' }
        const currentChecked = { ...cur.checked, [techniqueId]: checked }
        if (!checked) delete currentChecked[techniqueId]
        if (userId) {
          syncModuleDetail(userId, sessionKey, moduleId, {
            checkedItems: currentChecked,
            memo: cur.memo,
          })
        }
        return { ...p, [moduleId]: { ...cur, checked: currentChecked } }
      })
    },
    [sessionKey, userId],
  )

  const practiceCheck = usePracticeCheck({
    storageId,
    assessmentFingerprint,
    modulesInUiOrder,
    checkedByModule,
    onSetTechniqueChecked: handleSetTechniqueChecked,
  })

  if (!pathItems.length) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        {en.verticalPath.noPath}
      </p>
    )
  }

  return (
    <div className="relative w-full">
      <div
        className="path-parallax-layer path-parallax-dots"
        style={{ transform: `translate3d(0, ${parallaxY * 0.05}px, 0)` }}
        aria-hidden
      />
      <div
        className="path-parallax-layer path-parallax-tatami"
        style={{ transform: `translate3d(0, ${parallaxY * 0.11}px, 0)` }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-3 sm:px-6 lg:px-10">
        {pathCompleteOpen && !stageCompleteOpen && canGenerateNext && onGenerateNextPath ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gatame-gold/35 bg-gatame-midnight/90 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-medium text-white/90">{en.pathStageComplete.bannerHint}</p>
            <button
              type="button"
              onClick={() => void handleGenerateNextPath()}
              disabled={generatingNextPath}
              className="shrink-0 rounded-xl border border-gatame-gold/70 bg-gatame-gold/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-gatame-goldHi transition-colors hover:bg-gatame-gold/25 disabled:opacity-60"
            >
              {generatingNextPath ? en.pathStageComplete.generating : en.pathStageComplete.generateNext}
            </button>
          </div>
        ) : null}
        <div
          ref={scrollRef}
          className={`relative overflow-y-auto rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
            isWideLayout
              ? 'path-board-sugoroku max-h-[min(72vh,680px)] overflow-x-auto'
              : 'max-h-[min(84vh,640px)] overflow-x-hidden'
          }`}
        >
          <div ref={widthRef} className="relative min-h-[420px] w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={noopNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              panOnScroll={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              minZoom={0.35}
              maxZoom={1.35}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              proOptions={{ hideAttribution: true }}
              className="!bg-transparent"
              style={{
                width: layout.graphWidth,
                height: layout.graphHeight,
                minHeight: layout.graphHeight,
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden>
                <svg width="100%" height="100%" className="text-white">
                  <defs>
                    <pattern id="path-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="1" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#path-grid)" />
                </svg>
              </div>
            </ReactFlow>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {drawerModule || drawerBbs ? (
          <>
            <motion.button
              type="button"
              aria-label={en.common.close}
              className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] ${
                isWideLayout ? 'z-[80] lg:bg-black/35' : 'z-[105]'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />
            {isWideLayout ? (
              <motion.div
                key="drawer-right"
                role="dialog"
                aria-modal="true"
                className="fixed inset-y-0 right-0 z-[90] flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-700/80 bg-slate-900 shadow-[-16px_0_56px_rgba(0,0,0,0.45)] backdrop-blur-md"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              >
                {drawerBbs ? (
                  <BbsOfferDrawerPanel
                    key={drawerBbs.id}
                    bbs={drawerBbs}
                    compact={false}
                    closeDrawer={closeDrawer}
                  />
                ) : drawerModule ? (
                  <VerticalPathDrawerPanel
                    key={drawerModule.id}
                    drawerModule={drawerModule}
                    compact={false}
                    closeDrawer={closeDrawer}
                    completedIds={completedIds}
                    drawerPrereqOk={drawerPrereqOk}
                    todoItems={drawerTodoItems}
                    checkedMap={drawerProgress?.checked ?? {}}
                    memoText={drawerProgress?.memo ?? ''}
                    onToggleTodo={handleToggleTodo}
                    onMemoSave={handleMemoSave}
                    onRequestCompleteFeedback={beginCompleteFeedback}
                    onToggleCompleteUndo={onToggleComplete}
                    onOpenPracticeCheck={practiceCheck.openManually}
                    practiceCheckDisabled={!practiceCheck.hasPendingTechnique}
                  />
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="drawer-bottom"
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-[110] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-slate-900"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              >
                {drawerBbs ? (
                  <BbsOfferDrawerPanel
                    key={drawerBbs.id}
                    bbs={drawerBbs}
                    compact
                    closeDrawer={closeDrawer}
                  />
                ) : drawerModule ? (
                  <VerticalPathDrawerPanel
                    key={drawerModule.id}
                    drawerModule={drawerModule}
                    compact
                    closeDrawer={closeDrawer}
                    completedIds={completedIds}
                    drawerPrereqOk={drawerPrereqOk}
                    todoItems={drawerTodoItems}
                    checkedMap={drawerProgress?.checked ?? {}}
                    memoText={drawerProgress?.memo ?? ''}
                    onToggleTodo={handleToggleTodo}
                    onMemoSave={handleMemoSave}
                    onRequestCompleteFeedback={beginCompleteFeedback}
                    onToggleCompleteUndo={onToggleComplete}
                    onOpenPracticeCheck={practiceCheck.openManually}
                    practiceCheckDisabled={!practiceCheck.hasPendingTechnique}
                  />
                ) : null}
              </motion.div>
            )}
          </>
        ) : null}
      </AnimatePresence>

      <PathStageCompleteOverlay
        open={stageCompleteOpen}
        canGenerateNext={canGenerateNext && Boolean(onGenerateNextPath)}
        generating={generatingNextPath}
        onGenerateNext={() => void handleGenerateNextPath()}
        onRetakeAssessment={() => {
          dismissStageComplete()
          onRequestRetake?.()
        }}
        onDismiss={dismissStageComplete}
      />

      <AnnualMembershipPromoOverlay
        open={annualPromoOpen}
        onClose={closeAnnualPromoOnly}
        onMarkAnnualPurchased={markAnnualMembershipPurchased}
      />
      <ModuleCompleteFeedbackDialog
        open={Boolean(feedbackModuleId)}
        moduleName={feedbackModuleName}
        onClose={() => setFeedbackModuleId(null)}
        onSubmit={submitModuleFeedback}
      />
      <PracticeCheckCard
        open={practiceCheck.open}
        target={practiceCheck.currentTarget}
        status={practiceCheck.status}
        educationMessage={practiceCheck.educationMessage}
        bbsUrl={conversionGateUrl}
        undoUntil={practiceCheck.undoUntil}
        onCloseNotNow={practiceCheck.handleNotNow}
        onBackToFocus={practiceCheck.handleBackToFocus}
        onSuccess={practiceCheck.handleSuccess}
        onNotWorking={practiceCheck.handleNotWorking}
        onUndo={practiceCheck.handleUndo}
      />
    </div>
  )
}

export default function VerticalPathContainer(props: VerticalPathContainerProps) {
  return (
    <ReactFlowProvider>
      <VerticalPathInner {...props} />
    </ReactFlowProvider>
  )
}
