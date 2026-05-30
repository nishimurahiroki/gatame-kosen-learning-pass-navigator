import type { AssessmentRequest } from '../types'
import { BBS_LEVEL_SEQUENCE, type BbsLevelKey } from '../constants/bbsOffers'

const STORAGE_PREFIX = 'gatame.skill-progress.v1:'
const LIFETIME_PREFIX = 'gatame.lifetime-mastered.v1:'
/** localStorage の値は `BbsLevelKey[]`（＝ completedBbsLevels と同一の意味） */
const BBS_DECLARED_MASTERED_PREFIX = 'gatame.bbs-declared-mastered.v1:'

function hashFingerprint(raw: string): string {
  let h = 5381
  for (let i = 0; i < raw.length; i++) {
    h = Math.imul(h, 33) ^ raw.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

/** 診断スナップショットからローカル進捗キーを生成 */
export function assessmentFingerprint(req: AssessmentRequest | null): string {
  if (!req) return 'anonymous'
  const raw = JSON.stringify({
    ua: req.userAttribute,
    interests: req.interests ?? null,
    problems: [...(req.problems ?? [])].sort(),
    aspirations: [...(req.aspirations ?? [])].sort(),
    fg: req.finalGoal ?? null,
  })
  return hashFingerprint(raw)
}

export function storageKey(req: AssessmentRequest | null): string {
  return STORAGE_PREFIX + assessmentFingerprint(req)
}

/** バックエンド進捗 API 用セッション識別子（診断スナップショットのハッシュ） */
export function progressSessionId(req: AssessmentRequest | null): string {
  return assessmentFingerprint(req)
}

type PathSessionPayloadV1 = {
  v: 1
  pathSignature: string
  completedIds: string[]
}

/** 現在パス上のモジュール ID からセッション署名を生成（パス再生成時に進捗を切り替える） */
export function pathModuleSignature(pathModuleIds: string[]): string {
  return hashFingerprint([...pathModuleIds].sort().join('\u0001'))
}

function readSessionPayload(raw: string): PathSessionPayloadV1 | string[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return parsed
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as PathSessionPayloadV1).v === 1 &&
      typeof (parsed as PathSessionPayloadV1).pathSignature === 'string' &&
      Array.isArray((parsed as PathSessionPayloadV1).completedIds)
    ) {
      return parsed as PathSessionPayloadV1
    }
    return null
  } catch {
    return null
  }
}

export function loadCompletedModuleIds(
  req: AssessmentRequest | null,
  validIds: Set<string>,
): Set<string> {
  return loadPathSessionCompletedIds(req, [...validIds])
}

/**
 * 現在の学習パス（モジュール構成）に紐づくセッション完了 ID。
 * パス署名が一致しない場合は空（新パス生成直後の誤復元を防ぐ）。
 */
export function loadPathSessionCompletedIds(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
): Set<string> {
  if (!req || pathModuleIds.length === 0) return new Set()
  const expectedSig = pathModuleSignature(pathModuleIds)
  const onPath = new Set(pathModuleIds)
  try {
    const raw = localStorage.getItem(storageKey(req))
    if (!raw) return new Set()
    const payload = readSessionPayload(raw)
    if (!payload) return new Set()
    if (Array.isArray(payload)) {
      // 旧形式は誤復元（全モジュール Completed）の原因になるため読み込まない
      return new Set()
    }
    if (payload.pathSignature !== expectedSig) return new Set()
    return new Set(
      payload.completedIds.filter((id): id is string => typeof id === 'string' && onPath.has(id)),
    )
  } catch {
    return new Set()
  }
}

/** 学習パス新規生成時: 完了状態をリセットし、現在パス署名を保存 */
export function initializePathSessionProgress(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
): void {
  savePathSessionCompletedIds(req, pathModuleIds, new Set())
}

/**
 * 保存済みパスと進捗署名を揃える（ハイドレート時・旧形式データの修復）。
 * 署名不一致・旧配列形式のときはセッション完了を空にする。
 */
