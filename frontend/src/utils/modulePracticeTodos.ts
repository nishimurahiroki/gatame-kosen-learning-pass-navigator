import { TECHNIQUE_LIST } from '../constants/techniqueList'
import en from '../locales/en.json'
import type { ScoredModule } from '../types'

/** Build practice hint lines from module copy (same logic as VerticalPath). */
export function practiceHintsFromModule(m: ScoredModule): string[] {
  const parts = m.description
    .split(/[。\n]+|\.(?:\s+|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8)
  const hints = parts.slice(0, 4)
  if (m.scoreBreakdown.problemMatchBonus > 0) {
    hints.unshift(en.moduleHints.problemMatch)
  }
  return hints.length > 0 ? hints : [en.moduleHints.default]
}

export interface ModuleTodoItem {
  id: string
  label: string
}

export function moduleTodoItemsFromModule(m: ScoredModule): ModuleTodoItem[] {
  const techniques = TECHNIQUE_LIST[m.id]
  if (techniques?.length) {
    return techniques.map((label, i) => ({
      id: `tech-${i}`,
      label,
    }))
  }
  return practiceHintsFromModule(m).map((label, i) => ({
    id: `hint-${i}`,
    label,
  }))
}

export function countCheckedTodos(items: ModuleTodoItem[], checked: Record<string, boolean>): number {
  return items.filter((t) => checked[t.id]).length
}

export function allTodosChecked(items: ModuleTodoItem[], checked: Record<string, boolean>): boolean {
  if (!items.length) return true
  return items.every((t) => checked[t.id])
}
