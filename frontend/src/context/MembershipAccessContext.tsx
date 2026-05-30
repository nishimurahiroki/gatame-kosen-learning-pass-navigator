import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ANNUAL_MEMBERSHIP_ACCESS_KEY,
  GATAME_ANNUAL_MEMBERSHIP_CHANGED_EVENT,
  hasAnnualMembershipAnswered,
  loadHasAnnualMembership,
  saveAnnualMembershipAccess,
} from '../utils/annualMembershipAccess'

export type MembershipAccessContextValue = {
  /** 診断または 1 問モーダルで Annual の回答済みか */
  hasAnswered: boolean
  /** Annual Membership 購入済み（自己申告・診断回答） */
  hasAnnualMembership: boolean
  setAnnualMembership: (hasAnnual: boolean) => void
  /** 「I already purchased」等 — hasAnnual=true に固定 */
  markAnnualPurchased: () => void
}

const MembershipAccessContext = createContext<MembershipAccessContextValue | null>(null)

export function MembershipAccessProvider({ children }: { children: ReactNode }) {
  const [hasAnswered, setHasAnswered] = useState(() => hasAnnualMembershipAnswered())
  const [hasAnnualMembership, setHasAnnualMembershipState] = useState(() => loadHasAnnualMembership())

  const refresh = useCallback(() => {
    setHasAnswered(hasAnnualMembershipAnswered())
    setHasAnnualMembershipState(loadHasAnnualMembership())
  }, [])

  useEffect(() => {
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === ANNUAL_MEMBERSHIP_ACCESS_KEY) refresh()
    }
    const onLocal = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener(GATAME_ANNUAL_MEMBERSHIP_CHANGED_EVENT, onLocal)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(GATAME_ANNUAL_MEMBERSHIP_CHANGED_EVENT, onLocal)
    }
  }, [refresh])

  const setAnnualMembership = useCallback(
    (hasAnnual: boolean) => {
      saveAnnualMembershipAccess(hasAnnual)
      refresh()
    },
    [refresh],
  )

  const markAnnualPurchased = useCallback(() => {
    saveAnnualMembershipAccess(true)
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      hasAnswered,
      hasAnnualMembership,
      setAnnualMembership,
      markAnnualPurchased,
    }),
    [hasAnswered, hasAnnualMembership, setAnnualMembership, markAnnualPurchased],
  )

  return <MembershipAccessContext.Provider value={value}>{children}</MembershipAccessContext.Provider>
}

export function useMembershipAccess(): MembershipAccessContextValue {
  const ctx = useContext(MembershipAccessContext)
  if (!ctx) {
    throw new Error('useMembershipAccess must be used within MembershipAccessProvider')
  }
  return ctx
}