export function ensurePathSessionAligned(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
): void {
  if (!req || pathModuleIds.length === 0) return
  const expectedSig = pathModuleSignature(pathModuleIds)
  try {
    const raw = localStorage.getItem(storageKey(req))
    if (!raw) {
      initializePathSessionProgress(req, pathModuleIds)
      return
    }
    const payload = readSessionPayload(raw)
    if (Array.isArray(payload) || !payload || payload.pathSignature !== expectedSig) {
      initializePathSessionProgress(req, pathModuleIds)
    }
  } catch {
    initializePathSessionProgress(req, pathModuleIds)
  }
}

export function clearPathSessionProgress(req: AssessmentRequest | null): void {
  if (!req) return
  try {
    localStorage.removeItem(storageKey(req))
    notifyModuleProgressChanged()
  } catch {
    /* ignore */
  }
}

export function savePathSessionCompletedIds(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
  ids: Set<string>,
): void {
  if (!req || pathModuleIds.length === 0) return
  const onPath = new Set(pathModuleIds)
  const payload: PathSessionPayloadV1 = {
    v: 1,
    pathSignature: pathModuleSignature(pathModuleIds),
    completedIds: [...ids].filter((id) => onPath.has(id)),
  }
  try {
    localStorage.setItem(storageKey(req), JSON.stringify(payload))
    notifyModuleProgressChanged()
  } catch {
    /* ignore */
  }
}

/** VerticalPath の完了トグル保存後に発火（Profile 進捗などが同一タブで追従する） */
export const GATAME_MODULE_PROGRESS_CHANGED_EVENT = 'gatame-module-progress-changed' as const

export function notifyModuleProgressChanged(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(GATAME_MODULE_PROGRESS_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}


function lifetimeKey(req: AssessmentRequest | null): string {
  return LIFETIME_PREFIX + assessmentFingerprint(req)
}

/** 診断スナップショット単位で「一度でも完了した」テクニックモジュール ID（パス再生成の除外用・API completed にも流用） */
export function loadLifetimeMasteredModuleIds(req: AssessmentRequest | null): Set<string> {
  try {
    const raw = localStorage.getItem(lifetimeKey(req))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0))
  } catch {
    return new Set()
  }
}

/**
 * セッション JSON の完了 ID（BBS ノード除外）。
 * pathModuleIds がある場合は {@link loadPathSessionCompletedIds} と同じく署名付き読み込み。
 */
export function loadRawSessionCompletedModuleIds(
  req: AssessmentRequest | null,
  pathModuleIds?: string[],
): Set<string> {
  if (!req) return new Set()
  if (pathModuleIds && pathModuleIds.length > 0) {
    return loadPathSessionCompletedIds(req, pathModuleIds)
  }
  try {
    const raw = localStorage.getItem(storageKey(req))
    if (!raw) return new Set()
    const payload = readSessionPayload(raw)
    if (!payload) return new Set()
    const ids = Array.isArray(payload) ? payload : payload.completedIds
    const out = new Set<string>()
    for (const id of ids) {
      if (typeof id === 'string' && !id.startsWith('bbs-offer:')) out.add(id)
    }
    return out
  } catch {
    return new Set()
  }
}

/** 診断スナップショット単位で「完了ボタン」済みのテクニックモジュール数（生涯 ∪ セッション）。 */
export function countCompletedTechniqueModules(req: AssessmentRequest | null): number {
  if (!req) return 0
  const merged = new Set<string>()
  for (const id of loadLifetimeMasteredModuleIds(req)) {
    if (!id.startsWith('bbs-offer:')) merged.add(id)
  }
  for (const id of loadRawSessionCompletedModuleIds(req)) merged.add(id)
  return merged.size
}

/** 現在パスのセッション完了 ID を lifetime に昇格（次パス生成の除外用） */
export function promotePathSessionToLifetime(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
): void {
  if (!req || pathModuleIds.length === 0) return
  const sessionCompleted = loadPathSessionCompletedIds(req, pathModuleIds)
  mergeLifetimeMasteredModuleIds(req, sessionCompleted)
}

