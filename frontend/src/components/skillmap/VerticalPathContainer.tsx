import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { ReactFlowProvider, useEdgesState, useNodesState } from 'reactflow'
import type { Edge, Node } from 'reactflow'
import { isNoviceUser, moduleCategoryLabel, prerequisitesMetForUser, STREET_PASS_TECHNIQUE_MAX } from '../../api/learningPathApi'
import { buildStreetPathWithBbsOffers, effectiveBbsSequenceStartIndex, trailEdgeCleared } from '../../api/streetPathWithBbs'
import {
  postModuleFeedback,
  type DifficultyFeedbackApi,
} from '../../api/progressApi'
import {
  addCompletedBbsLevel,
  loadBbsDeclaredMasteredLevels,
  loadLifetimeMasteredModuleIds,
  mergeLifetimeMasteredModuleIds,
  saveCompletedModuleIds,
  loadRawSessionCompletedModuleIds,
  progressSessionId,
} from '../../utils/progressStorage'
import { allTodosChecked, moduleTodoItemsFromModule } from '../../utils/modulePracticeTodos'
import {
  isAnnualMembershipPromoOnCooldown,
  loadAnnualMembershipPurchased,
  markAnnualMembershipPromoDismissed,
  saveAnnualMembershipPurchased,
} from '../../utils/annualMembershipPromoStorage'
import en from '../../locales/en.json'
import {
  loadRemoteModuleProgress,
  loadRemoteSessionDetails,
} from '../../api/supabaseProgressApi'
import { syncModuleDetail, syncModuleProgress } from '../../sync/syncService'
import ConfirmDialog from '../common/ConfirmDialog'
import { showToast } from '../common/Toast'
import ModuleCompleteFeedbackDialog from './ModuleCompleteFeedbackDialog'
import VerticalPathDrawerPanel from './VerticalPathDrawerPanel'
import type { AssessmentRequest, LearningPathResponse, ScoredModule } from '../../types'
import BbsPathStepNode, { type BbsPathStepNodeData } from './BbsPathStepNode'
import BbsOfferDrawerPanel from './BbsOfferDrawerPanel'
import PathStepNode, { type PathStepNodeData, type PathStepVisualState } from './PathStepNode'
import ProgressTrailEdge, { type ProgressTrailEdgeData } from './ProgressTrailEdge'
import { computeSerpentineLayout, PATH_BREAKPOINT_LG } from './verticalPathLayout'
import {
  BBS_LEVEL_SEQUENCE,
  bbsCheckoutUrlMonthlyOrNull,
  bbsCheckoutUrlOneTimeOrNull,
  resolveBbsCheckoutLevelForEntryBanner,
  type BbsLevelKey,
} from '../../constants/bbsOffers'
import LearningPathCompleteOverlay from './LearningPathCompleteOverlay'
import AnnualMembershipPromoOverlay from './AnnualMembershipPromoOverlay'
import BbsMilestoneCelebrateOverlay from './BbsMilestoneCelebrateOverlay'
import BbsBeltLogo from './BbsBeltLogo'
import { ghostGoldCtaCompactClass } from '../../constants/brandTheme'

const nodeTypes = { pathStep: PathStepNode, bbsStep: BbsPathStepNode }
const edgeTypes = { progressTrail: ProgressTrailEdge }

export interface VerticalPathContainerProps {
  response: LearningPathResponse
  assessmentRequest?: AssessmentRequest | null
  onPathRefresh?: (request: AssessmentRequest) => Promise<void>
  /** 診断直後の BBS エントリーポイント訴求バナー */
  showPathGeneratedBanner?: boolean
  onDismissPathGeneratedBanner?: () => void
  /** ログイン中のユーザー ID（Supabase 同期用） */
  userId?: string
}

