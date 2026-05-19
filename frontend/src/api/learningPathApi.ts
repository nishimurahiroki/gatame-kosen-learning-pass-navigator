import axios from 'axios'
import en from '../locales/en.json'
import type { AssessmentRequest, AssessmentResponse, ScoredModule } from '../types'

const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

function apiFailureMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : en.errors.learningPathFailed
  }
  const status = err.response?.status
  const detail =
    typeof err.response?.data === 'object' &&
    err.response?.data !== null &&
    'message' in err.response.data &&
    typeof (err.response.data as { message?: unknown }).message === 'string'
      ? (err.response.data as { message: string }).message
      : undefined

  if (err.response === undefined || err.code === 'ECONNREFUSED') {
    return en.api.backendUnreachable
  }
  if (status === 502 || status === 504) {
    return en.api.proxyFailed
  }
  if (status === 500) {
    return (
      en.api.serverError + (detail ? ` ${detail}` : ` ${en.api.checkBackendLogs}`)
    )
  }
  if (status === 400) {
    return detail ?? en.api.requestRejected
  }
  return detail ?? err.message ?? en.errors.learningPathFailed
}

/**
 * 診断フォームの送信結果をバックエンドに送り、推奨モジュール一覧を取得する。
 * @param signal AbortController の signal。タイムアウトや「Cancel」ボタンで中断する用途。
 */
export async function fetchLearningPath(
  request: AssessmentRequest,
  signal?: AbortSignal,
): Promise<AssessmentResponse> {
  try {
    const { data } = await apiClient.post<AssessmentResponse>('/api/assessment', request, {
      signal,
    })
    return data
  } catch (err) {
    if (axios.isCancel?.(err) || (err as { name?: string } | null)?.name === 'CanceledError') {
      throw new DOMException('canceled', 'AbortError')
    }
    throw new Error(apiFailureMessage(err))
  }
}

export function moduleCategoryLabel(moduleId: string): string {
  const labels = en.moduleCategories as Record<string, string>
  return labels[moduleId] ?? labels.fallback
}

/** 診断の userAttribute が未経験セグメントか（BBS 挿入間隔などと同期） */
export function isNoviceUser(userAttribute: string): boolean {
  return userAttribute === '未経験'
}

/** 縦 Pass に並べるテクニックモジュールの上限（BBS ノードは含めない）。README §3.4 と一致。 */
export const STREET_PASS_TECHNIQUE_MAX = 8

const UKEMI_MODULE_ID = 'ukemi'

/** README §5.7 / LearningPathService の熟練者 FOUNDATION ロック対象と id を揃える */
const FOUNDATION_IDS_FOR_ADVANCED_LOCK = new Set([
  'ukemi',
  'solo-newaza-workout',
  'osaekomi',
  'fundamental-tachi-waza',
])

/** Ukemi is mandatory in the graph only for novices; others are assumed to already have ukemi. */
function effectivePrerequisiteIds(
  prerequisites: string[] | null | undefined,
  userAttribute: string,
): string[] {
  const list = prerequisites ?? []
  if (isNoviceUser(userAttribute)) return list
  return list.filter((id) => id !== UKEMI_MODULE_ID)
}

/** Client-side prerequisite check aligned with {@link buildShortLearningStreetPath} and backend locking. */
export function prerequisitesMetForUser(
  prerequisiteIds: string[] | null | undefined,
  completedIds: Set<string>,
  userAttribute: string,
  /** 熟練者の FOUNDATION ロック等のみ。未経験者では使わない（受け身は必須のまま）。 */
  policyLockedIds?: ReadonlySet<string>,
): boolean {
  const ids = effectivePrerequisiteIds(prerequisiteIds, userAttribute)
  if (isNoviceUser(userAttribute)) {
    return ids.every((id) => completedIds.has(id))
  }
  return ids.every((id) => completedIds.has(id) || (policyLockedIds?.has(id) ?? false))
}

