/**
 * Linkat integration for Witchsky
 * Fetches and caches blue.linkat.board records
 */
import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export interface LinkatCard {
  url: string
  text: string
  emoji?: string
}

export interface LinkatBoard {
  cards: LinkatCard[]
}

interface LinkatBoardRecord {
  cards: Array<{
    url?: string
    text?: string
    emoji?: string
  }>
}

const LINKAT_COLLECTION = 'blue.linkat.board'
const LINKAT_RKEY = 'self'
const STALE_TIME = 5 * 60 * 1000 // 5 minutes
const CACHE_TIME = 10 * 60 * 1000 // 10 minutes

/**
 * Hook to fetch a user's Linkat board
 */
export function useLinkatBoardQuery(did: string | undefined) {
  const agent = useAgent()

  return useQuery({
    queryKey: ['linkat-board', did],
    queryFn: async () => {
      if (!did || !agent) return null

      try {
        const response = await agent.com.atproto.repo.getRecord({
          repo: did,
          collection: LINKAT_COLLECTION,
          rkey: LINKAT_RKEY,
        })

        if (!response.data.value || typeof response.data.value !== 'object') {
          return null
        }

        const value = response.data.value as LinkatBoardRecord
        if (!Array.isArray(value.cards)) {
          return null
        }

        return {
          cards: value.cards.map(card => ({
            url: card.url || '',
            text: card.text || '',
            emoji: card.emoji,
          })),
        }
      } catch (error) {
        // Return null if record not found or other error
        return null
      }
    },
    enabled: !!did && !!agent,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  })
}
