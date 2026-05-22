import {type BlobRef} from '@atproto/api'

export const PLURAL_FRONT_LOG_COLLECTION = 'host.plural.front.log'
export const PLURAL_SYSTEM_MEMBER_COLLECTION = 'host.plural.system.member'

export type PluralFrontLog = {
  $type: typeof PLURAL_FRONT_LOG_COLLECTION
  createdAt: string
  startedAt: string
  fronters?: string[]
  status?: string
}

export type PluralSystemMemberCustomField = {
  $type?: 'host.plural.system.member#customField'
  name: string
  value: string
}

export type PluralSystemMember = {
  $type: typeof PLURAL_SYSTEM_MEMBER_COLLECTION
  visibility: 'public' | 'private' | (string & {})
  createdAt: string
  updatedAt?: string
  name?: string
  displayName?: string
  pronouns?: string
  avatar?: BlobRef
  bio?: string
  colour?: string
  did?: string
  customFields?: PluralSystemMemberCustomField[]
}

export type PluralFrontingData = {
  pdsUrl: string
  fronters: PluralSystemMember[]
}