/** 次パス生成 API 用: lifetime 習得済みモジュール ID 一覧 */
export function buildCompletedModuleIdsForRegeneration(req: AssessmentRequest | null): string[] {
  if (!req) return []
  return [...loadLifetimeMasteredModuleIds(req)].filter((id) => !id.startsWith('bbs-offer:'))
}

/** lifetime ∪ 現在パス session の習得済み数（副作用なし） */
export function countMasteredModuleIdsForRegeneration(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
): number {
  if (!req) return 0
  const merged = new Set<string>()
  for (const id of loadLifetimeMasteredModuleIds(req)) {
    if (!id.startsWith('bbs-offer:')) merged.add(id)
  }
  for (const id of loadPathSessionCompletedIds(req, pathModuleIds)) {
    if (!id.startsWith('bbs-offer:')) merged.add(id)
  }
  return merged.size
}

/** カタログに未習得モジュールが残っているか（次パス生成可否の目安） */
export function canGenerateNextPath(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
  catalogModuleTotal: number,
): boolean {
  if (!req || pathModuleIds.length === 0) return false
  return (
    countMasteredModuleIdsForRegeneration(req, pathModuleIds) < Math.max(1, catalogModuleTotal)
  )
}

export function mergeLifetimeMasteredModuleIds(req: AssessmentRequest | null, ids: Iterable<string>): boolean {
  if (!req) return false
  const cur = loadLifetimeMasteredModuleIds(req)
  let changed = false
  for (const id of ids) {
    if (typeof id !== 'string' || id.startsWith('bbs-offer:')) continue
    if (!cur.has(id)) {
      cur.add(id)
      changed = true
    }
  }
  if (!changed) return false
  try {
    localStorage.setItem(lifetimeKey(req), JSON.stringify([...cur]))
    notifyModuleProgressChanged()
  } catch {
    return false
  }
  return true
}

/** 完了 Undo 時: lifetime から除外（次パス抽選・Profile 進捗の整合） */
export function removeLifetimeMasteredModuleIds(req: AssessmentRequest | null, ids: Iterable<string>): boolean {
  if (!req) return false
  const cur = loadLifetimeMasteredModuleIds(req)
  let changed = false
  for (const id of ids) {
    if (typeof id !== 'string' || id.startsWith('bbs-offer:')) continue
    if (cur.delete(id)) changed = true
  }
  if (!changed) return false
  try {
    localStorage.setItem(lifetimeKey(req), JSON.stringify([...cur]))
    notifyModuleProgressChanged()
  } catch {
    return false
  }
  return true
}

function bbsDeclaredMasteredKey(req: AssessmentRequest | null): string {
  return BBS_DECLARED_MASTERED_PREFIX + assessmentFingerprint(req)
}

export function loadBbsDeclaredMasteredLevels(req: AssessmentRequest | null): Set<BbsLevelKey> {
  if (!req) return new Set()
  try {
    const raw = localStorage.getItem(bbsDeclaredMasteredKey(req))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    const out = new Set<BbsLevelKey>()
    for (const x of parsed) {
      if (typeof x !== 'string') continue
      if ((BBS_LEVEL_SEQUENCE as readonly string[]).includes(x)) out.add(x as BbsLevelKey)
    }
    return out
  } catch {
    return new Set()
  }
}

export function addBbsDeclaredMasteredLevel(req: AssessmentRequest | null, level: BbsLevelKey): boolean {
  if (!req) return false
  const cur = loadBbsDeclaredMasteredLevels(req)
  if (cur.has(level)) return false
  cur.add(level)
  try {
    localStorage.setItem(bbsDeclaredMasteredKey(req), JSON.stringify([...cur]))
    return true
  } catch {
    return false
  }
}

/** `completedBbsLevels` に級を追加（I've Mastered This Level）。 */
export function addCompletedBbsLevel(req: AssessmentRequest | null, level: BbsLevelKey): boolean {
  return addBbsDeclaredMasteredLevel(req, level)
}