/** サブグラフ（モジュール ID 集合）を前提順で並べ、同順位は finalScore 降順 */
function topologicalSortModuleSubset(
  ids: Set<string>,
  byId: Map<string, ScoredModule>,
  userAttribute: string,
): ScoredModule[] {
  const idList = [...ids]
  const inDeg = new Map<string, number>()
  for (const id of idList) inDeg.set(id, 0)
  for (const id of idList) {
    const m = byId.get(id)
    if (!m) continue
    for (const p of effectivePrerequisiteIds(m.prerequisites, userAttribute)) {
      if (ids.has(p)) {
        inDeg.set(id, (inDeg.get(id) ?? 0) + 1)
      }
    }
  }

  const ready = idList.filter((id) => (inDeg.get(id) ?? 0) === 0)
  ready.sort((a, b) => {
    const ma = byId.get(a)!
    const mb = byId.get(b)!
    if (ma.locked !== mb.locked) return ma.locked ? 1 : -1
    return mb.finalScore - ma.finalScore || a.localeCompare(b)
  })

  const out: ScoredModule[] = []
  while (ready.length) {
    const id = ready.shift()!
    const mod = byId.get(id)
    if (!mod) continue
    out.push(mod)
    for (const id2 of idList) {
      const m2 = byId.get(id2)
      if (!m2 || !effectivePrerequisiteIds(m2.prerequisites, userAttribute).includes(id)) continue
      inDeg.set(id2, (inDeg.get(id2) ?? 1) - 1)
      if (inDeg.get(id2) === 0) {
        ready.push(id2)
        ready.sort((a, b) => {
          const ma = byId.get(a)!
          const mb = byId.get(b)!
          if (ma.locked !== mb.locked) return ma.locked ? 1 : -1
          return mb.finalScore - ma.finalScore || a.localeCompare(b)
        })
      }
    }
  }

  if (out.length !== ids.size) {
    return idList.map((i) => byId.get(i)!).filter(Boolean)
  }
  return out
}

function lockedFoundationPrereqWaiveIds(
  pool: ScoredModule[],
  userAttribute: string,
): ReadonlySet<string> {
  if (isNoviceUser(userAttribute)) return new Set()
  const s = new Set<string>()
  for (const m of pool) {
    if (m.locked && FOUNDATION_IDS_FOR_ADVANCED_LOCK.has(m.id)) s.add(m.id)
  }
  return s
}

/**
 * 前提閉包ベースのチェーンが maxSteps 未満のとき、スコア降順で前提を満たす未ロックモジュールを追記する。
 */
function extendChainToMaxTechniques(
  chain: ScoredModule[],
  rankedPool: ScoredModule[],
  maxSteps: number,
  userAttribute: string,
  foundationLockedWaiveIds: ReadonlySet<string>,
): ScoredModule[] {
  if (maxSteps <= 0) return []
  const out: ScoredModule[] = [...chain]
  const ids = new Set(out.map((m) => m.id))
  if (out.length >= maxSteps) return out.slice(0, maxSteps)

  const prereqSatisfied = (m: ScoredModule) =>
    effectivePrerequisiteIds(m.prerequisites, userAttribute).every(
      (p) => ids.has(p) || foundationLockedWaiveIds.has(p),
    )

  let progress = true
  while (out.length < maxSteps && progress) {
    progress = false
    for (const m of rankedPool) {
      if (out.length >= maxSteps) break
      if (ids.has(m.id) || m.locked) continue
      if (!prereqSatisfied(m)) continue
      out.push(m)
      ids.add(m.id)
      progress = true
    }
  }
  return out
}

function prerequisiteClosureIds(
  seedSlice: ScoredModule[],
  byId: Map<string, ScoredModule>,
  userAttribute: string,
): Set<string> {
  const out = new Set<string>()
  const walk = (id: string) => {
    if (out.has(id)) return
    out.add(id)
    const m = byId.get(id)
    if (!m) return
    for (const p of effectivePrerequisiteIds(m.prerequisites, userAttribute)) {
      if (byId.has(p)) walk(p)
    }
  }
  for (const s of seedSlice) walk(s.id)
  return out
}

/**
 * スコア上位モジュールをシードに、前提閉包を dependency 順で縦並び用のリストにする。
 */
