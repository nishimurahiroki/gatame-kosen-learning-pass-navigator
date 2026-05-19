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

export function loadCompletedModuleIds(
  req: AssessmentRequest | null,
  validIds: Set<string>,
): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(req))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id)))
  } catch {
    return new Set()
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

export function saveCompletedModuleIds(req: AssessmentRequest | null, ids: Set<string>): void {
  try {
    localStorage.setItem(storageKey(req), JSON.stringify([...ids]))
    notifyModuleProgressChanged()
  } catch {
    /* ストレージ満杯・プライベートモード等は無視 */
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

/** セッション JSON の完了 ID（validIds フィルタなし・BBS ノード除外）。Pass ピン留め・Profile 集計に使用。 */
export function loadRawSessionCompletedModuleIds(req: AssessmentRequest | null): Set<string> {
  if (!req) return new Set()
  try {
    const raw = localStorage.getItem(storageKey(req))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    const out = new Set<string>()
    for (const id of parsed) {
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