function deriveVisualState(
  module: ScoredModule,
  completedIds: Set<string>,
  prerequisitesMet: boolean,
  activeId: string | null,
): PathStepVisualState {
  if (completedIds.has(module.id)) return 'completed'
  if (module.locked || !prerequisitesMet) return 'locked'
  if (activeId === module.id) return 'active'
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
  onPathRefresh,
  showPathGeneratedBanner,
  onDismissPathGeneratedBanner,
  userId,
}: VerticalPathContainerProps) {
  const allRecommended = response.recommendedModules ?? []
  const pathUserAttribute = assessmentRequest?.userAttribute ?? response.userAttribute
  const bannerBbsLevel = useMemo(
    () => resolveBbsCheckoutLevelForEntryBanner(pathUserAttribute, response.recommendedBbsGrade),
    [pathUserAttribute, response.recommendedBbsGrade],
  )
  const bannerOneTimeUrl = useMemo(() => bbsCheckoutUrlOneTimeOrNull(bannerBbsLevel), [bannerBbsLevel])
  const bannerMonthlyUrl = useMemo(() => bbsCheckoutUrlMonthlyOrNull(bannerBbsLevel), [bannerBbsLevel])

  const [stageMasteredExclude, setStageMasteredExclude] = useState<Set<string>>(() => new Set())
  const [bbsDeclaredMastered, setBbsDeclaredMastered] = useState<Set<BbsLevelKey>>(() => new Set())
  /** 現在のパス構築用 BBS シーケンス開始（合格宣言のたびには変えず、診断キー／次ステージ時のみ更新） */
  const [pathBbsSequenceStart, setPathBbsSequenceStart] = useState(() =>
    effectiveBbsSequenceStartIndex(
      pathUserAttribute,
      loadBbsDeclaredMasteredLevels(assessmentRequest ?? null),
    ),
  )
  const [celebrateBbsLevel, setCelebrateBbsLevel] = useState<BbsLevelKey | null>(null)
  const [lifetimeVersion, setLifetimeVersion] = useState(0)
  const [nextStageLoading, setNextStageLoading] = useState(false)

  const assessmentRequestRef = useRef(assessmentRequest)
  assessmentRequestRef.current = assessmentRequest

  /** 診断内容が変わったときだけ変わる（completed のたびのオブジェクト差し替えでは変わらない） */
  const pathAssessmentKey = useMemo(
    () => (assessmentRequest ? progressSessionId(assessmentRequest) : ''),
    [assessmentRequest],
  )

  useLayoutEffect(() => {
    const req = assessmentRequestRef.current
    if (!req) return
    setStageMasteredExclude(loadLifetimeMasteredModuleIds(req))
    const declared = loadBbsDeclaredMasteredLevels(req)
    setBbsDeclaredMastered(declared)
    setPathBbsSequenceStart(effectiveBbsSequenceStartIndex(req.userAttribute, declared))
  }, [pathAssessmentKey])

  const { modulesForStreet, isReviewPath } = useMemo(() => {
    const um = allRecommended.filter((m) => !stageMasteredExclude.has(m.id))
    if (um.length > 0) return { modulesForStreet: um, isReviewPath: false }
    const pool = allRecommended.filter((m) => stageMasteredExclude.has(m.id))
    if (pool.length === 0) return { modulesForStreet: allRecommended, isReviewPath: false }
    const copy = [...pool]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const t = copy[i]!
      copy[i] = copy[j]!
      copy[j] = t
    }
    const cap = Math.min(STREET_PASS_TECHNIQUE_MAX, copy.length)
    return { modulesForStreet: copy.slice(0, cap), isReviewPath: true }
  }, [allRecommended, stageMasteredExclude])

  /** 熟練者の FOUNDATION ロック等。未経験者では空（受け身などポリシー免除しない）。 */
  const policyLockedModuleIds = useMemo(() => {
    if (isNoviceUser(pathUserAttribute)) return new Set<string>()
    const s = new Set<string>()
    for (const m of modulesForStreet) {
      if (m.locked) s.add(m.id)
    }
    return s
  }, [modulesForStreet, pathUserAttribute])

  /** 診断キー／次ステージ時のみ再構築。完了のたびには組み直さない（完了モジュールを Pass 上に残す）。 */
  const pathItems = useMemo(() => {
    const pins = loadRawSessionCompletedModuleIds(assessmentRequest ?? null)
    return buildStreetPathWithBbsOffers(modulesForStreet, {
      maxSteps: STREET_PASS_TECHNIQUE_MAX,
      userAttribute: pathUserAttribute,
      startBbsSequenceIndex: pathBbsSequenceStart,
      pinnedModuleIds: pins.size > 0 ? pins : undefined,
    })
  }, [modulesForStreet, pathUserAttribute, pathBbsSequenceStart, pathAssessmentKey, assessmentRequest])

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
    loadRawSessionCompletedModuleIds(assessmentRequest ?? null),
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
    const localIds = loadRawSessionCompletedModuleIds(assessmentRequest ?? null)
    setCompletedIds(localIds)

    if (!userId || !assessmentRequest) return
    const fp = progressSessionId(assessmentRequest)
    void loadRemoteModuleProgress(userId, fp).then((remote) => {
      if (!remote) return
      const merged = new Set(localIds)
      for (const id of remote.sessionCompletedIds) merged.add(id)
      if (merged.size > localIds.size) {
        setCompletedIds(merged)
        saveCompletedModuleIds(assessmentRequest, merged)
      }
      // lifetime / BBS も localStorage に反映（ブラウザ間同期）
      for (const id of remote.lifetimeMasteredIds) {
        mergeLifetimeMasteredModuleIds(assessmentRequest, [id])
      }
      for (const lvl of remote.bbsDeclaredMasteredLevels) {
        addCompletedBbsLevel(assessmentRequest, lvl as import('../../constants/bbsOffers').BbsLevelKey)
      }
    })
  }, [assessmentRequest, pathAssessmentKey, userId])

  useEffect(() => {
    saveCompletedModuleIds(assessmentRequest ?? null, completedIds)
    // Supabase へ非同期 write-through
    if (userId && assessmentRequest) {
      syncModuleProgress(userId, assessmentFingerprint, {
        sessionCompletedIds: [...completedIds],
        lifetimeMasteredIds: [...loadLifetimeMasteredModuleIds(assessmentRequest)],
        bbsDeclaredMasteredLevels: [...loadBbsDeclaredMasteredLevels(assessmentRequest)],
      })
    }
  }, [assessmentRequest, completedIds, userId, assessmentFingerprint])

  const techniqueIdsOnPath = useMemo(
    () => pathItems.filter((it) => !it.isBbsModule).map((it) => it.module.id),
    [pathItems],
  )

  const liveLifetime = useMemo(
    () => loadLifetimeMasteredModuleIds(assessmentRequest ?? null),
    [assessmentRequest, lifetimeVersion],
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

  const pathCompleteOpen = useMemo(
    () => allTechniquesDone && Boolean(onPathRefresh),
    [allTechniquesDone, onPathRefresh],
  )

  const [annualPromoOpen, setAnnualPromoOpen] = useState(false)
  const [annualPurchased, setAnnualPurchased] = useState(() => loadAnnualMembershipPurchased())
  /**
   * 同一ブラウザセッション内で診断直後の自動プロモを 1 回だけ開く。
   * sessionStorage はタブを閉じるまで保持されるため、リロード越しでも再表示しない。
   */
  const annualPromoSessionShownRef = useRef<boolean>(
    typeof window !== 'undefined' &&
      window.sessionStorage?.getItem('gatame.annual-promo-session-shown') === '1',
  )

  useEffect(() => {
    if (annualPurchased) return
    if (!showPathGeneratedBanner) return
    if (annualPromoSessionShownRef.current) return
    if (isAnnualMembershipPromoOnCooldown()) return
    const t = window.setTimeout(() => {
      setAnnualPromoOpen(true)
      annualPromoSessionShownRef.current = true
      try {
        window.sessionStorage?.setItem('gatame.annual-promo-session-shown', '1')
      } catch {
        /* ignore */
      }
    }, 450)
    return () => window.clearTimeout(t)
  }, [showPathGeneratedBanner, annualPurchased])

  useEffect(() => {
    if (annualPurchased) return
    if (!pathCompleteOpen) return
    if (isAnnualMembershipPromoOnCooldown()) return
    const t = window.setTimeout(() => setAnnualPromoOpen(true), 450)
    return () => window.clearTimeout(t)
  }, [pathCompleteOpen, annualPurchased])

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
    saveAnnualMembershipPurchased()
    setAnnualPurchased(true)
    setAnnualPromoOpen(false)
  }, [])

  const fullCatalogMastered = useMemo(
    () => allRecommended.length > 0 && allRecommended.every((m) => liveLifetime.has(m.id)),
    [allRecommended, liveLifetime],
  )

  const bbsRankMastery = useMemo(
    () => ({ completed: bbsDeclaredMastered.size, total: BBS_LEVEL_SEQUENCE.length }),
    [bbsDeclaredMastered],
  )

  const bbsMilestonesCompleteForPath = useMemo(
    () => pathBbsSequenceStart >= BBS_LEVEL_SEQUENCE.length,
    [pathBbsSequenceStart],
  )

  const masteryPercent = useMemo(
    () => Math.min(100, Math.round((liveLifetime.size / Math.max(1, response.totalModules)) * 100)),
    [liveLifetime, response.totalModules],
  )

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
      const ok = prerequisitesMetForUser(
        m.prerequisites,
        idsForPrerequisiteProgress,
        pathUserAttribute,
        policyLockedModuleIds,
      )
      if (ok && !m.locked) return m.id
    }
    return null
  }, [pathItems, completedIds, idsForPrerequisiteProgress, pathUserAttribute, policyLockedModuleIds])

  const layout = useMemo(
    () => computeSerpentineLayout(pathItems.length, containerWidth, isWideLayout),
    [pathItems.length, containerWidth, isWideLayout],
  )

  const onOpen = useCallback((moduleId: string) => {
    setDrawerModuleId(moduleId)
  }, [])

  const onToggleComplete = useCallback((moduleId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }, [])

  const beginCompleteFeedback = useCallback((moduleId: string) => {
    setFeedbackModuleId(moduleId)
  }, [])

  const handleToggleTodo = useCallback(
    (moduleId: string, itemId: string, checked: boolean) => {
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
    [sessionKey, userId],
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
      setFeedbackModuleId(null)
      setDrawerModuleId(null)
      try {
        await postModuleFeedback({
          sessionKey,
          moduleId: mid,
          difficulty: payload.difficulty,
          satisfaction: payload.satisfaction,
          videoRequestNote: payload.videoRequestNote,
        })
      } catch {
        showToast(en.toast.feedbackSaveFailed, 'error')
      }
    },
    [feedbackModuleId, sessionKey],
  )

  const feedbackModuleName = useMemo(() => {
    if (!feedbackModuleId) return ''
    for (const it of pathItems) {
      if (!it.isBbsModule && it.module.id === feedbackModuleId) return it.module.name
    }
    return ''
  }, [feedbackModuleId, pathItems])

  const closeDrawer = useCallback(() => setDrawerModuleId(null), [])

  const scrollToNextAfterBbs = useCallback(
    (bbsId: string) => {
      const idx = pathItems.findIndex((it) => it.isBbsModule && it.bbs.id === bbsId)
      if (idx < 0) return
      for (let j = idx + 1; j < pathItems.length; j++) {
        const it = pathItems[j]
        if (!it || it.isBbsModule) continue
        const pos = layout.positions[j]
        const el = scrollRef.current
        if (!el || !pos) return
        const targetTop = pos.y + layout.nodeBox * 0.35 - el.clientHeight * 0.35
        el.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
        return
      }
    },
    [pathItems, layout],
  )

  const [bbsConfirmLevel, setBbsConfirmLevel] = useState<BbsLevelKey | null>(null)

  const handleDeclareBbsMastered = useCallback((level: BbsLevelKey) => {
    setBbsConfirmLevel(level)
  }, [])

  const handleConfirmBbsMastered = useCallback(() => {
    const level = bbsConfirmLevel
    setBbsConfirmLevel(null)
    if (!level) return
    const req = assessmentRequest ?? null
    if (!addCompletedBbsLevel(req, level)) return
    setBbsDeclaredMastered(loadBbsDeclaredMasteredLevels(req))
    setCelebrateBbsLevel(level)
    window.setTimeout(() => setCelebrateBbsLevel(null), 2800)
    // BBS 宣言を Supabase へ write-through（completedIds が変わらないため useEffect では拾えない）
    if (userId && req) {
      const fp = progressSessionId(req)
      syncModuleProgress(userId, fp, {
        sessionCompletedIds: [...loadRawSessionCompletedModuleIds(req)],
        lifetimeMasteredIds: [...loadLifetimeMasteredModuleIds(req)],
        bbsDeclaredMasteredLevels: [...loadBbsDeclaredMasteredLevels(req)],
      })
    }
  }, [assessmentRequest, bbsConfirmLevel, userId])

  const handleStartNextStage = useCallback(async () => {
    if (!assessmentRequest || !onPathRefresh) return
    setNextStageLoading(true)
    try {
      const req = assessmentRequest
      mergeLifetimeMasteredModuleIds(
        req,
        [...completedIds].filter((id) => !id.startsWith('bbs-offer:')),
      )
      saveCompletedModuleIds(req, new Set())
      setCompletedIds(new Set())
      setStageMasteredExclude(loadLifetimeMasteredModuleIds(req))
      const declaredAfter = loadBbsDeclaredMasteredLevels(req)
      setBbsDeclaredMastered(declaredAfter)
      setPathBbsSequenceStart(effectiveBbsSequenceStartIndex(req.userAttribute, declaredAfter))
      setLifetimeVersion((v) => v + 1)
      await onPathRefresh({
        ...req,
        completedModuleIds: Array.from(loadLifetimeMasteredModuleIds(req)),
      })
    } finally {
      setNextStageLoading(false)
    }
  }, [assessmentRequest, onPathRefresh, completedIds])

  /** RF の NodeWrapper は onClick が無いと pointer-events:none になり、子のボタンが押せない */
  const noopNodeClick = useCallback(() => {}, [])

  const [nodes, setNodes, onNodesChange] = useNodesState<PathStepNodeData | BbsPathStepNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const nextNodes: Node<PathStepNodeData | BbsPathStepNodeData>[] = pathItems.map((item, i) => {
      const pos = layout.positions[i] ?? { x: 0, y: 0 }
      if (!item.isBbsModule) {
        const module = item.module
        const prereqOk = prerequisitesMetForUser(
          module.prerequisites,
          idsForPrerequisiteProgress,
          pathUserAttribute,
          policyLockedModuleIds,
        )
        const visualState = deriveVisualState(module, completedIds, prereqOk, activeId)
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
      const levelDeclared = bbsDeclaredMastered.has(bbs.sequenceLevel)
      return {
        id: bbs.id,
        type: 'bbsStep',
        position: pos,
        draggable: false,
        selectable: false,
        data: {
          bbs,
          levelDeclaredMastered: levelDeclared,
          nodeBox: layout.nodeBox,
          outerWidth: layout.outerWidth,
          isWide: isWideLayout,
          onOpen,
          onDeclareMastered: handleDeclareBbsMastered,
          onContinuePath: () => scrollToNextAfterBbs(bbs.id),
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
        idsForPrerequisiteProgress,
        i,
      )
        ? 'cleared'
        : 'locked'
      nextEdges.push({
        id: `trail-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
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
    isWideLayout,
    todosCompleteById,
    onOpen,
    onToggleComplete,
    beginCompleteFeedback,
    pathUserAttribute,
    policyLockedModuleIds,
    bbsDeclaredMastered,
    handleDeclareBbsMastered,
    scrollToNextAfterBbs,
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
    ? prerequisitesMetForUser(
        drawerModule.prerequisites,
        idsForPrerequisiteProgress,
        pathUserAttribute,
        policyLockedModuleIds,
      )
    : false

  const drawerTodoItems = drawerModule ? todoItemsByModule.get(drawerModule.id) ?? [] : []
  const drawerProgress = drawerModule ? progressByModule[drawerModule.id] : undefined

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
        {showPathGeneratedBanner ? (
          <div
            role="status"
            className="mb-4 flex flex-col gap-3 rounded-2xl border border-gatame-gold/40 bg-gatame-midnight/80 px-4 py-4 shadow-[0_8px_36px_rgba(197,160,89,0.12)] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <BbsBeltLogo size={44} className="shrink-0" />
              <p className="min-w-0 text-base font-bold leading-snug text-white sm:text-lg">
                We found the perfect entry point for your Black Belt System.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
              {bannerOneTimeUrl ? (
                <a
                  href={bannerOneTimeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-900/90 bg-blue-950 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-100 hover:border-blue-800 hover:bg-blue-900"
                >
                  One-time
                </a>
              ) : null}
              {bannerMonthlyUrl ? (
                <a
                  href={bannerMonthlyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${ghostGoldCtaCompactClass} relative overflow-visible pr-5`}
                >
                  <span className="absolute -right-1 -top-2 whitespace-nowrap rounded-full border border-gatame-gold/50 bg-gatame-midnight px-2 py-0.5 text-[9px] font-bold uppercase leading-none text-gatame-gold">
                    Recommended
                  </span>
                  Monthly
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => onDismissPathGeneratedBanner?.()}
                className="shrink-0 rounded-xl border border-white/20 bg-slate-950/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90 hover:bg-slate-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        {bbsMilestonesCompleteForPath && !isReviewPath ? (
          <div className="mb-3 flex items-center justify-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-2.5 text-center text-xs font-semibold leading-snug text-emerald-100/95">
            <BbsBeltLogo size={28} className="shrink-0" alt="" />
            <p>
              Black Belt System milestones on this path are complete (through Shodan). Focus on techniques
              below, or use review mode when you revisit completed modules.
            </p>
          </div>
        ) : null}
        {isReviewPath ? (
          <div className="mb-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-center text-xs font-semibold text-sky-100/95">
            Review mode: revisiting techniques you have already completed.
          </div>
        ) : null}
        <div
          ref={scrollRef}
          className="relative max-h-[min(78vh,900px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:max-h-[min(82vh,1100px)]"
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
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px] lg:bg-black/35"
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
                    levelDeclaredMastered={bbsDeclaredMastered.has(drawerBbs.sequenceLevel)}
                    onDeclareMastered={handleDeclareBbsMastered}
                    onContinuePath={() => scrollToNextAfterBbs(drawerBbs.id)}
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
                  />
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="drawer-bottom"
                role="dialog"
                aria-modal="true"
                className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[min(78vh,560px)] flex-col overflow-hidden rounded-t-2xl border border-slate-700/80 bg-slate-900 shadow-[0_-12px_48px_rgba(0,0,0,0.45)]"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              >
                <div className="flex shrink-0 justify-center pt-3 pb-2">
                  <div className="h-1 w-10 rounded-full bg-slate-600/80" />
                </div>
                {drawerBbs ? (
                  <BbsOfferDrawerPanel
                    key={drawerBbs.id}
                    bbs={drawerBbs}
                    compact
                    closeDrawer={closeDrawer}
                    levelDeclaredMastered={bbsDeclaredMastered.has(drawerBbs.sequenceLevel)}
                    onDeclareMastered={handleDeclareBbsMastered}
                    onContinuePath={() => scrollToNextAfterBbs(drawerBbs.id)}
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
                  />
                ) : null}
              </motion.div>
            )}
          </>
        ) : null}
      </AnimatePresence>

      <BbsMilestoneCelebrateOverlay level={celebrateBbsLevel} />

      <LearningPathCompleteOverlay
        open={pathCompleteOpen}
        fullCatalogMastered={fullCatalogMastered}
        masteryPercent={masteryPercent}
        bbsRankMastery={bbsRankMastery}
        nextStageLoading={nextStageLoading}
        canStartNext={Boolean(onPathRefresh) && !nextStageLoading}
        onStartNextStage={handleStartNextStage}
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

      <ConfirmDialog
        open={Boolean(bbsConfirmLevel)}
        title={en.confirm.bbsMastered.title}
        description={en.confirm.bbsMastered.description}
        confirmLabel={en.confirm.bbsMastered.confirm}
        cancelLabel={en.common.cancel}
        tone="default"
        onConfirm={handleConfirmBbsMastered}
        onCancel={() => setBbsConfirmLevel(null)}
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
