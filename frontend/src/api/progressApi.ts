import axios from 'axios'

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

export type DifficultyFeedbackApi = 'TOO_EASY' | 'JUST_RIGHT' | 'TOO_HARD'

export async function postModuleFeedback(params: {
  sessionKey: string
  moduleId: string
  difficulty: DifficultyFeedbackApi
  satisfaction: number
  videoRequestNote?: string
}): Promise<void> {
  await api.post('/api/progress/module-feedback', {
    sessionKey: params.sessionKey,
    moduleId: params.moduleId,
    difficulty: params.difficulty,
    satisfaction: params.satisfaction,
    videoRequestNote: params.videoRequestNote?.trim() || undefined,
  })
}
