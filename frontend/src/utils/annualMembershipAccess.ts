import { loadMemberSelfDeclared } from './membershipSelfDeclareStorage'

export const ANNUAL_MEMBERSHIP_ACCESS_KEY = 'gatame.annual-membership-access.v2'
const PURCHASED_LEGACY_KEY = 'gatame.annual-membership-purchased.v1'

export type AnnualMembershipAccess = {
  answered: boolean
  hasAnnual: boolean
}

export const GATAME_ANNUAL_MEMBERSHIP_CHANGED_EVENT = 'gatame-annual-membership-changed'

function notifyChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent(GATAME_ANNUAL_MEMBERSHIP_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

function readV2(): AnnualMembershipAccess | null {
  try {
    const raw = localStorage.getItem(ANNUAL_MEMBERSHIP_ACCESS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AnnualMembershipAccess> | null
    if (!parsed || typeof parsed.answered !== 'boolean' || typeof parsed.hasAnnual !== 'boolean') {
      return null
    }
    return { answered: parsed.answered, hasAnnual: parsed.hasAnnual }
  } catch {
    return null
  }
}

function writeV2(access: AnnualMembershipAccess): void {
  try {
    localStorage.setItem(ANNUAL_MEMBERSHIP_ACCESS_KEY, JSON.stringify(access))
  } catch {
    /* ignore */
  }
  notifyChanged()
}

/** v1 自己申告・購入済みフラグから v2 へ移行 */
function migrateLegacyAccess(): AnnualMembershipAccess | null {
  let legacyPurchased = false
  try {
    legacyPurchased = localStorage.getItem(PURCHASED_LEGACY_KEY) === '1'
  } catch {
    legacyPurchased = false
  }
  const legacyMember = loadMemberSelfDeclared()
  if (!legacyPurchased && !legacyMember) return null
  const migrated: AnnualMembershipAccess = { answered: true, hasAnnual: true }
  writeV2(migrated)
  return migrated
}

export function loadAnnualMembershipAccess(): AnnualMembershipAccess | null {
  return readV2() ?? migrateLegacyAccess()
}

export function hasAnnualMembershipAnswered(): boolean {
  return loadAnnualMembershipAccess()?.answered === true
}

export function loadHasAnnualMembership(): boolean {
  const access = loadAnnualMembershipAccess()
  if (!access?.answered) return false
  return access.hasAnnual
}

/** 診断 Q4 または 1問モーダル・「購入済み」確認後 */
export function saveAnnualMembershipAccess(hasAnnual: boolean): void {
  writeV2({ answered: true, hasAnnual })
  if (hasAnnual) {
    try {
      localStorage.setItem(PURCHASED_LEGACY_KEY, '1')
    } catch {
      /* ignore */
    }
  }
}
