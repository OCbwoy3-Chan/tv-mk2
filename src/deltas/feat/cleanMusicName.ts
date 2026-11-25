const extraTitleInfo = /^(?:from\s+["“].+["”].*|(?:\d{4}\s+)?(?:digital\s+)?re-?master(?:ed)?(?:\s+\d{4})?|(?:album|single|stereo|mono|credits|original)\s+version|(?:deluxe|expanded|bonus\s+track)\s+edition|(?:original\s+)?(?:(?:motion\s+picture|game)\s+)?(?:soundtrack|score)|official(?:\s+music)?\s+(?:video|audio)|lyrics?(?:\s+video)?)$/iu

export function cleanMusicName(
  value: string,
  kind: 'track' | 'artist' | 'album',
) {
  const name = value.normalize('NFC').replace(/\s+/gu, ' ').trim()
  if (kind === 'artist') return name || value

  const cleaned = name
    .replace(
      /\(([^()]*)\)|\[([^\[\]]*)\]/gu,
      (match: string, round: string | undefined, square: string | undefined) => {
        const annotation = (round ?? square ?? '').trim()
        return extraTitleInfo.test(annotation) ||
          (kind === 'track' && /^(?:feat(?:uring)?|ft)\.?\s+.+$/iu.test(annotation))
          ? ''
          : match
      },
    )
    .replace(/\s+[-–—]\s+from\s+["“].+["”].*$/iu, '')
    .replace(/\s+[-–—]\s+(?:\d{4}\s+)?(?:digital\s+)?re-?master(?:ed)?(?:\s+\d{4})?$/iu, '')
    .replace(/\s+/gu, ' ')
    .trim()

  return cleaned || name || value
}
