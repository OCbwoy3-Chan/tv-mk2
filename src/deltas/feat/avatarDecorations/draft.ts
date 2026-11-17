import {type AvatarShape} from './avatarShapes'
import {type DecorationSettings} from './records'

/**
 * Editable copy of the saved decorations. Nothing is written until Save, and
 * until the user touches something the draft simply mirrors the record so a
 * late-arriving read still shows up.
 */
export type DecorationDraft = {
  touched: boolean
  avatar?: string
  avatarShape?: AvatarShape
  name?: string
  nameOutline: boolean
}

export function draftFromSaved(saved: DecorationSettings): DecorationDraft {
  return {
    touched: false,
    avatar: saved.avatar,
    avatarShape: saved.avatarShape,
    name: saved.name,
    nameOutline: !!saved.nameOutline,
  }
}

/** The draft the screen should render: local edits win once touched. */
export function resolveDraft(
  draft: DecorationDraft,
  saved: DecorationSettings,
): DecorationDraft {
  return draft.touched ? draft : draftFromSaved(saved)
}

/**
 * Applies one edit. Choosing a slot captures the resolved values first, so the
 * untouched slots keep showing the saved record instead of resetting.
 */
export function applyDraftEdit(
  draft: DecorationDraft,
  saved: DecorationSettings,
  patch: Partial<Omit<DecorationDraft, 'touched'>>,
): DecorationDraft {
  const next = {...resolveDraft(draft, saved), ...patch, touched: true}
  if (!next.name) next.nameOutline = false
  return next
}

/** Whether the draft differs from the stored record in any slot. */
export function isDraftDirty(
  draft: DecorationDraft,
  saved: DecorationSettings,
): boolean {
  const resolved = resolveDraft(draft, saved)
  return (
    resolved.touched &&
    (resolved.avatar !== saved.avatar ||
      resolved.avatarShape !== saved.avatarShape ||
      resolved.name !== saved.name ||
      resolved.nameOutline !== !!saved.nameOutline)
  )
}

/** The patch to write for the resolved draft; undefined clears a slot. */
export function draftToPatch(
  draft: DecorationDraft,
  saved: DecorationSettings,
): DecorationSettings {
  const resolved = resolveDraft(draft, saved)
  return {
    avatar: resolved.avatar,
    avatarShape: resolved.avatarShape,
    name: resolved.name,
    nameOutline: resolved.nameOutline,
  }
}
