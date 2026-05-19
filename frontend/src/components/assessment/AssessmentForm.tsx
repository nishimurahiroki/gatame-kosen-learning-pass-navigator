import { useCallback, useMemo, useReducer } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type {
  AssessmentRequest,
  AspirationStyleLabel,
  FinalGoalLabel,
  InterestOrientation,
  PainPointOption,
  UserSegment,
} from '../../types'
import en from '../../locales/en.json'
import {
  PAIN_POINT_OPTIONS,
  PROBLEM_ID_TO_LETTER,
  USER_SEGMENT_TO_ATTRIBUTE,
} from '../../types'
import AssessmentStatementList from './AssessmentStatementList'

type StepId = 'q1' | 'q2_interests' | 'q3_pains' | 'q2_alt' | 'q5'

type WizardState = {
  stepId: StepId
  segment: UserSegment | null
  interests: InterestOrientation | null
  painIds: string[]
  aspirations: AspirationStyleLabel[]
  finalGoal: FinalGoalLabel | null
  uiPhase: 'wizard' | 'submitting'
}

const initialWizard: WizardState = {
  stepId: 'q1',
  segment: null,
  interests: null,
  painIds: [],
  aspirations: [],
  finalGoal: null,
  uiPhase: 'wizard',
}

type Action =
  | { type: 'SET_SEGMENT'; segment: UserSegment }
  | { type: 'SET_INTEREST'; value: InterestOrientation }
  | { type: 'TOGGLE_PAIN'; id: string }
  | { type: 'TOGGLE_ASPIRATION'; label: AspirationStyleLabel }
  | { type: 'SET_GOAL'; goal: FinalGoalLabel }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }

function isNovice(s: UserSegment | null): boolean {
  return s === 'NOVICE'
}

function stepOrder(segment: UserSegment | null): StepId[] {
  if (!segment) return ['q1']
  if (isNovice(segment)) return ['q1', 'q2_alt', 'q5']
  return ['q1', 'q2_interests', 'q3_pains', 'q5']
}

function progressOf(stepId: StepId, segment: UserSegment | null): { current: number; total: number } {
  if (!segment) {
    // セグメント未選択時は経路総数が未確定。「q1 を回答中（completed=0）」として扱う。
    return { current: 0, total: 4 }
  }
  const order = stepOrder(segment)
  const idx = Math.max(0, order.indexOf(stepId))
  return { current: idx + 1, total: order.length }
}

function wizardReducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_SEGMENT': {
      const segmentChanged = state.segment !== action.segment
      if (!segmentChanged) return { ...state, segment: action.segment }
      const novice = isNovice(action.segment)
      return {
        ...state,
        segment: action.segment,
        stepId: 'q1',
        interests: novice ? null : state.interests,
        painIds: novice ? [] : state.painIds,
        aspirations: novice ? state.aspirations : [],
      }
    }
    case 'SET_INTEREST':
      return { ...state, interests: action.value }
    case 'TOGGLE_PAIN': {
      const set = new Set(state.painIds)
      set.has(action.id) ? set.delete(action.id) : set.add(action.id)
      return { ...state, painIds: [...set] }
    }
    case 'TOGGLE_ASPIRATION': {
      const set = new Set(state.aspirations)
      set.has(action.label) ? set.delete(action.label) : set.add(action.label)
      return { ...state, aspirations: [...set] as AspirationStyleLabel[] }
    }
    case 'SET_GOAL':
      return { ...state, finalGoal: action.goal }
    case 'NEXT': {
      const order = stepOrder(state.segment)
      const i = order.indexOf(state.stepId)
      if (i < 0) return { ...state, stepId: order[0]! }
      if (i >= order.length - 1) return state
      return { ...state, stepId: order[i + 1]! }
    }
    case 'BACK': {
      const order = stepOrder(state.segment)
      const i = order.indexOf(state.stepId)
      if (i < 0) return { ...state, stepId: order[0]! }
      if (i === 0) return state
      return { ...state, stepId: order[i - 1]! }
    }
    case 'SUBMIT_START':
      return { ...state, uiPhase: 'submitting' }
    case 'SUBMIT_END':
      return { ...state, uiPhase: 'wizard' }
    default:
      return state
  }
}

const SEGMENT_ITEMS = en.assessment.segments.map((row) => ({
  id: row.segment,
  segment: row.segment as UserSegment,
  title: row.title,
  description: row.subtitle,
}))

