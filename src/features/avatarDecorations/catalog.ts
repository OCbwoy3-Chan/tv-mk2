import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

/** Adapted from eurosky-social/eurosky-social-app (MIT). */
/**
 * Curated avatar decoration frames (the Eurosky+ catalog).
 *
 * A subscriber's settings record names a frame by id. Unknown ids are
 * ignored, so frames added in newer builds degrade gracefully in older ones
 * and junk in a settings record can never render anything we don't ship.
 *
 * v1 frames are code-drawn rings. Image-based frames can extend this type
 * later without touching the read path.
 */
export type DecorationFrame = {
  id: string
  /* Picker display name. */
  name: MessageDescriptor
  /* Ring stroke color. */
  color: string
}

export const DECORATION_FRAMES: DecorationFrame[] = [
  {id: 'gold-ring', name: msg`Gold`, color: '#FFD700'},
  {id: 'flame-ring', name: msg`Flame`, color: '#F2571F'},
  {id: 'ocean-ring', name: msg`Ocean`, color: '#28ACDC'},
]

export function getFrame(id: string | undefined): DecorationFrame | undefined {
  if (!id) return undefined
  return DECORATION_FRAMES.find(f => f.id === id)
}
