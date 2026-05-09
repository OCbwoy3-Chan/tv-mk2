export const AI_PREFERENCE_NSID = 'community.lexicon.preference.ai'

export type AIPreferenceCategory =
  | 'training'
  | 'inference'
  | 'syntheticContent'
  | 'embedding'

export const AI_PREFERENCE_CATEGORIES: AIPreferenceCategory[] = [
  'training',
  'inference',
  'syntheticContent',
  'embedding',
]

export type TriState = 'allow' | 'deny' | 'unset'

export type AIPreferenceField = {
  allow: boolean
  updatedAt: string
}

export type AIGlobalScope = {
  $type: 'community.lexicon.preference.ai#globalScope'
}

export type AIEntityScope = {
  $type: 'community.lexicon.preference.ai#entityScope'
  entity: string
}

export type AICollectionScope = {
  $type: 'community.lexicon.preference.ai#collectionScope'
  collection: string
}

export type AIPreferenceScope =
  | AIGlobalScope
  | AIEntityScope
  | AICollectionScope

export type AIPreferenceSet = {
  training?: AIPreferenceField
  inference?: AIPreferenceField
  syntheticContent?: AIPreferenceField
  embedding?: AIPreferenceField
}

export type AIPreferenceRecord = {
  $type: 'community.lexicon.preference.ai'
  updatedAt: string
  scope: AIPreferenceScope
  preferences: AIPreferenceSet
}

export type AIPreferenceTriStates = Record<AIPreferenceCategory, TriState>

export const DEFAULT_TRI_STATES: AIPreferenceTriStates = {
  training: 'unset',
  inference: 'unset',
  syntheticContent: 'unset',
  embedding: 'unset',
}

export function fieldToTriState(field: {allow: boolean} | undefined): TriState {
  if (!field) return 'unset'
  return field.allow ? 'allow' : 'deny'
}

export function preferenceSetToTriStates(
  set: AIPreferenceSet | undefined,
): AIPreferenceTriStates {
  if (!set) return {...DEFAULT_TRI_STATES}
  return {
    training: fieldToTriState(set.training),
    inference: fieldToTriState(set.inference),
    syntheticContent: fieldToTriState(set.syntheticContent),
    embedding: fieldToTriState(set.embedding),
  }
}

export type Patch = Partial<Record<AIPreferenceCategory, TriState>>

export function applyPatch(
  prev: AIPreferenceSet | undefined,
  patch: Patch,
  now: string,
): AIPreferenceSet {
  const next: AIPreferenceSet = {...(prev ?? {})}
  for (const category of AI_PREFERENCE_CATEGORIES) {
    const value = patch[category]
    if (value === undefined) continue
    if (value === 'unset') {
      delete next[category]
    } else {
      next[category] = {
        allow: value === 'allow',
        updatedAt: now,
      }
    }
  }
  return next
}

export function buildGlobalRecord(
  prev: AIPreferenceRecord | null | undefined,
  patch: Patch,
  now: string = new Date().toISOString(),
): AIPreferenceRecord {
  const preferences = applyPatch(prev?.preferences, patch, now)
  return {
    $type: 'community.lexicon.preference.ai',
    updatedAt: now,
    scope: {$type: 'community.lexicon.preference.ai#globalScope'},
    preferences,
  }
}
