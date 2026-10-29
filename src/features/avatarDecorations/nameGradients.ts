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
  /** Use hard color bands instead of blending between colors. */
  segmented?: boolean
  /* Representative solid fallback. */
  solid: string
  /* Whether the name gradient was added by Kris, to tenna.party (not Mu) */
  notEurosky?: boolean
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

    notEurosky: true, // even tho its an eurosky one
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'progress',
    name: msg`Progress Pride`,
    colors: [
      '#FFFFFF',
      '#F5A9B8',
      '#5BCEFA',
      '#784F17',
      '#000000',
      '#E40303',
      '#FF8C00',
      '#FFED00',
      '#008026',
      '#004DFF',
      '#750787',
    ],
    solid: '#750787',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'lesbian',
    name: msg`Lesbian`,
    colors: [
      '#D52D00',
      '#EF7627',
      '#FF9A56',
      '#FFFFFF',
      '#D162A4',
      '#B55690',
      '#A30262',
    ],
    solid: '#FF9A56',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'mlm',
    name: msg`Gay`,
    colors: [
      '#078D70',
      '#26CEAA',
      '#98E8C1',
      '#FFFFFF',
      '#7BADE2',
      '#5049CC',
      '#3D1A78',
    ],
    solid: '#98E8C1',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'bisexual',
    name: msg`Bisexual`,
    colors: ['#D60270', '#D60270', '#9B4F96', '#0038A8', '#0038A8'],
    solid: '#9B4F96',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'trans',
    name: msg`Trans`,
    colors: ['#5BCEFA', '#F5A9B8', '#FFFFFF', '#F5A9B8', '#5BCEFA'],
    solid: '#F5A9B8',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'transfem',
    name: msg`Transfem`,
    colors: ['#73DEFF', '#FFE1ED', '#FFB5D6', '#FE8CBF', '#FFB5D6', '#FFE1ED', '#73DEFF'],
    solid: '#FE8CBF',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'transmasc',
    name: msg`Transmasc`,
    colors: ['#FF8ABD', '#CDF5FE', '#9AEBFF', '#74DFFF', '#9AEBFF', '#CDF5FE', '#FF8ABD'],
    solid: '#74DFFF',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'genderqueer',
    name: msg`Genderqueer`,
    colors: ['#B57EDC', '#FFFFFF', '#4A8123'],
    solid: '#8B50B6',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'intersex',
    name: msg`Intersex`,
    colors: ['#FFD800', '#FFD800', '#7902AA', '#FFD800', '#FFD800'],
    solid: '#7902AA',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'asexual',
    name: msg`Asexual`,
    colors: ['#000000', '#A3A3A3', '#FFFFFF', '#800080'],
    solid: '#800080',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'aromantic',
    name: msg`Aromantic`,
    colors: ['#3DA542', '#A7D379', '#FFFFFF', '#A9A9A9', '#000000'],
    solid: '#3DA542',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'agender',
    name: msg`Agender`,
    colors: [
      '#000000',
      '#B9B9B9',
      '#FFFFFF',
      '#B8F483',
      '#FFFFFF',
      '#B9B9B9',
      '#000000',
    ],
    solid: '#659C39',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'enby',
    name: msg`Non-binary`,
    colors: ['#FFF433', '#FFFFFF', '#9B59D0', '#2D2D2D'],
    solid: '#FFF433',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'genderfluid',
    name: msg`Genderfluid`,
    colors: ['#FF75A2', '#FFFFFF', '#BE18D6', '#000000', '#333EBD'],
    solid: '#BE18D6',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
  {
    id: 'pansexual',
    name: msg`Pansexual`,
    colors: ['#FF218C', '#FFD800', '#21B1FF'],
    solid: '#FF218C',
    notEurosky: true,
    segmented: true,
    nameGradientCategory: 'pride',
  },
]

export function getNameGradient(
  id: string | undefined,
): NameGradient | undefined {
  if (!id) return undefined
  return NAME_GRADIENTS.find(g => g.id === id)
}
