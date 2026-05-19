import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  loadMemberSelfDeclared,
  MEMBER_SELF_DECLARE_STORAGE_KEY,
  saveMemberSelfDeclared,
} from '../utils/membershipSelfDeclareStorage'

export type MembershipAccessContextValue = {
  /** Bottom Bar 中央が Login になる自己申告会員か */
  isMember: boolean
  /** Member 選択時: 永続化し即座に isMember を true に */
  declareMember: () => void
}

const MembershipAccessContext = createContext<MembershipAccessContextValue | null>(null)

export function MembershipAccessProvider({ children }: { children: ReactNode }) {
  const [isMember, setIsMember] = useState(() => loadMemberSelfDeclared())

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== MEMBER_SELF_DECLARE_STORAGE_KEY) return
      setIsMember(loadMemberSelfDeclared())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const declareMember = useCallback(() => {
    saveMemberSelfDeclared()
    setIsMember(true)
  }, [])

  const value = useMemo(
    () => ({
      isMember,
      declareMember,
    }),
    [isMember, declareMember],
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
