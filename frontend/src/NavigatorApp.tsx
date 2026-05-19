import { useCallback, useState } from 'react'
import AssessmentForm from './components/assessment/AssessmentForm'
import AuthLoadingScreen from './components/auth/AuthLoadingScreen'
import ConfirmDialog from './components/common/ConfirmDialog'
import PathGenerationLoadingScreen from './components/common/PathGenerationLoadingScreen'
import { showToast } from './components/common/Toast'
import AppBottomBar from './components/layout/AppBottomBar'
import AppBrandLogo from './components/layout/AppBrandLogo'
import VerticalPathContainer from './components/skillmap/VerticalPathContainer'
import { MembershipAccessProvider } from './context/MembershipAccessContext'
import { useAuth } from './context/AuthContext'
import { useSync } from './context/SyncContext'
import { useLearningPath } from './hooks/useLearningPath'
import en from './locales/en.json'
import type { AssessmentRequest } from './types'

/** 診断・学習パス本体（認証後に表示）。AssessmentForm 等の既存 UI はここからのみマウントする。 */
export default function NavigatorApp() {
  const { session } = useAuth()
  const userId = session?.user?.id
  const { status: syncStatus } = useSync()
  const syncBannerPad = syncStatus !== 'synced' ? 'pt-11' : ''
  const { data, error, generate, reset, cancel, lastAssessment, hydrated, loading } =
    useLearningPath(userId)
  const [pathGeneratedBanner, setPathGeneratedBanner] = useState(false)
  const [retakeConfirmOpen, setRetakeConfirmOpen] = useState(false)

  const handleAssessmentSubmit = async (request: AssessmentRequest) => {
    const initial: AssessmentRequest = {
      ...request,
      completedModuleIds: request.completedModuleIds ?? [],
      aspirations: request.aspirations ?? [],
    }
    try {
      await generate(initial)
      setPathGeneratedBanner(true)
    } catch (err) {
      if ((err as { name?: string } | null)?.name === 'AbortError') {
        // Cancel / Timeout: 静かにフォームへ戻り、トーストで通知。
        showToast(en.errors.pathGenerationCanceled, 'info')
        return
      }
      // 通常のエラーは AssessmentForm の `error` 表示に任せる（throw しない）
    }
  }

  const handleCancelGeneration = useCallback(() => {
    cancel()
  }, [cancel])

  const handlePathRefresh = useCallback(
    async (request: AssessmentRequest) => {
      try {
        await generate(request, { soft: true })
      } catch {
        /* 取得失敗時は画面上の既存パスを維持 */
      }
    },
    [generate],
  )

  const requestReset = () => setRetakeConfirmOpen(true)

  const handleConfirmReset = () => {
    setRetakeConfirmOpen(false)
    reset()
    setPathGeneratedBanner(false)
  }

  const onPathView = Boolean(data)

  /**
   * 初回ハイドレーション中は装飾なしの AuthLoadingScreen。
   * 学習パス生成中（loading=true && data 無し）は Cancel ボタン付きの専用画面に切り替える。
   * soft refresh 時は data を保持してパス UI を維持する。
   */
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
        className={`min-h-screen bg-gatame-navy px-4 ${syncBannerPad} ${onPathView ? 'pb-28 pt-4 md:pb-24' : 'pb-8 pt-10'}`}
      >
        <header
          className={`relative z-30 ${
            onPathView ? 'mb-3 flex items-center justify-center gap-2 sm:gap-3' : 'mb-10 text-center'
          }`}
        >
          {onPathView ? <AppBrandLogo variant="inline" /> : null}
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
            <div id="gatame-learning-path">
              <div className="relative z-20 mx-auto mb-3 flex max-w-5xl flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="min-w-0 text-base font-bold leading-snug sm:text-lg">
                  <span className="text-gatame-gold">{en.app.roadmapHeading}</span>
                  <span className="ml-2 text-sm font-semibold text-white/90 sm:text-base">
                    ({data.totalModules} {en.app.moduleCountSuffix})
                  </span>
                </h2>
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
                  onPathRefresh={handlePathRefresh}
                  showPathGeneratedBanner={pathGeneratedBanner}
                  onDismissPathGeneratedBanner={() => setPathGeneratedBanner(false)}
                  userId={userId}
                />
              </div>
            </div>
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
      </div>
    </MembershipAccessProvider>
  )
}
