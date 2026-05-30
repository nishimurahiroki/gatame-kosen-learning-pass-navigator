import type { PainPointOption } from '../types'
import en from './en.json'

/** specification.md §1.3 / §7.2 — Q2 課題 ID（表示順） */
export const PAIN_POINT_ORDER = [
  'standing-flow-to-submission',
  'pin-after-throw',
  'turtle-breakdown',
  'submission-arts-mastery',
  'guard-pass-defense',
  'grip-fight',
] as const

const PAIN_POINT_ICONS: Record<(typeof PAIN_POINT_ORDER)[number], string> = {
  'standing-flow-to-submission': '⚡',
  'pin-after-throw': '🎯',
  'turtle-breakdown': '🐢',
  'submission-arts-mastery': '🥋',
  'guard-pass-defense': '🛡️',
  'grip-fight': '🤝',
}

type PainCopy = Record<(typeof PAIN_POINT_ORDER)[number], { headline: string; scenario: string }>

const painCopy = en.painPoints as PainCopy

export const PAIN_POINT_OPTIONS: PainPointOption[] = PAIN_POINT_ORDER.map((id) => ({
  id,
  icon: PAIN_POINT_ICONS[id],
  headline: painCopy[id].headline,
  scenario: painCopy[id].scenario,
}))