const INTEREST_ITEMS = en.assessment.interests.map((row) => ({
  id: row.value,
  value: row.value as InterestOrientation,
  title: row.title,
  description: row.body,
}))

const NOVICE_VIBE_ITEMS = en.assessment.noviceVibes.map((row) => ({
  id: row.label,
  label: row.label as AspirationStyleLabel,
  title: row.title,
  description: row.vibe,
}))

const GOAL_ITEMS = en.assessment.goals.map((row) => ({
  id: row.goal,
  goal: row.goal as FinalGoalLabel,
  title: row.title,
  description: row.body,
}))

const PAIN_ITEMS = PAIN_POINT_OPTIONS.map((p: PainPointOption) => ({
  id: p.id,
  title: p.headline,
  description: p.scenario,
}))

function buildPayload(state: WizardState): AssessmentRequest {
  if (!state.segment || !state.finalGoal) {
    throw new Error(en.errors.assessmentIncomplete)
  }
  const userAttribute = USER_SEGMENT_TO_ATTRIBUTE[state.segment]

  if (isNovice(state.segment)) {
    return {
      userAttribute,
      problems: [],
      aspirations: state.aspirations.length ? state.aspirations : [],
      finalGoal: state.finalGoal,
      completedModuleIds: [],
    }
  }

  const letters = state.painIds
    .map((id) => PROBLEM_ID_TO_LETTER[id])
    .filter((x): x is string => Boolean(x))

  return {
    userAttribute,
    interests: state.interests ?? undefined,
    problems: letters,
    aspirations: [],
    finalGoal: state.finalGoal,
    completedModuleIds: [],
  }
}

const fadeSlide = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
}

const stepHeadingClass = 'mb-4 text-lg font-semibold text-[#D4AF37] sm:text-xl'
const stepHintClass = 'mb-4 text-sm text-white/60'

interface AssessmentFormProps {
  onSubmit: (request: AssessmentRequest) => Promise<void>
  error: string | null
}

