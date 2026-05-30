import techniqueFocusPointsMarkdown from './technique-focus-points.md?raw'

type FocusTuple = [string, string, string]

const SECTION_TO_MODULE_ID: Array<{ section: string; moduleId: string }> = [
  { section: 'Ukemi', moduleId: 'ukemi' },
  { section: 'Solo Newaza Workout', moduleId: 'solo-newaza-workout' },
  { section: 'OSAEKOMI', moduleId: 'osaekomi' },
  { section: 'Fundamental Tachi Waza', moduleId: 'fundamental-tachi-waza' },
  { section: 'KUMIKATA in AI YOTSU', moduleId: 'kumikata-ai-yotsu' },
  { section: 'KUMIKATA in KENKA YOTSU', moduleId: 'kumikata-kenka-yotsu' },
  { section: 'Break the Gripping in AI YOTSU', moduleId: 'break-gripping-ai-yotsu' },
  { section: 'Break the Gripping in KENKA YOTSU', moduleId: 'break-gripping-kenka-yotsu' },
  { section: 'KANSETSU WAZA (Arm Lock)', moduleId: 'kansetsu-waza' },
  { section: 'SHIME (Choking Techniques)', moduleId: 'shime-waza' },
  { section: 'Guard Pass on the Bottom', moduleId: 'guard-pass-bottom' },
  { section: 'Guard Pass on the Top', moduleId: 'guard-pass-top' },
  { section: 'On the Turtle', moduleId: 'on-the-turtle' },
  { section: 'Escape from OSAEKOMI', moduleId: 'escape-from-osaekomi' },
  { section: 'Throwing', moduleId: 'throwing' },
  { section: 'SHIME WAZA Transition', moduleId: 'shime-waza-transition' },
  { section: 'KANSETSU WAZA Transition', moduleId: 'kansetsu-waza-transition' },
  { section: 'OSAEKOMI Transition', moduleId: 'osaekomi-transition' },
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function resolveModuleId(sectionHeading: string): string | null {
  const hit = SECTION_TO_MODULE_ID.find(({ section }) => sectionHeading.includes(section))
  return hit?.moduleId ?? null
}

function parseFocusPointsMarkdown(markdown: string): Map<string, Map<string, FocusTuple>> {
  const moduleMap = new Map<string, Map<string, FocusTuple>>()
  const lines = markdown.split(/\r?\n/)

  let currentModuleId: string | null = null
  let currentTechniqueTitle: string | null = null
  let currentPoints: string[] = []

  const flushTechnique = () => {
    if (!currentModuleId || !currentTechniqueTitle || currentPoints.length < 3) {
      currentTechniqueTitle = null
      currentPoints = []
      return
    }
    const moduleEntry = moduleMap.get(currentModuleId) ?? new Map<string, FocusTuple>()
    moduleEntry.set(normalize(currentTechniqueTitle), [
      currentPoints[0],
      currentPoints[1],
      currentPoints[2],
    ])
    moduleMap.set(currentModuleId, moduleEntry)
    currentTechniqueTitle = null
    currentPoints = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('## ')) {
      flushTechnique()
      currentModuleId = resolveModuleId(line.slice(3).trim())
      continue
    }

    if (line.startsWith('### ')) {
      flushTechnique()
      currentTechniqueTitle = line.slice(4).trim()
      continue
    }

    if (/^\d+\.\s+/.test(line) && currentTechniqueTitle) {
      const point = line.replace(/^\d+\.\s+/, '').trim()
      if (point.length > 0) currentPoints.push(point)
    }
  }

  flushTechnique()
  return moduleMap
}

const FOCUS_POINTS_MASTER = parseFocusPointsMarkdown(techniqueFocusPointsMarkdown)

export function getTechniqueFocusPoints(moduleId: string, techniqueName: string): FocusTuple | null {
  const entry = FOCUS_POINTS_MASTER.get(moduleId)
  if (!entry) return null

  const normalized = normalize(techniqueName)
  const exact = entry.get(normalized)
  if (exact) return exact

  for (const [key, points] of entry.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) return points
  }
  return null
}
