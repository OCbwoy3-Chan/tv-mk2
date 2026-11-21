import {parseCid} from '@atproto/lex'
import {useQuery} from '@tanstack/react-query'
import {loadAsync} from 'expo-font'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useDeltasPreferences} from '#/deltas/preferences'

const useGta6FontQueryRoot = 'gta6Font'

/** Load the viewer's chosen font blob from their own PDS. */
export function useGta6FontQuery() {
  const {currentAccount} = useSession()
  const {gta6Font, gta6FontBlobCid} = useDeltasPreferences()
  const did = currentAccount?.did
  const pds = currentAccount?.pdsUrl
  return useQuery({
    queryKey: createQueryKey(useGta6FontQueryRoot, {
      did,
      pds,
      cid: gta6FontBlobCid,
    }),
    enabled: gta6Font && !!did && !!pds && !!gta6FontBlobCid,
    staleTime: STALE.INFINITY,
    retry: false,
    async queryFn() {
      const parsed = parseCid(gta6FontBlobCid)
      if (
        parsed.version !== 1 ||
        parsed.code !== 0x55 ||
        parsed.multihash.code !== 0x12 ||
        parsed.multihash.digest.length !== 32
      ) {
        throw new Error('Invalid font blob CID')
      }
      const cid = parsed.toString()
      const url = new URL('/xrpc/com.atproto.sync.getBlob', pds!)
      url.searchParams.set('did', did!)
      url.searchParams.set('cid', cid)
      const family = `DeltasFont-${cid}`
      await loadAsync(family, url.toString())
      return family
    },
  })
}
