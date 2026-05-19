import type { PainPointOption } from '../types'
import en from './en.json'

const PAIN_POINT_ORDER = [
  'standing-flow-to-submission',
  'pin-after-throw',
  'turtle-breakdown',
  'guard-pass-from-top',
  'guard-bottom-sweep-submit',
  'grip-fight',
  'escape-osaekomi',
] as const

const PAIN_POINT_ICONS: Record<(typeof PAIN_POINT_ORDER)[number], string> = {
  'standing-flow-to-submission': '⚡',
  'pin-after-throw': '🎯',
  'turtle-breakdown': '🐢',
  'guard-pass-from-top': '🛡️',
  'guard-bottom-sweep-submit': '🔄',
  'grip-fight': '🤝',
  'escape-osaekomi': '🚪',
}

type PainCopy = Record<(typeof PAIN_POINT_ORDER)[number], { headline: string; scenario: string }>

const painCopy = en.painPoints as PainCopy

export const PAIN_POINT_OPTIONS: PainPointOption[] = PAIN_POINT_ORDER.map((id) => ({
  id,
  icon: PAIN_POINT_ICONS[id],
  headline: painCopy[id].headline,
  scenario: painCopy[id].scenario,
}))
