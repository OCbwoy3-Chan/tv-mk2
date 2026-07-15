import {type ComAtprotoServerDescribeServer} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'

const RQKEY_ROOT = 'service-describe'
export const RQKEY = (serviceUrl: string) => [RQKEY_ROOT, serviceUrl]

export function useServiceQuery(
  serviceUrl: string,
  opts?: {enabled?: boolean},
) {
  return useQuery({
    queryKey: RQKEY(serviceUrl),
    staleTime: STALE.HOURS.ONE,
    queryFn: async ({signal}) => {
      const base = serviceUrl.replace(/\/+$/, '')
      const res = await fetch(
        `${base}/xrpc/com.atproto.server.describeServer`,
        {
          signal,
          credentials: 'omit',
          headers: {accept: 'application/json'},
        },
      )
      if (!res.ok) {
        throw new Error(`describeServer failed with HTTP ${res.status}`)
      }
      return (await res.json()) as ComAtprotoServerDescribeServer.OutputSchema
    },
    enabled: isValidUrl(serviceUrl) && (opts?.enabled ?? true),
  })
}

function isValidUrl(url: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const urlp = new URL(url)
    return true
  } catch {
    return false
  }
}
