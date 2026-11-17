export {AVATAR_SHAPES, type AvatarShape, hexagonPath} from './avatarShapes'
export {DECORATION_FRAMES, type DecorationFrame, getFrame} from './catalog'
export {
  applyDraftEdit,
  type DecorationDraft,
  draftFromSaved,
  draftToPatch,
  isDraftDirty,
  resolveDraft,
} from './draft'
export {
  getNameGradient,
  NAME_GRADIENTS,
  type NameGradient,
} from './nameGradients'
export {nameGradientTextStyle} from './nameGradientStyle'
export {
  type DecorationSettings,
  SETTINGS_COLLECTION,
  SETTINGS_RKEY,
} from './records'
export {
  useAvatarDecoration,
  useAvatarShape,
  useMyDecorationSettings,
  useMyDecorationSettingsQuery,
  useNameGradient,
  useNameStyle,
  useSetDecorations,
} from './useDecorations'