export default function AssessmentForm({ onSubmit, error }: AssessmentFormProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizard)

  const { current, total } = useMemo(
    () => progressOf(state.stepId, state.segment),
    [state.stepId, state.segment],
  )

  const canProceed = useCallback(() => {
    switch (state.stepId) {
      case 'q1':
        return state.segment !== null
      case 'q2_interests':
        return state.interests !== null
      case 'q3_pains':
        return true
      case 'q2_alt':
        return state.aspirations.length > 0
      case 'q5':
        return state.finalGoal !== null
      default:
        return false
    }
  }, [state])

  const handleSubmitWizard = async () => {
    if (!canProceed() || state.stepId !== 'q5') return
    dispatch({ type: 'SUBMIT_START' })
    try {
      const payload = buildPayload(state)
      await onSubmit(payload)
    } catch {
      /* 親で error に載る。オーバーレイは finally で解除 */
    } finally {
      dispatch({ type: 'SUBMIT_END' })
    }
  }

  const showBack = state.stepId !== 'q1'

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-black shadow-2xl">
      <motion.div className="border-b border-[#D4AF37]/25 px-4 pb-4 pt-6 sm:px-8">
        <h2 className="mb-2 text-center text-xl font-bold text-white sm:text-2xl">
          {en.assessment.heroTitle}
        </h2>
        <div className="mb-2 flex justify-between text-xs text-white/50">
          <span>
            {state.segment
              ? en.assessment.questionProgress
                  .replace('{current}', String(current))
                  .replace('{total}', String(total))
              : en.assessment.questionProgress
                  .replace('{current}', '1')
                  .replace('{total}', '?')}
          </span>
          <span>{state.segment && total > 0 ? Math.round((current / total) * 100) : 0}%</span>
        </div>
        <div className="flex h-2 gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                i < current ? 'bg-[#D4AF37]' : 'bg-white/15'
              }`}
            />
          ))}
        </div>
      </motion.div>

      <div className="min-h-[420px] px-4 py-6 sm:min-h-[480px] sm:px-8 sm:py-8">
        <AnimatePresence mode="wait">
          {state.uiPhase === 'wizard' && (
            <motion.div
              key={state.stepId}
              {...fadeSlide}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="space-y-6"
            >
              {state.stepId === 'q1' && (
                <section aria-labelledby="q1-title">
                  <h3 id="q1-title" className={`${stepHeadingClass} mb-2`}>
                    {en.assessment.q1Title}
                  </h3>
                  <p className={stepHintClass}>{en.assessment.chooseOneHint}</p>
                  <AssessmentStatementList
                    aria-labelledby="q1-title"
                    items={SEGMENT_ITEMS}
                    selectedId={state.segment}
                    onSelect={(id) =>
                      dispatch({ type: 'SET_SEGMENT', segment: id as UserSegment })
                    }
                  />
                </section>
              )}

              {state.stepId === 'q2_interests' && (
                <section aria-labelledby="q2-title">
                  <h3 id="q2-title" className={`${stepHeadingClass} mb-2`}>
                    {en.assessment.q2InterestTitle}
                  </h3>
                  <p className={stepHintClass}>{en.assessment.chooseOneHint}</p>
                  <AssessmentStatementList
                    aria-labelledby="q2-title"
                    items={INTEREST_ITEMS}
                    selectedId={state.interests}
                    onSelect={(id) =>
                      dispatch({ type: 'SET_INTEREST', value: id as InterestOrientation })
                    }
                  />
                </section>
              )}

              {state.stepId === 'q3_pains' && (
                <section aria-labelledby="q3-title">
                  <h3 id="q3-title" className={`${stepHeadingClass} mb-2`}>
                    {en.assessment.q3PainsTitle}
                  </h3>
                  <p className={stepHintClass}>{en.assessment.q3PainsHint}</p>
                  <AssessmentStatementList
                    aria-labelledby="q3-title"
                    items={PAIN_ITEMS}
                    selectedIds={state.painIds}
                    onSelect={(id) => dispatch({ type: 'TOGGLE_PAIN', id })}
                  />
                </section>
              )}

              {state.stepId === 'q2_alt' && (
                <section aria-labelledby="q2a-title">
                  <h3 id="q2a-title" className={`${stepHeadingClass} mb-2`}>
                    {en.assessment.q2AltTitle}
                  </h3>
                  <p className={stepHintClass}>{en.assessment.q2AltHint}</p>
                  <AssessmentStatementList
                    aria-labelledby="q2a-title"
                    items={NOVICE_VIBE_ITEMS}
                    selectedIds={state.aspirations}
                    onSelect={(id) =>
                      dispatch({
                        type: 'TOGGLE_ASPIRATION',
                        label: id as AspirationStyleLabel,
                      })
                    }
                  />
                </section>
              )}

              {state.stepId === 'q5' && (
                <section aria-labelledby="q5-title">
                  <h3 id="q5-title" className={`${stepHeadingClass} mb-2`}>
                    {en.assessment.q5Title}
                  </h3>
                  <p className={stepHintClass}>{en.assessment.chooseOneHint}</p>
                  <AssessmentStatementList
                    aria-labelledby="q5-title"
                    items={GOAL_ITEMS}
                    selectedId={state.finalGoal}
                    onSelect={(id) =>
                      dispatch({ type: 'SET_GOAL', goal: id as FinalGoalLabel })
                    }
                  />
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && state.uiPhase === 'wizard' && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {state.uiPhase === 'wizard' && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {showBack && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'BACK' })}
                className="order-2 rounded-xl border border-[#D4AF37]/35 px-6 py-4 text-sm font-medium text-white/80 transition-colors hover:bg-[#D4AF37]/10 sm:order-1 sm:py-3"
              >
                {en.assessment.back}
              </button>
            )}
            {state.stepId !== 'q5' ? (
              <button
                type="button"
                disabled={!canProceed()}
                onClick={() => dispatch({ type: 'NEXT' })}
                className="order-1 flex-1 rounded-xl bg-[#D4AF37] py-4 text-base font-bold text-black transition-opacity disabled:opacity-40 sm:order-2 sm:py-3"
              >
                {en.assessment.next}
              </button>
            ) : (
              <button
                type="button"
                disabled={!canProceed()}
                onClick={() => void handleSubmitWizard()}
                className="order-1 flex-1 rounded-xl bg-[#D4AF37] py-4 text-base font-bold text-black transition-opacity disabled:opacity-40 sm:order-2 sm:py-3"
              >
                {en.assessment.finishGenerate}
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {state.uiPhase === 'submitting' && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/92 px-6 backdrop-blur-md"
          >
            <motion.div
              className="h-16 w-16 rounded-full border-4 border-[#D4AF37] border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
            />
            <motion.div className="text-center">
              <p className="text-lg font-bold text-white">{en.assessment.loadingTitle}</p>
              <p className="mt-2 text-sm text-white/55">{en.assessment.loadingSubtitle}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
