import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

/** Adapted from eurosky-social/eurosky-social-app (MIT). */
/**
 * Curated display-name gradients (Eurosky+).
 *
 * A subscriber's settings record names a gradient by id; unknown ids are
 * ignored, so gradients added later degrade gracefully in older builds.
 *
 * Colors are chosen to stay legible against BOTH the light and dark name
 * backgrounds - i.e. mid-luminance, saturated - because the same stops render
 * on either theme. `solid` is a representative single color used where a true
 * text gradient isn't available (native, until masked-view lands).
 */
export type NameGradient = {
  id: string
  /* Picker display name. */
  name: MessageDescriptor
  /* Linear-gradient stops, left to right (2+). */
  colors: string[]
  /* Representative solid fallback. */
  solid: string,
  /* Whether the name gradient was added by Kris, to tenna.party (not Mu) */
  notEurosky?: boolean,
  /* TBD */
  nameGradientCategory?: string
}

export const NAME_GRADIENTS: NameGradient[] = [
  {
    id: 'sunset',
    name: msg`Sunset`,
    colors: ['#FF9D2B', '#F2571F', '#DB4AA6'],
    solid: '#F2571F',
  },
  {
    id: 'ocean',
    name: msg`Ocean`,
    colors: ['#28ACDC', '#1C8DBA', '#6366F1'],
    solid: '#1C8DBA',
  },
  {
    id: 'aurora',
    name: msg`Aurora`,
    colors: ['#22C55E', '#14B8A6', '#28ACDC'],
    solid: '#14B8A6',
  },
  {
    id: 'rose',
    name: msg`Rose`,
    colors: ['#EF86CB', '#DB4AA6', '#A73981'],
    solid: '#DB4AA6',
  },
  {
    id: 'ember',
    name: msg`Ember`,
    colors: ['#F97316', '#EF4444', '#DB2777'],
    solid: '#EF4444',
  },
  {
    id: 'violet',
    name: msg`Violet`,
    colors: ['#8B5CF6', '#7C3AED', '#DB4AA6'],
    solid: '#7C3AED',
  },
  {
    id: 'rainbow',
    name: msg`Rainbow`,
    colors: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'],
    solid: '#7C3AED',
  },
  {
    id: 'trans',
    name: msg`Trans`,
    colors: ['#5BCEFA', '#F5A9B8', '#FFFFFF', '#F5A9B8', '#5BCEFA'],
    solid: '#F5A9B8',
    notEurosky: true,
    nameGradientCategory: "pride"
  },
  {
    id: 'enby',
    name: msg`Enby`,
    colors: ['#FFF433', '#FFFFFF', '#9B59D0', '#2D2D2D'],
    solid: '#FFF433',
    notEurosky: true,
    nameGradientCategory: "pride"
  },
]

export function getNameGradient(
  id: string | undefined,
): NameGradient | undefined {
  if (!id) return undefined
  return NAME_GRADIENTS.find(g => g.id === id)
}
