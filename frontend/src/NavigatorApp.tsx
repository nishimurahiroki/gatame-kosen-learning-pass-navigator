import { useCallback, useEffect, useMemo, useState } from 'react'
import AssessmentForm from './components/assessment/AssessmentForm'
import AuthLoadingScreen from './components/auth/AuthLoadingScreen'
import SyncSaveModal from './components/auth/SyncSaveModal'
import ConfirmDialog from './components/common/ConfirmDialog'
import PathGenerationLoadingScreen from './components/common/PathGenerationLoadingScreen'
import SaveProgressButton from './components/common/SaveProgressButton'
import SaveProgressRecommendCard from './components/common/SaveProgressRecommendCard'
import { showToast } from './components/common/Toast'
import AppBottomBar from './components/layout/AppBottomBar'
import AppBrandLogo from './components/layout/AppBrandLogo'
import AnnualMembershipAskModal from './components/membership/AnnualMembershipAskModal'
import VerticalPathContainer from './components/skillmap/VerticalPathContainer'
import { MembershipAccessProvider, useMembershipAccess } from './context/MembershipAccessContext'
import { useAuth } from './context/AuthContext'
import { useLearningPath } from './hooks/useLearningPath'
import en from './locales/en.json'
import type { AssessmentRequest } from './types'
import { getGuestStorageId } from './utils/guestDevice'
import { bumpAppLaunchCount } from './utils/practiceCheckPersistence'
import { tryGuestSaveProgressPrompt } from './utils/guestSaveProgressPrompt'
import { progressSessionId } from './utils/progressStorage'

function PathViewExtras() {
  const { hasAnswered } = useMembershipAccess()
  return <AnnualMembershipAskModal open={!hasAnswered} />
}

