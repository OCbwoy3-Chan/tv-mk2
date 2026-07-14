import {type ComponentType} from 'react'

import {BSKY_SERVICE} from '#/lib/constants'
import {type Props as IconProps} from '#/components/icons/common'
import {BlackskyIcon} from '#/components/icons/providers/Blacksky'
import {BlueskyIcon} from '#/components/icons/providers/Bluesky'
import {EuroskyIcon} from '#/components/icons/providers/Eurosky'

export type SignupProviderId = 'bluesky' | 'blacksky' | 'eurosky' | 'custom'

export type SignupProvider = {
  id: SignupProviderId
  service: string
  Icon: ComponentType<IconProps> | null
  custom?: boolean
}

export const SIGNUP_PROVIDERS: SignupProvider[] = [
  {
    id: 'bluesky',
    service: BSKY_SERVICE,
    Icon: BlueskyIcon,
  },
  {
    id: 'blacksky',
    service: 'https://blacksky.app',
    Icon: BlackskyIcon,
  },
  {
    id: 'eurosky',
    service: 'https://eurosky.social',
    Icon: EuroskyIcon,
  },
  {
    id: 'custom',
    service: '',
    custom: true,
    Icon: null,
  },
]

/**
 * Normalize a custom PDS address into a full service URL.
 */
export function normalizePdsUrl(input: string): string {
  let url = input.trim().toLowerCase()
  if (!url) return ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url === 'localhost' || url.startsWith('localhost:')) {
      url = `http://${url}`
    } else {
      url = `https://${url}`
    }
  }
  return url
}
