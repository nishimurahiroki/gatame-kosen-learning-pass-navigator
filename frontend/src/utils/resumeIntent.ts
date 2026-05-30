const RESUME_LOCAL_KEY = 'gatame.intent.resume-local.v1'

export function setResumeLocalIntent(): void {
  try {
    sessionStorage.setItem(RESUME_LOCAL_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function consumeResumeLocalIntent(): boolean {
  try {
    const v = sessionStorage.getItem(RESUME_LOCAL_KEY)
    if (v) sessionStorage.removeItem(RESUME_LOCAL_KEY)
    return v === '1'
  } catch {
    return false
  }
}
