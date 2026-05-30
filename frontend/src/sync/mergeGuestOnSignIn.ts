import { loadRemoteLearningPath } from '../api/supabaseProgressApi'
import {
  loadSavedLearningPath,
  saveSavedLearningPath,
  type SavedLearningPath,
} from '../utils/learningPathPersistence'
import { progressSessionId } from '../utils/progressStorage'
import { flushSyncQueue, syncLearningPath } from './syncService'
import { rekeyGuestOutbox } from './syncOutbox'

function pickLearningPath(
  guest: SavedLearningPath | null,
  remote: Awaited<ReturnType<typeof loadRemoteLearningPath>>,
): SavedLearningPath | null {
  if (!guest && !remote) return null
  if (!remote) return guest
  if (!guest) {
    return {
      assessmentRequest: remote.assessmentRequest,
      response: remote.response,
      savedAt: remote.savedAt,
    }
  }

  const fpGuest = progressSessionId(guest.assessmentRequest)
  const fpRemote = progressSessionId(remote.assessmentRequest)
  if (fpGuest !== fpRemote) {
    // fingerprint 不一致時は新しい方を採用（詳細 UI 選択は将来拡張）
    return guest.savedAt >= remote.savedAt
      ? guest
      : {
          assessmentRequest: remote.assessmentRequest,
          response: remote.response,
          savedAt: remote.savedAt,
        }
  }

  return guest.savedAt >= remote.savedAt
    ? guest
    : {
        assessmentRequest: remote.assessmentRequest,
        response: remote.response,
        savedAt: remote.savedAt,
      }
}

/**
 * Magic Link 後: guestLocal と authRemote をマージし Supabase へ反映（§10.8）。
 */
export async function mergeGuestOnSignIn(
  guestStorageId: string,
  userId: string,
): Promise<void> {
  if (!guestStorageId || !userId) return

  const guestLocal = loadSavedLearningPath(guestStorageId)
  const remote = await loadRemoteLearningPath(userId)
  const winner = pickLearningPath(guestLocal, remote)

  if (winner) {
    saveSavedLearningPath(userId, winner.assessmentRequest, winner.response)
    syncLearningPath(userId, winner.assessmentRequest, winner.response)
  }

  rekeyGuestOutbox(guestStorageId, userId)
  await flushSyncQueue(userId)
}