export default function NavigatorApp() {
  const { session } = useAuth()
  const syncUserId = session?.user?.id
  const guestStorageId = useMemo(() => getGuestStorageId(), [])
  const storageId = syncUserId ?? guestStorageId
  const isGuest = !syncUserId

  useEffect(() => {
    if (!storageId) return
    bumpAppLaunchCount(storageId)
  }, [storageId])

  const { data, error, generate, generateNextPath, reset, cancel, lastAssessment, hydrated, loading } =
    useLearningPath({ storageId, syncUserId })

  const [retakeConfirmOpen, setRetakeConfirmOpen] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [saveRecommendOpen, setSaveRecommendOpen] = useState(false)
  const [saveRecommendMessage, setSaveRecommendMessage] = useState('')

  const assessmentFingerprint = useMemo(
    () => (lastAssessment ? progressSessionId(lastAssessment) : ''),
    [lastAssessment],
  )

  const recommendSaveProgress = useCallback(
    (trigger: 'drawer' | 'todo') => {
      const message =
        trigger === 'drawer' ? en.top.saveProgressPromptDrawer : en.top.saveProgressPromptTodo
      tryGuestSaveProgressPrompt(guestStorageId, assessmentFingerprint, trigger, () => {
        setSaveRecommendMessage(message)
        setSaveRecommendOpen(true)
      })
    },
    [guestStorageId, assessmentFingerprint],
  )

  const handleGuestEngagement = useCallback(
    (kind: 'drawer_open' | 'todo_check') => {
      if (!isGuest) return
      recommendSaveProgress(kind === 'drawer_open' ? 'drawer' : 'todo')
    },
    [isGuest, recommendSaveProgress],
  )

  const handleAssessmentSubmit = async (request: AssessmentRequest) => {
    const initial: AssessmentRequest = {
      ...request,
      completedModuleIds: request.completedModuleIds ?? [],
      aspirations: request.aspirations ?? [],
    }
    try {
      await generate(initial)
    } catch (err) {
      if ((err as { name?: string } | null)?.name === 'AbortError') {
        showToast(en.errors.pathGenerationCanceled, 'info')
        return
      }
    }
  }

  const handleCancelGeneration = useCallback(() => {
    cancel()
  }, [cancel])

  const requestReset = () => setRetakeConfirmOpen(true)

  const handleConfirmReset = () => {
    setRetakeConfirmOpen(false)
    reset()
  }

  const handleGenerateNextPath = useCallback(async () => {
    try {
      await generateNextPath()
    } catch (err) {
      if ((err as { name?: string } | null)?.name === 'AbortError') {
        showToast(en.errors.pathGenerationCanceled, 'info')
        return
      }
      const message = err instanceof Error ? err.message : en.errors.learningPathFailed
      showToast(message, 'error')
    }
  }, [generateNextPath])

  const onPathView = Boolean(data)

  if (!hydrated) {
    return <AuthLoadingScreen />
  }

  if (loading && !data) {
    return <PathGenerationLoadingScreen onCancel={handleCancelGeneration} />
  }

  return (
    <MembershipAccessProvider>
      {!onPathView ? <AppBrandLogo /> : null}
      <div
        className={`min-h-screen bg-gatame-navy px-4 ${onPathView ? 'pb-28 pt-4 md:pb-24' : 'pb-8 pt-10'}`}
      >
        <header
          className={`relative z-30 ${
            onPathView ? 'mb-3 flex items-center justify-center gap-2 sm:gap-3' : 'mb-10 text-center'
          }`}
        >
          {onPathView ? <AppBrandLogo variant="inline" tappableToHome /> : null}
          <h1
            className={
              onPathView
                ? 'whitespace-nowrap text-base font-bold tracking-tight text-white sm:text-lg'
                : 'text-4xl font-black tracking-tight text-white'
            }
          >
            <span className="text-gatame-gold">GATAME</span> {en.app.title}
          </h1>
          {!onPathView ? <p className="mt-2 text-sm text-white/50">{en.app.subtitle}</p> : null}
        </header>

        <main id="gatame-app-main" className="mx-auto max-w-5xl">
          {!data && <AssessmentForm onSubmit={handleAssessmentSubmit} error={error} />}

          {data && (
            <>
              <PathViewExtras />
              <div id="gatame-learning-path">
                <div className="relative z-20 mx-auto mb-3 flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="min-w-0 text-base font-bold leading-snug sm:text-lg">
                      <span className="text-gatame-gold">{en.app.roadmapHeading}</span>
                    </h2>
                    {isGuest ? (
                      <SaveProgressButton onClick={() => setSyncModalOpen(true)} />
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={requestReset}
                    className="shrink-0 text-xs font-medium text-white/75 underline underline-offset-2 hover:text-gatame-gold sm:text-sm"
                  >
                    {en.app.retakeAssessment}
                  </button>
                </div>
                <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
                  <VerticalPathContainer
                    response={data}
                    assessmentRequest={lastAssessment}
                    userId={syncUserId}
                    storageId={storageId}
                    onGuestEngagement={handleGuestEngagement}
                    onGenerateNextPath={handleGenerateNextPath}
                    onRequestRetake={requestReset}
                    generatingNextPath={loading && Boolean(data)}
                  />
                </div>
              </div>
            </>
          )}
        </main>

        {onPathView && data ? (
          <AppBottomBar
            assessmentRequest={lastAssessment}
            catalogModuleTotal={Math.max(1, data.totalModules)}
          />
        ) : null}

        <ConfirmDialog
          open={retakeConfirmOpen}
          title={en.confirm.retakeAssessment.title}
          description={en.confirm.retakeAssessment.description}
          confirmLabel={en.confirm.retakeAssessment.confirm}
          cancelLabel={en.common.cancel}
          tone="destructive"
          onConfirm={handleConfirmReset}
          onCancel={() => setRetakeConfirmOpen(false)}
        />

        <SaveProgressRecommendCard
          open={saveRecommendOpen}
          message={saveRecommendMessage}
          onSave={() => {
            setSaveRecommendOpen(false)
            setSyncModalOpen(true)
          }}
          onDismiss={() => setSaveRecommendOpen(false)}
        />

        <SyncSaveModal open={syncModalOpen} onClose={() => setSyncModalOpen(false)} />
      </div>
    </MembershipAccessProvider>
  )
}
