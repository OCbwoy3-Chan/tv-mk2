import {AccessibilityInfo} from 'react-native'

import * as Toast from '#/components/Toast'
import * as persisted from '#/state/persisted'

type SixSevenControls = {
  burst: () => void
}

let controls: SixSevenControls | null = null

export function registerSixSevenControls(next: SixSevenControls | null) {
  controls = next
}

export function maybeCelebrateSixSevenLike({
  wasLiked,
  likeCount,
}: {
  wasLiked: boolean
  likeCount: number | undefined | null
}) {
  if (wasLiked) return
  if ((likeCount ?? 0) + 1 !== 67) return
  if (
    !(
      persisted.get('sixSevenCelebration') ??
      persisted.defaults.sixSevenCelebration
    )
  ) {
    return
  }
  void celebrateSixSeven()
}

export async function celebrateSixSeven() {
  Toast.show('six seven', {type: 'success'})

  const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled()
  if (!reduceMotion) {
    controls?.burst()
  }
}