export function buildShortLearningStreetPath(
  modules: ScoredModule[],
  options?: { maxSteps?: number; userAttribute?: string },
): ScoredModule[] {
  const maxSteps = Math.min(Math.max(options?.maxSteps ?? STREET_PASS_TECHNIQUE_MAX, 1), 12)
  if (!modules.length) return []

  const userAttribute = options?.userAttribute ?? '未経験'
  const byId = new Map(modules.map((m) => [m.id, m]))
  const ranked = [...modules].sort((a, b) => b.finalScore - a.finalScore || a.id.localeCompare(b.id))
  const sorted = isNoviceUser(userAttribute)
    ? ranked
    : ranked.filter((m) => m.id !== UKEMI_MODULE_ID)
  if (!sorted.length) return []

  const foundationWaive = lockedFoundationPrereqWaiveIds(sorted, userAttribute)

  const stripPolicyLocked = (topo: ScoredModule[]) => {
    const opened = topo.filter((m) => !m.locked)
    return opened.length > 0 ? opened : topo
  }

  const finalize = (chain: ScoredModule[]) => {
    const core = isNoviceUser(userAttribute) ? chain : stripPolicyLocked(chain)
    return extendChainToMaxTechniques(core, sorted, maxSteps, userAttribute, foundationWaive).slice(0, maxSteps)
  }

  const unlocked = sorted.filter((m) => !m.locked)
  const seedRanked = unlocked.length > 0 ? unlocked : sorted

  const cap = Math.min(maxSteps, seedRanked.length)

  for (let n = cap; n >= 1; n--) {
    const seeds = seedRanked.slice(0, n)
    const closure = prerequisiteClosureIds(seeds, byId, userAttribute)
    const topo = topologicalSortModuleSubset(closure, byId, userAttribute)
    if (topo.length <= maxSteps) {
      const chain = isNoviceUser(userAttribute) ? topo : topo.filter((m) => m.id !== UKEMI_MODULE_ID)
      return finalize(chain)
    }
  }

  const topo = topologicalSortModuleSubset(
    prerequisiteClosureIds(seedRanked.slice(0, 1), byId, userAttribute),
    byId,
    userAttribute,
  )
  const trimmed = topo.slice(0, maxSteps)
  const chain = isNoviceUser(userAttribute) ? trimmed : trimmed.filter((m) => m.id !== UKEMI_MODULE_ID)
  return finalize(chain)
}

export type LearningStreetPathOptions = {
  maxSteps?: number
  userAttribute?: string
  /**
   * 現在の Pass で完了済みのテクニック ID。先頭に固定し、残り枠だけ
   * {@link buildShortLearningStreetPath} で未完了候補から埋める（README §3.4）。
   */
  pinnedModuleIds?: Iterable<string>
}

/**
 * 1 Pass 用のテクニック列（最大 {@link STREET_PASS_TECHNIQUE_MAX} 件）。
 * `pinnedModuleIds` があればその順で先頭に置き、不足分のみ未完了プールから選ぶ。
 * 次 Pass（`stageMasteredExclude` 適用後）は `pinnedModuleIds` なしで 8 件を未完了から生成する。
 */
export function buildLearningStreetPathForPass(
  modules: ScoredModule[],
  options?: LearningStreetPathOptions,
): ScoredModule[] {
  const maxSteps = Math.min(Math.max(options?.maxSteps ?? STREET_PASS_TECHNIQUE_MAX, 1), 12)
  if (!modules.length) return []

  const userAttribute = options?.userAttribute ?? '未経験'
  const byId = new Map(modules.map((m) => [m.id, m]))
  const pinned: ScoredModule[] = []
  const pinnedSet = new Set<string>()

  if (options?.pinnedModuleIds) {
    for (const id of options.pinnedModuleIds) {
      if (pinnedSet.has(id)) continue
      const mod = byId.get(id)
      if (!mod) continue
      pinned.push(mod)
      pinnedSet.add(id)
    }
  }

  if (pinned.length >= maxSteps) return pinned.slice(0, maxSteps)

  const remaining = maxSteps - pinned.length
  const pool = modules.filter((m) => !pinnedSet.has(m.id))
  if (!pool.length) return pinned

  const additional = buildShortLearningStreetPath(pool, {
    maxSteps: remaining,
    userAttribute,
  })

  return [...pinned, ...additional].slice(0, maxSteps)
}
