import {
  TOKIMEKI_HOSTS,
  TOKIMEKI_POLL_COLLECTION,
  type TokimekiPollRef,
} from './types'

const DID_RE = /^did:[a-z]+:[a-zA-Z0-9._:%-]+$/
const RKEY_RE = /^[a-zA-Z0-9._:~-]{1,512}$/

/**
 * Reads a TOKIMEKI poll link, which posts carry as an ordinary external embed:
 * `https://poll.tokimeki.tech/p/<did>/<rkey>`. The `?options=` query is only a
 * layout hint for TOKIMEKI's own page, so it is ignored.
 */
export function parseTokimekiPollUrl(url: string): TokimekiPollRef | undefined {
  let urlp: URL
  try {
    urlp = new URL(url)
  } catch {
    return
  }
  if (!TOKIMEKI_HOSTS.includes(urlp.hostname)) return

  const parts = urlp.pathname.split('/').filter(Boolean)
  if (parts.length !== 3 || parts[0] !== 'p') return

  const [, did, rkey] = parts.map(part => decodeURIComponent(part))
  if (!DID_RE.test(did) || !RKEY_RE.test(rkey)) return
  return {did, rkey}
}

/**
 * A TOKIMEKI poll named in a link card's `associatedRefs`, so a poll is found
 * by its record rather than by recognising TOKIMEKI's web address.
 */
export function tokimekiPollFromRefs(
  refs: readonly {uri: string}[] | undefined,
): TokimekiPollRef | undefined {
  for (const ref of refs ?? []) {
    const match = /^at:\/\/([^/]+)\/([^/]+)\/([^/?#]+)$/.exec(ref.uri)
    if (!match) continue
    const [, did, collection, rkey] = match
    if (
      collection === TOKIMEKI_POLL_COLLECTION &&
      DID_RE.test(did) &&
      RKEY_RE.test(rkey)
    ) {
      return {did, rkey}
    }
  }
  return undefined
}

/**
 * The choices a TOKIMEKI link card lists in its description ("YES / NO"), for
 * drawing a poll at its real size while it loads. Two blanks if unreadable.
 */
export function choicesFromLinkCard(description: string | undefined): string[] {
  const named = (description ?? '')
    .split(' / ')
    .map(choice => choice.trim())
    .filter(Boolean)
  return named.length >= 2 && named.length <= 4 ? named : ['', '']
}
